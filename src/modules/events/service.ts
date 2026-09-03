import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import type { AppDatabase } from "@/infrastructure/adapters/database/postgres";
import type { ClockPort } from "@/infrastructure/ports/clock";
import { events, eventRsvps } from "@/infrastructure/db/schema";
import { DEFAULT_TENANT_ID } from "@/infrastructure/db/schema";
import { AppError } from "@/shared/errors";
import type { RsvpStatus } from "@/shared/types";

export class EventsService {
  constructor(
    private readonly db: AppDatabase,
    private readonly clock: ClockPort
  ) {}

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
    if (data.id) {
      const [updated] = await this.db
        .update(events)
        .set({ ...data, updatedAt: this.clock.now() })
        .where(eq(events.id, data.id))
        .returning();
      return updated!;
    }

    const [created] = await this.db
      .insert(events)
      .values({ tenantId: DEFAULT_TENANT_ID, ...data })
      .returning();
    return created!;
  }

  async adminDelete(id: string) {
    const [event] = await this.db.select().from(events).where(eq(events.id, id)).limit(1);
    if (!event) {
      throw new AppError("NOT_FOUND", "कार्यक्रम नहीं मिला।", "Event not found.", 404);
    }
    await this.db.delete(events).where(eq(events.id, id));
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

    const [existing] = await this.db
      .select()
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)))
      .limit(1);

    if (existing) {
      const [updated] = await this.db
        .update(eventRsvps)
        .set({
          status,
          version: existing.version + 1,
          updatedAt: this.clock.now(),
        })
        .where(eq(eventRsvps.id, existing.id))
        .returning();
      return updated!;
    }

    const [created] = await this.db
      .insert(eventRsvps)
      .values({ eventId, userId, status })
      .returning();
    return created!;
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
