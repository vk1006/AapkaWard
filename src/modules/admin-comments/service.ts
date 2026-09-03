import { and, asc, eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/infrastructure/adapters/database/postgres";
import { adminComments } from "@/infrastructure/db/schema/admin-comments";
import { suggestions } from "@/infrastructure/db/schema/suggestions";
import { issues } from "@/infrastructure/db/schema/issues";
import { DEFAULT_TENANT_ID } from "@/infrastructure/db/schema";
import type { PlatformService } from "@/modules/platform/service";
import { AppError } from "@/shared/errors";

export type AdminCommentSubjectType = "suggestion" | "issue";

export type AdminCommentView = {
  id: string;
  body: string;
  createdAt: Date;
};

export class AdminCommentsService {
  constructor(
    private readonly db: AppDatabase,
    private readonly platform: PlatformService
  ) {}

  async listForSubject(
    subjectType: AdminCommentSubjectType,
    subjectId: string
  ): Promise<AdminCommentView[]> {
    const rows = await this.db
      .select({
        id: adminComments.id,
        body: adminComments.body,
        createdAt: adminComments.createdAt,
      })
      .from(adminComments)
      .where(
        and(
          eq(adminComments.tenantId, DEFAULT_TENANT_ID),
          eq(adminComments.subjectType, subjectType),
          eq(adminComments.subjectId, subjectId)
        )
      )
      .orderBy(asc(adminComments.createdAt));

    return rows;
  }

  async listGroupedBySubject(
    subjectType: AdminCommentSubjectType,
    subjectIds: string[]
  ): Promise<Map<string, AdminCommentView[]>> {
    const map = new Map<string, AdminCommentView[]>();
    if (subjectIds.length === 0) return map;

    const rows = await this.db
      .select({
        id: adminComments.id,
        subjectId: adminComments.subjectId,
        body: adminComments.body,
        createdAt: adminComments.createdAt,
      })
      .from(adminComments)
      .where(
        and(
          eq(adminComments.tenantId, DEFAULT_TENANT_ID),
          eq(adminComments.subjectType, subjectType),
          inArray(adminComments.subjectId, subjectIds)
        )
      )
      .orderBy(asc(adminComments.createdAt));

    for (const row of rows) {
      const list = map.get(row.subjectId) ?? [];
      list.push({ id: row.id, body: row.body, createdAt: row.createdAt });
      map.set(row.subjectId, list);
    }

    return map;
  }

  async add(
    subjectType: AdminCommentSubjectType,
    subjectId: string,
    adminId: string,
    body: string
  ): Promise<AdminCommentView> {
    const trimmed = body.trim();
    if (!trimmed) {
      throw new AppError(
        "INVALID_REQUEST",
        "टिप्पणी खाली नहीं हो सकती।",
        "Comment cannot be empty.",
        400
      );
    }
    if (trimmed.length > 2000) {
      throw new AppError(
        "INVALID_REQUEST",
        "टिप्पणी बहुत लंबी है।",
        "Comment is too long.",
        400
      );
    }

    await this.ensureSubjectExists(subjectType, subjectId);

    const [row] = await this.db
      .insert(adminComments)
      .values({
        tenantId: DEFAULT_TENANT_ID,
        subjectType,
        subjectId,
        adminId,
        body: trimmed,
      })
      .returning({
        id: adminComments.id,
        body: adminComments.body,
        createdAt: adminComments.createdAt,
      });

    await this.platform.audit(adminId, `${subjectType}.comment`, subjectType, subjectId, {
      commentId: row!.id,
    });

    return row!;
  }

  async deleteForSubject(subjectType: AdminCommentSubjectType, subjectId: string) {
    await this.db
      .delete(adminComments)
      .where(
        and(
          eq(adminComments.subjectType, subjectType),
          eq(adminComments.subjectId, subjectId)
        )
      );
  }

  private async ensureSubjectExists(subjectType: AdminCommentSubjectType, subjectId: string) {
    if (subjectType === "suggestion") {
      const [row] = await this.db
        .select({ id: suggestions.id })
        .from(suggestions)
        .where(eq(suggestions.id, subjectId))
        .limit(1);
      if (!row) {
        throw new AppError("NOT_FOUND", "सुझाव नहीं मिला।", "Suggestion not found.", 404);
      }
      return;
    }

    const [row] = await this.db
      .select({ id: issues.id })
      .from(issues)
      .where(eq(issues.id, subjectId))
      .limit(1);
    if (!row) {
      throw new AppError("NOT_FOUND", "समस्या नहीं मिली।", "Issue not found.", 404);
    }
  }
}
