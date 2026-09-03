import { eq, desc, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { AppDatabase } from "@/infrastructure/adapters/database/postgres";
import { issues, issueMedia } from "@/infrastructure/db/schema";
import { DEFAULT_TENANT_ID } from "@/infrastructure/db/schema";
import type { FileStorePort } from "@/infrastructure/ports/file-store";
import type { ModerationService } from "@/modules/moderation/service";
import type { PlatformService } from "@/modules/platform/service";
import type { AdminCommentsService, AdminCommentView } from "@/modules/admin-comments/service";
import {
  extForContentType,
  validateIssueMedia,
  type IssueMediaInput,
} from "@/modules/issues/media";
import { AppError } from "@/shared/errors";
import { publicFileUrl } from "@/shared/file-url";
import type { IssueLifecycle } from "@/shared/types";

const VALID_TRANSITIONS: Record<IssueLifecycle, IssueLifecycle[]> = {
  received: ["in_progress", "resolved", "beyond_panch"],
  in_progress: ["resolved", "beyond_panch"],
  resolved: [],
  beyond_panch: [],
};

export type IssueMediaView = {
  id: string;
  kind: string;
  url: string;
};

export type IssueListItem = {
  id: string;
  body: string;
  category: string;
  landmark: string | null;
  lifecycle: string;
  createdAt: Date;
  comments: AdminCommentView[];
  media: IssueMediaView[];
};

export class IssuesService {
  constructor(
    private readonly db: AppDatabase,
    private readonly moderation: ModerationService,
    private readonly platform: PlatformService,
    private readonly fileStore: FileStorePort,
    private readonly adminComments: AdminCommentsService
  ) {}

  async requireFeature() {
    await this.platform.requireEnabled("issues");
  }

  async create(input: {
    userId: string;
    body: string;
    category: string;
    landmark?: string;
    locale: string;
    media?: IssueMediaInput[];
  }) {
    await this.requireFeature();

    const mediaFiles = input.media ?? [];
    validateIssueMedia(mediaFiles);

    const [row] = await this.db
      .insert(issues)
      .values({
        tenantId: DEFAULT_TENANT_ID,
        userId: input.userId,
        body: input.body,
        category: input.category,
        landmark: input.landmark ?? null,
        moderationStatus: "pending",
        lifecycle: "received",
      })
      .returning();

    for (const file of mediaFiles) {
      const key = `issues/${row!.id}/${randomUUID()}.${extForContentType(file.contentType)}`;
      await this.fileStore.put(key, file.buffer, {
        contentType: file.contentType,
        size: file.size,
      });
      await this.db.insert(issueMedia).values({
        issueId: row!.id,
        storeKey: key,
        kind: file.kind,
        bytes: file.size,
        scanStatus: "approved",
      });
    }

    const { result } = await this.moderation.evaluateAndCreateCase({
      subjectType: "issue",
      subjectId: row!.id,
      text: input.body,
      locale: input.locale,
    });

    let status: "pending" | "approved" | "rejected" = "approved";
    if (result.verdict === "block") status = "rejected";

    const [updated] = await this.db
      .update(issues)
      .set({ moderationStatus: status })
      .where(eq(issues.id, row!.id))
      .returning();

    return updated!;
  }

  async listApproved(): Promise<IssueListItem[]> {
    await this.requireFeature();

    const rows = await this.db
      .select()
      .from(issues)
      .where(eq(issues.moderationStatus, "approved"))
      .orderBy(desc(issues.createdAt));

    if (rows.length === 0) return [];

    const issueIds = rows.map((r) => r.id);
    const mediaRows = await this.db
      .select()
      .from(issueMedia)
      .where(inArray(issueMedia.issueId, issueIds));

    const mediaByIssue = new Map<string, IssueMediaView[]>();
    for (const media of mediaRows) {
      const list = mediaByIssue.get(media.issueId) ?? [];
      list.push({
        id: media.id,
        kind: media.kind,
        url: publicFileUrl(media.storeKey),
      });
      mediaByIssue.set(media.issueId, list);
    }

    const commentsMap = await this.adminComments.listGroupedBySubject("issue", issueIds);

    return rows.map((issue) => ({
      id: issue.id,
      body: issue.body,
      category: issue.category,
      landmark: issue.landmark,
      lifecycle: issue.lifecycle,
      createdAt: issue.createdAt,
      comments: commentsMap.get(issue.id) ?? [],
      media: mediaByIssue.get(issue.id) ?? [],
    }));
  }

  async listAllForAdmin(status?: string) {
    if (status) {
      return this.db
        .select()
        .from(issues)
        .where(eq(issues.moderationStatus, status))
        .orderBy(desc(issues.createdAt));
    }
    return this.db.select().from(issues).orderBy(desc(issues.createdAt));
  }

  async adminDecide(
    issueId: string,
    decision: "approved" | "rejected",
    adminId: string
  ) {
    const modCase = await this.moderation.getCaseForSubject("issue", issueId);
    if (modCase && modCase.decision === "pending") {
      await this.moderation.decide(modCase.id, decision, adminId);
    }

    const [updated] = await this.db
      .update(issues)
      .set({
        moderationStatus: decision,
        updatedAt: new Date(),
      })
      .where(eq(issues.id, issueId))
      .returning();

    if (!updated) {
      throw new AppError("NOT_FOUND", "समस्या नहीं मिली।", "Issue not found.", 404);
    }

    await this.platform.audit(adminId, "issue.moderate", "issue", issueId, { decision });
    return updated;
  }

  async adminDelete(issueId: string, adminId: string) {
    const mediaRows = await this.db
      .select()
      .from(issueMedia)
      .where(eq(issueMedia.issueId, issueId));

    for (const media of mediaRows) {
      await this.fileStore.delete(media.storeKey);
    }

    await this.adminComments.deleteForSubject("issue", issueId);

    const [deleted] = await this.db.delete(issues).where(eq(issues.id, issueId)).returning();

    if (!deleted) {
      throw new AppError("NOT_FOUND", "समस्या नहीं मिली।", "Issue not found.", 404);
    }

    await this.platform.audit(adminId, "issue.delete", "issue", issueId);
    return deleted;
  }

  async transition(
    issueId: string,
    to: IssueLifecycle,
    adminId: string,
    version: number
  ) {
    await this.requireFeature();

    const [issue] = await this.db.select().from(issues).where(eq(issues.id, issueId)).limit(1);
    if (!issue) {
      throw new AppError("NOT_FOUND", "समस्या नहीं मिली।", "Issue not found.", 404);
    }

    const from = issue.lifecycle as IssueLifecycle;
    if (!VALID_TRANSITIONS[from]?.includes(to)) {
      throw new AppError(
        "INVALID_TRANSITION",
        "यह स्थिति परिवर्तन अनुमत नहीं है।",
        "This status transition is not allowed.",
        409
      );
    }

    if (issue.version !== version) {
      throw new AppError(
        "STALE_VERSION",
        "डेटा अपडेट हो चुका है। पृष्ठ रीफ़्रेश करें।",
        "Data was updated. Please refresh the page.",
        409
      );
    }

    const [updated] = await this.db
      .update(issues)
      .set({
        lifecycle: to,
        version: issue.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(issues.id, issueId))
      .returning();

    await this.platform.audit(adminId, "issue.transition", "issue", issueId, { from, to });
    return updated!;
  }
}
