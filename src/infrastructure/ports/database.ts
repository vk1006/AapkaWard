import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export type DbSchema = Record<string, unknown>;

export interface DatabasePort {
  getDb(): PostgresJsDatabase<DbSchema>;
  transaction<T>(fn: (tx: PostgresJsDatabase<DbSchema>) => Promise<T>): Promise<T>;
}
