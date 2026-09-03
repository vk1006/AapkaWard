import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { DEFAULT_TENANT_ID } from "./platform";

export const adminComments = pgTable(
  "admin_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().default(DEFAULT_TENANT_ID),
    subjectType: varchar("subject_type", { length: 32 }).notNull(),
    subjectId: uuid("subject_id").notNull(),
    adminId: uuid("admin_id").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("admin_comments_subject_idx").on(t.subjectType, t.subjectId),
    index("admin_comments_subject_created_idx").on(
      t.subjectType,
      t.subjectId,
      t.createdAt
    ),
    index("admin_comments_created_idx").on(t.createdAt),
  ]
);
