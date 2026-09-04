import { eq, and, sql } from "drizzle-orm";
import type { AppDatabase } from "@/infrastructure/adapters/database/postgres";
import type { ClockPort } from "@/infrastructure/ports/clock";
import type { EventBusPort } from "@/infrastructure/ports/event-bus";
import {
  featureFlags,
  auditEvents,
  rateLimits,
  DEFAULT_TENANT_ID,
} from "@/infrastructure/db/schema";

const DEFAULT_FLAGS: Record<string, { enabled: boolean; payload?: Record<string, unknown> }> = {
  issues: { enabled: false },
  petitions: { enabled: false },
  content_freeze: { enabled: false },
  public_suggestion_wall: { enabled: false },
  events: { enabled: false },
  suggestions: { enabled: false },
};

export class PlatformService {
  private static readonly flagCache = new Map<string, { value: boolean; expiresAt: number }>();

  constructor(
    private readonly db: AppDatabase,
    private readonly clock: ClockPort,
    private readonly eventBus: EventBusPort
  ) {}

  clearCache(key?: string): void {
    if (key) {
      PlatformService.flagCache.delete(key);
    } else {
      PlatformService.flagCache.clear();
    }
  }

  async ensureDefaults(): Promise<void> {
    await Promise.all(
      Object.entries(DEFAULT_FLAGS).map(([key, value]) =>
        this.db
          .insert(featureFlags)
          .values({ key, enabled: value.enabled, payload: value.payload ?? {} })
          .onConflictDoNothing()
      )
    );
  }

  async isEnabled(key: string): Promise<boolean> {
    const now = Date.now();
    const cached = PlatformService.flagCache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const [row] = await this.db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.key, key))
      .limit(1);
    const value = row?.enabled ?? DEFAULT_FLAGS[key]?.enabled ?? false;
    PlatformService.flagCache.set(key, { value, expiresAt: now + 30_000 });
    return value;
  }

  async requireEnabled(key: string): Promise<void> {
    if (!(await this.isEnabled(key))) {
      const { AppError } = await import("@/shared/errors");
      throw new AppError(
        "FEATURE_DISABLED",
        "यह सुविधा अभी उपलब्ध नहीं है।",
        "This feature is not available yet.",
        404
      );
    }
  }

  async getAllFlags() {
    await this.ensureDefaults();
    return this.db.select().from(featureFlags);
  }

  async setFlag(key: string, enabled: boolean, actorId?: string) {
    this.clearCache(key);

    await this.db
      .insert(featureFlags)
      .values({ key, enabled, payload: {} })
      .onConflictDoUpdate({
        target: featureFlags.key,
        set: { enabled, updatedAt: this.clock.now() },
      });

    this.clearCache(key);

    await this.audit(actorId, "flag.update", "feature_flag", key, { enabled });
  }

  async isContentFrozen(): Promise<boolean> {
    return this.isEnabled("content_freeze");
  }

  async checkRateLimit(key: string, limit: number, windowMinutes: number): Promise<boolean> {
    const now = this.clock.now();
    const windowStart = new Date(
      now.getTime() - (now.getTime() % (windowMinutes * 60 * 1000))
    );

    const [existing] = await this.db
      .select()
      .from(rateLimits)
      .where(and(eq(rateLimits.key, key), eq(rateLimits.windowStart, windowStart)))
      .limit(1);

    if (!existing) {
      await this.db.insert(rateLimits).values({ key, windowStart, count: 1 });
      return true;
    }

    if (existing.count >= limit) return false;

    await this.db
      .update(rateLimits)
      .set({ count: sql`${rateLimits.count} + 1` })
      .where(eq(rateLimits.id, existing.id));

    return true;
  }

  async audit(
    actorId: string | undefined,
    action: string,
    entityType: string,
    entityId: string,
    meta: Record<string, unknown> = {}
  ) {
    await this.db.insert(auditEvents).values({
      tenantId: DEFAULT_TENANT_ID,
      actorId: actorId ?? null,
      action,
      entityType,
      entityId,
      meta,
    });

    await this.eventBus.publish({
      topic: "audit.created",
      payload: { action, entityType, entityId },
    });
  }
}
