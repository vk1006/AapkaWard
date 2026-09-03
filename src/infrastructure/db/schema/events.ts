import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { DEFAULT_TENANT_ID } from "./platform";

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().default(DEFAULT_TENANT_ID),
    titleHi: varchar("title_hi", { length: 256 }).notNull(),
    titleEn: varchar("title_en", { length: 256 }).notNull(),
    bodyHi: text("body_hi").notNull(),
    bodyEn: text("body_en").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    placeText: varchar("place_text", { length: 512 }).notNull(),
    mapUrl: varchar("map_url", { length: 1024 }),
    capacity: integer("capacity"),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("events_starts_idx").on(t.startsAt),
    index("events_tenant_idx").on(t.tenantId),
    index("events_public_list_idx").on(t.tenantId, t.published, t.startsAt),
    index("events_admin_list_idx").on(t.tenantId, t.startsAt),
  ]
);

export const eventRsvps = pgTable(
  "event_rsvps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    status: varchar("status", { length: 16 }).notNull(),
    version: integer("version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("event_rsvp_unique_idx").on(t.eventId, t.userId),
    index("event_rsvps_event_status_idx").on(t.eventId, t.status),
  ]
);
