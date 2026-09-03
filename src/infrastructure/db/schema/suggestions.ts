import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { DEFAULT_TENANT_ID } from "./platform";

export const moderationCases = pgTable(
  "moderation_cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().default(DEFAULT_TENANT_ID),
    subjectType: varchar("subject_type", { length: 32 }).notNull(),
    subjectId: uuid("subject_id").notNull(),
    locale: varchar("locale", { length: 8 }).notNull().default("hi"),
    scores: jsonb("scores").$type<Record<string, number>>().default({}),
    decision: varchar("decision", { length: 32 }).notNull().default("pending"),
    decidedBy: uuid("decided_by"),
    reasonCode: varchar("reason_code", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (t) => [
    index("moderation_subject_idx").on(t.subjectType, t.subjectId),
    index("moderation_decision_idx").on(t.decision),
    index("moderation_pending_created_idx").on(t.decision, t.createdAt),
  ]
);

export const suggestions = pgTable(
  "suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().default(DEFAULT_TENANT_ID),
    userId: uuid("user_id").notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    body: text("body").notNull(),
    landmark: varchar("landmark", { length: 256 }),
    locale: varchar("locale", { length: 8 }).notNull().default("hi"),
    moderationStatus: varchar("moderation_status", { length: 32 })
      .notNull()
      .default("pending"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("suggestions_status_idx").on(t.moderationStatus),
    index("suggestions_user_idx").on(t.userId),
    index("suggestions_approved_list_idx").on(
      t.tenantId,
      t.moderationStatus,
      t.publishedAt
    ),
    index("suggestions_admin_list_idx").on(t.moderationStatus, t.createdAt),
    index("suggestions_created_idx").on(t.createdAt),
  ]
);
