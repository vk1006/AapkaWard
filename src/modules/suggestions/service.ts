import { eq, and, desc } from "drizzle-orm";
import type { AppDatabase } from "@/infrastructure/adapters/database/postgres";
import type { ClockPort } from "@/infrastructure/ports/clock";
import { suggestions } from "@/infrastructure/db/schema";
import { DEFAULT_TENANT_ID } from "@/infrastructure/db/schema";
import type { ModerationService } from "@/modules/moderation/service";
import type { PlatformService } from "@/modules/platform/service";
import type { AdminCommentsService } from "@/modules/admin-comments/service";
import { AppError } from "@/shared/errors";

export class SuggestionsService {
  constructor(
    private readonly db: AppDatabase,
    private readonly moderation: ModerationService,
    private readonly platform: PlatformService,
    private readonly clock: ClockPort,
    private readonly adminComments: AdminCommentsService
  ) {}

  async submit(input: {
    userId: string;
    category: string;
    body: string;
    landmark?: string;
    locale: string;
  }) {
    if (await this.platform.isContentFrozen()) {
      throw new AppError(
        "CONTENT_FROZEN",
        "सामग्री अस्थायी रूप से बंद है।",
        "Content submissions are temporarily frozen.",
        403
      );
    }

    const allowed = await this.platform.checkRateLimit(
      `suggestion:${input.userId}`,
      3,
      24 * 60
    );
    if (!allowed) {
      throw new AppError(
        "RATE_LIMIT",
        "आप दिन में अधिकतम 3 सुझाव भेज सकते हैं।",
        "You can submit at most 3 suggestions per day.",
        429
      );
    }

    const [row] = await this.db
      .insert(suggestions)
      .values({
        tenantId: DEFAULT_TENANT_ID,
        userId: input.userId,
        category: input.category,
        body: input.body,
        landmark: input.landmark ?? null,
        locale: input.locale,
        moderationStatus: "pending",
      })
      .returning();

    const { result } = await this.moderation.evaluateAndCreateCase({
      subjectType: "suggestion",
      subjectId: row!.id,
      text: input.body,
      locale: input.locale,
    });

    let status: "pending" | "approved" | "rejected" = "pending";
    if (result.verdict === "block") status = "rejected";
    else if (result.verdict === "allow") status = "approved";

    const [updated] = await this.db
      .update(suggestions)
      .set({
        moderationStatus: status,
        publishedAt: status === "approved" ? this.clock.now() : null,
      })
      .where(eq(suggestions.id, row!.id))
      .returning();

    return updated!;
  }

  async listApproved(cursor?: string, limit = 50) {
    const rows = await this.db
      .select()
      .from(suggestions)
      .where(
        and(
          eq(suggestions.tenantId, DEFAULT_TENANT_ID),
          eq(suggestions.moderationStatus, "approved")
        )
      )
      .orderBy(desc(suggestions.publishedAt))
      .limit(limit + 1);

    const items = rows.slice(0, limit);
    const nextCursor = rows.length > limit ? items[items.length - 1]?.id ?? null : null;
    const commentsMap = await this.adminComments.listGroupedBySubject(
      "suggestion",
      items.map((item) => item.id)
    );

    return {
      items: items.map((item) => ({
        ...item,
        comments: commentsMap.get(item.id) ?? [],
      })),
      nextCursor,
    };
  }

  async listAllForAdmin(status?: string) {
    if (status) {
      return this.db
        .select()
        .from(suggestions)
        .where(eq(suggestions.moderationStatus, status))
        .orderBy(desc(suggestions.createdAt));
    }
    return this.db.select().from(suggestions).orderBy(desc(suggestions.createdAt));
  }

  async adminDecide(
    suggestionId: string,
    decision: "approved" | "rejected",
    adminId: string
  ) {
    const modCase = await this.moderation.getCaseForSubject("suggestion", suggestionId);
    if (modCase && modCase.decision === "pending") {
      await this.moderation.decide(modCase.id, decision, adminId);
    }

    const [updated] = await this.db
      .update(suggestions)
      .set({
        moderationStatus: decision,
        publishedAt: decision === "approved" ? this.clock.now() : null,
      })
      .where(eq(suggestions.id, suggestionId))
      .returning();

    if (!updated) {
      throw new AppError("NOT_FOUND", "सुझाव नहीं मिला।", "Suggestion not found.", 404);
    }

    await this.platform.audit(adminId, "suggestion.moderate", "suggestion", suggestionId, {
      decision,
    });

    return updated;
  }

  async adminDelete(suggestionId: string, adminId: string) {
    await this.adminComments.deleteForSubject("suggestion", suggestionId);

    const [deleted] = await this.db
      .delete(suggestions)
      .where(eq(suggestions.id, suggestionId))
      .returning();

    if (!deleted) {
      throw new AppError("NOT_FOUND", "सुझाव नहीं मिला।", "Suggestion not found.", 404);
    }

    await this.platform.audit(adminId, "suggestion.delete", "suggestion", suggestionId);
    return deleted;
  }
}
