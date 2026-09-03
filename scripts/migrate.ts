import "./load-env";
import postgres from "postgres";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1 });
  const migrationsDir = join(process.cwd(), "drizzle/migrations");
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const migration = readFileSync(join(migrationsDir, file), "utf-8");
    console.log(`Running ${file}...`);
    await sql.unsafe(migration);
  }

  await sql.end();
  console.log("Migration completed.");
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
