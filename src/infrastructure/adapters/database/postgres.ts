import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { DatabasePort } from "@/infrastructure/ports/database";
import { schema } from "@/infrastructure/db/schema";

export type AppDatabase = PostgresJsDatabase<typeof schema>;

export class PostgresDatabaseAdapter implements DatabasePort {
  private readonly client: ReturnType<typeof postgres>;
  private readonly db: AppDatabase;

  constructor(connectionString: string) {
    this.client = postgres(connectionString, { max: 10 });
    this.db = drizzle(this.client, { schema });
  }

  getDb(): AppDatabase {
    return this.db;
  }

  async transaction<T>(fn: (tx: AppDatabase) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => fn(tx as AppDatabase));
  }

  async close(): Promise<void> {
    await this.client.end();
  }
}

let singleton: PostgresDatabaseAdapter | null = null;

export function getDatabaseAdapter(): PostgresDatabaseAdapter {
  if (!singleton) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    singleton = new PostgresDatabaseAdapter(url);
  }
  return singleton;
}
