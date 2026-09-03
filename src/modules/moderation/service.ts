import { eq, and, desc } from "drizzle-orm";
import type { AppDatabase } from "@/infrastructure/adapters/database/postgres";
import type { ModerationProviderPort } from "@/infrastructure/ports/moderation";
import { moderationCases } from "@/infrastructure/db/schema";
import { DEFAULT_TENANT_ID } from "@/infrastructure/db/schema";
import { AppError } from "@/shared/errors";

export class ModerationService {
  constructor(
    private readonly db: AppDatabase,
    private readonly provider: ModerationProviderPort
  ) {}

  async evaluateAndCreateCase(input: {
    subjectType: string;
    subjectId: string;
    text: string;
    locale: string;
  }) {
    const result = await this.provider.evaluate({
      text: input.text,
      locale: input.locale,
    });

    let decision: "pending" | "approved" | "rejected" = "pending";
    if (result.verdict === "block") decision = "rejected";
    else if (result.verdict === "allow") decision = "approved";

    const [caseRow] = await this.db
      .insert(moderationCases)
      .values({
        tenantId: DEFAULT_TENANT_ID,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        locale: input.locale,
        scores: result.scores,
        decision,
        reasonCode: result.reason ?? null,
        decidedAt: decision !== "pending" ? new Date() : null,
      })
      .returning();

    return { caseRow: caseRow!, result };
  }

  async listPending(limit = 50) {
    return this.db
      .select()
      .from(moderationCases)
      .where(eq(moderationCases.decision, "pending"))
      .orderBy(desc(moderationCases.createdAt))
      .limit(limit);
  }

  async decide(
    caseId: string,
    decision: "approved" | "rejected",
    adminId: string,
    reasonCode?: string
  ) {
    const [updated] = await this.db
      .update(moderationCases)
      .set({
        decision,
        decidedBy: adminId,
        reasonCode: reasonCode ?? null,
        decidedAt: new Date(),
      })
      .where(eq(moderationCases.id, caseId))
      .returning();

    if (!updated) {
      throw new AppError(
        "NOT_FOUND",
        "मॉडरेशन केस नहीं मिला।",
        "Moderation case not found.",
        404
      );
    }

    return updated;
  }

  async getCaseForSubject(subjectType: string, subjectId: string) {
    const [row] = await this.db
      .select()
      .from(moderationCases)
      .where(
        and(
          eq(moderationCases.subjectType, subjectType),
          eq(moderationCases.subjectId, subjectId)
        )
      )
      .orderBy(desc(moderationCases.createdAt))
      .limit(1);
    return row ?? null;
  }
}
