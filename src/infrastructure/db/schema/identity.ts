import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { DEFAULT_TENANT_ID } from "./platform";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().default(DEFAULT_TENANT_ID),
    phoneE164: varchar("phone_e164", { length: 20 }).notNull(),
    name: varchar("name", { length: 128 }),
    locale: varchar("locale", { length: 8 }).notNull().default("hi"),
    role: varchar("role", { length: 32 }).notNull().default("resident"),
    wardSelfDeclared: boolean("ward_self_declared").notNull().default(false),
    verifiedElector: boolean("verified_elector").notNull().default(false),
    bannedAt: timestamp("banned_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("users_phone_idx").on(t.phoneE164),
    index("users_tenant_idx").on(t.tenantId),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    userAgentHash: varchar("user_agent_hash", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)]
);
