import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { DEFAULT_TENANT_ID } from "./platform";

export const manifestoItems = pgTable(
  "manifesto_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().default(DEFAULT_TENANT_ID),
    slug: varchar("slug", { length: 128 }).notNull(),
    theme: varchar("theme", { length: 64 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    titleHi: varchar("title_hi", { length: 256 }).notNull(),
    titleEn: varchar("title_en", { length: 256 }).notNull(),
    bodyHi: text("body_hi").notNull(),
    bodyEn: text("body_en").notNull(),
    imageKey: varchar("image_key", { length: 512 }),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("manifesto_slug_idx").on(t.slug),
    index("manifesto_tenant_idx").on(t.tenantId),
  ]
);

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().default(DEFAULT_TENANT_ID),
    slug: varchar("slug", { length: 64 }).notNull(),
    titleHi: varchar("title_hi", { length: 256 }).notNull(),
    titleEn: varchar("title_en", { length: 256 }).notNull(),
    bodyHi: text("body_hi").notNull(),
    bodyEn: text("body_en").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pages_slug_idx").on(t.tenantId, t.slug)]
);
