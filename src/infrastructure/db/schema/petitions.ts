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
import { issues } from "./issues";

export const petitions = pgTable(
  "petitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().default(DEFAULT_TENANT_ID),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    authorityName: varchar("authority_name", { length: 256 }).notNull(),
    askHi: text("ask_hi").notNull(),
    askEn: text("ask_en").notNull(),
    threshold: integer("threshold").notNull(),
    deadline: timestamp("deadline", { withTimezone: true }),
    status: varchar("status", { length: 32 }).notNull().default("collecting"),
    proofFileKey: varchar("proof_file_key", { length: 512 }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("petitions_issue_unique_idx").on(t.issueId),
    index("petitions_status_idx").on(t.status),
  ]
);

export const petitionSignatures = pgTable(
  "petition_signatures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    petitionId: uuid("petition_id")
      .notNull()
      .references(() => petitions.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    displayPublic: boolean("display_public").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("petition_sign_unique_idx").on(t.petitionId, t.userId)]
);
