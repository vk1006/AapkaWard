import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { DEFAULT_TENANT_ID } from "./platform";

export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().default(DEFAULT_TENANT_ID),
    userId: uuid("user_id").notNull(),
    body: text("body").notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    landmark: varchar("landmark", { length: 256 }),
    moderationStatus: varchar("moderation_status", { length: 32 })
      .notNull()
      .default("pending"),
    lifecycle: varchar("lifecycle", { length: 32 }).notNull().default("received"),
    duplicateOfId: uuid("duplicate_of_id"),
    petitionId: uuid("petition_id"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("issues_lifecycle_idx").on(t.lifecycle),
    index("issues_user_idx").on(t.userId),
    index("issues_status_created_idx").on(t.moderationStatus, t.createdAt),
    index("issues_petition_id_idx").on(t.petitionId),
  ]
);

export const issueMedia = pgTable(
  "issue_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    storeKey: varchar("store_key", { length: 512 }).notNull(),
    kind: varchar("kind", { length: 16 }).notNull(),
    bytes: integer("bytes").notNull(),
    scanStatus: varchar("scan_status", { length: 32 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("issue_media_issue_idx").on(t.issueId)]
);
