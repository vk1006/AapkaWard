import { eq, sql, and, desc } from "drizzle-orm";
import type { AppDatabase } from "@/infrastructure/adapters/database/postgres";
import type { ClockPort } from "@/infrastructure/ports/clock";
import type { EventBusPort } from "@/infrastructure/ports/event-bus";
import { petitions, petitionSignatures, issues } from "@/infrastructure/db/schema";
import { DEFAULT_TENANT_ID } from "@/infrastructure/db/schema";
import type { PlatformService } from "@/modules/platform/service";
import { AppError } from "@/shared/errors";
import type { PetitionStatus } from "@/shared/types";

export class PetitionsService {
  constructor(
    private readonly db: AppDatabase,
    private readonly platform: PlatformService,
    private readonly eventBus: EventBusPort,
    private readonly clock: ClockPort
  ) {}

  async requireFeature() {
    await this.platform.requireEnabled("petitions");
  }

  async createFromIssue(input: {
    issueId: string;
    authorityName: string;
    askHi: string;
    askEn: string;
    threshold: number;
    deadline?: Date;
    adminId: string;
  }) {
    await this.requireFeature();

    const [issue] = await this.db
      .select()
      .from(issues)
      .where(eq(issues.id, input.issueId))
      .limit(1);

    if (!issue || issue.lifecycle !== "beyond_panch") {
      throw new AppError(
        "INVALID_ISSUE",
        "याचिका केवल 'पंच की सीमा से बाहर' समस्याओं के लिए बनाई जा सकती है।",
        "Petitions can only be created for issues marked beyond panch scope.",
        400
      );
    }

    const [petition] = await this.db
      .insert(petitions)
      .values({
        tenantId: DEFAULT_TENANT_ID,
        issueId: input.issueId,
        authorityName: input.authorityName,
        askHi: input.askHi,
        askEn: input.askEn,
        threshold: input.threshold,
        deadline: input.deadline ?? null,
        status: "collecting",
      })
      .returning();

    await this.db
      .update(issues)
      .set({ petitionId: petition!.id })
      .where(eq(issues.id, input.issueId));

    await this.platform.audit(
      input.adminId,
      "petition.create",
      "petition",
      petition!.id,
      { issueId: input.issueId }
    );

    return petition!;
  }

  async getWithProgress(id: string) {
    await this.requireFeature();

    const [petition] = await this.db
      .select()
      .from(petitions)
      .where(eq(petitions.id, id))
      .limit(1);

    if (!petition) return null;

    const [count] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(petitionSignatures)
      .where(eq(petitionSignatures.petitionId, id));

    return { ...petition, signatureCount: count?.count ?? 0 };
  }

  async sign(petitionId: string, userId: string, displayPublic: boolean) {
    await this.requireFeature();

    const petition = await this.getWithProgress(petitionId);
    if (!petition || petition.status !== "collecting") {
      throw new AppError(
        "PETITION_CLOSED",
        "याचिका पर हस्ताक्षर स्वीकार नहीं किए जा रहे।",
        "This petition is not accepting signatures.",
        400
      );
    }

    try {
      await this.db.insert(petitionSignatures).values({
        petitionId,
        userId,
        displayPublic,
      });
    } catch {
      throw new AppError(
        "ALREADY_SIGNED",
        "आप पहले ही हस्ताक्षर कर चुके हैं।",
        "You have already signed this petition.",
        409
      );
    }

    const updated = await this.getWithProgress(petitionId);
    if (updated && updated.signatureCount >= updated.threshold) {
      await this.db
        .update(petitions)
        .set({ status: "threshold_met", updatedAt: this.clock.now() })
        .where(eq(petitions.id, petitionId));

      await this.eventBus.publish({
        topic: "PetitionThresholdMet",
        payload: { petitionId },
      });
    }

    return updated!;
  }

  async markSent(
    petitionId: string,
    proofFileKey: string,
    adminId: string
  ) {
    await this.requireFeature();

    const [updated] = await this.db
      .update(petitions)
      .set({
        status: "sent" as PetitionStatus,
        proofFileKey,
        sentAt: this.clock.now(),
        updatedAt: this.clock.now(),
      })
      .where(and(eq(petitions.id, petitionId), eq(petitions.status, "threshold_met")))
      .returning();

    if (!updated) {
      throw new AppError(
        "INVALID_STATE",
        "याचिका भेजने की स्थिति में नहीं है।",
        "Petition is not in a state to be marked as sent.",
        409
      );
    }

    await this.platform.audit(adminId, "petition.sent", "petition", petitionId, {
      proofFileKey,
    });

    return updated;
  }

  async listAllForAdmin() {
    return this.db.select().from(petitions).orderBy(desc(petitions.createdAt));
  }

  async adminDelete(petitionId: string, adminId: string) {
    const [petition] = await this.db
      .select()
      .from(petitions)
      .where(eq(petitions.id, petitionId))
      .limit(1);

    if (!petition) {
      throw new AppError("NOT_FOUND", "याचिका नहीं मिली।", "Petition not found.", 404);
    }

    await this.db
      .update(issues)
      .set({ petitionId: null })
      .where(eq(issues.petitionId, petitionId));

    await this.db.delete(petitions).where(eq(petitions.id, petitionId));

    await this.platform.audit(adminId, "petition.delete", "petition", petitionId);
    return petition;
  }
}
