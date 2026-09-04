import { eq, and, gte, lte, sql, desc, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/infrastructure/adapters/database/postgres";
import type { ClockPort } from "@/infrastructure/ports/clock";
import { events, eventRsvps } from "@/infrastructure/db/schema";
import { DEFAULT_TENANT_ID } from "@/infrastructure/db/schema";
import { AppError } from "@/shared/errors";
import type { RsvpStatus } from "@/shared/types";

export type PublicEventWithCount = typeof events.$inferSelect & { goingCount: number };

export class EventsService {
  private static publicEventsCache: PublicEventWithCount[] | null = null;
  private static publicEventsCacheExpiresAt = 0;

  static clearCache(): void {
    EventsService.publicEventsCache = null;
    EventsService.publicEventsCacheExpiresAt = 0;
  }

  constructor(
    private readonly db: AppDatabase,
    private readonly clock: ClockPort
  ) {}

  async listPublicWithCounts(from?: Date, to?: Date): Promise<PublicEventWithCount[]> {
    const isDefaultQuery = !from && !to;
    const now = Date.now();
    if (isDefaultQuery && EventsService.publicEventsCache && EventsService.publicEventsCacheExpiresAt > now) {
      return EventsService.publicEventsCache;
    }

    const conditions = [
      eq(events.tenantId, DEFAULT_TENANT_ID),
      eq(events.published, true),
    ];
    if (from) conditions.push(gte(events.startsAt, from));
    if (to) conditions.push(lte(events.startsAt, to));

    const eventList = await this.db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(events.startsAt);

    if (eventList.length === 0) {
      if (isDefaultQuery) {
        EventsService.publicEventsCache = [];
        EventsService.publicEventsCacheExpiresAt = now + 60_000;
      }
      return [];
    }

    const eventIds = eventList.map((e) => e.id);
    const rsvpCounts = await this.db
      .select({
        eventId: eventRsvps.eventId,
        goingCount: sql<number>`count(*)::int`,
      })
      .from(eventRsvps)
      .where(and(inArray(eventRsvps.eventId, eventIds), eq(eventRsvps.status, "going")))
      .groupBy(eventRsvps.eventId);

    const countMap = new Map(rsvpCounts.map((r) => [r.eventId, r.goingCount]));
    const result: PublicEventWithCount[] = eventList.map((e) => ({
      ...e,
      goingCount: countMap.get(e.id) ?? 0,
    }));

    if (isDefaultQuery) {
      EventsService.publicEventsCache = result;
      EventsService.publicEventsCacheExpiresAt = now + 60_000;
    }

    return result;
  }

  async listPublic(from?: Date, to?: Date) {
    const conditions = [
      eq(events.tenantId, DEFAULT_TENANT_ID),
      eq(events.published, true),
    ];
    if (from) conditions.push(gte(events.startsAt, from));
    if (to) conditions.push(lte(events.startsAt, to));

    return this.db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(events.startsAt);
  }

  async getById(id: string, includeCounts = true) {
    const [event] = await this.db.select().from(events).where(eq(events.id, id)).limit(1);
    if (!event) return null;

    if (!includeCounts) return { ...event, goingCount: 0 };

    const [count] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, id), eq(eventRsvps.status, "going")));

    return { ...event, goingCount: count?.count ?? 0 };
  }

  async upsert(data: {
    id?: string;
    titleHi: string;
    titleEn: string;
    bodyHi: string;
    bodyEn: string;
    startsAt: Date;
    endsAt?: Date;
    placeText: string;
    mapUrl?: string;
    capacity?: number;
    published: boolean;
  }) {
    EventsService.clearCache();
    if (data.id) {
      const [updated] = await this.db
        .update(events)
        .set({ ...data, updatedAt: this.clock.now() })
        .where(eq(events.id, data.id))
        .returning();
      EventsService.clearCache();
      return updated!;
    }

    const [created] = await this.db
      .insert(events)
      .values({ tenantId: DEFAULT_TENANT_ID, ...data })
      .returning();
    EventsService.clearCache();
    return created!;
  }

  async adminDelete(id: string) {
    const [event] = await this.db.select().from(events).where(eq(events.id, id)).limit(1);
    if (!event) {
      throw new AppError("NOT_FOUND", "कार्यक्रम नहीं मिला।", "Event not found.", 404);
    }
    await this.db.delete(events).where(eq(events.id, id));
    EventsService.clearCache();
    return event;
  }

  async listAll() {
    return this.db
      .select()
      .from(events)
      .where(eq(events.tenantId, DEFAULT_TENANT_ID))
      .orderBy(desc(events.startsAt));
  }

  async upsertRsvp(eventId: string, userId: string, status: RsvpStatus) {
    const event = await this.getById(eventId, false);
    if (!event || !event.published) {
      throw new AppError("NOT_FOUND", "कार्यक्रम नहीं मिला।", "Event not found.", 404);
    }

    // One SQL upsert prevents duplicate rows or a failed request when a user
    // submits twice from separate tabs at the same time.
    const [rsvp] = await this.db
      .insert(eventRsvps)
      .values({ eventId, userId, status })
      .onConflictDoUpdate({
        target: [eventRsvps.eventId, eventRsvps.userId],
        set: {
          status,
          version: sql`${eventRsvps.version} + 1`,
          updatedAt: this.clock.now(),
        },
      })
      .returning();
    EventsService.clearCache();
    return rsvp!;
  }

  async getGoingCount(eventId: string): Promise<number> {
    const [count] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.status, "going")));
    return count?.count ?? 0;
  }

  async getUserRsvp(eventId: string, userId: string) {
    const [row] = await this.db
      .select()
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)))
      .limit(1);
    return row ?? null;
  }
}
