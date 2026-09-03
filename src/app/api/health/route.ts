import { sql } from "drizzle-orm";
import { getContainer } from "@/infrastructure/container";
import { jsonOk } from "@/shared/api-response";

export async function GET() {
  const { database, platform } = getContainer();
  try {
    await database.getDb().execute(sql`SELECT 1`);
    await platform.ensureDefaults();
    return jsonOk({ status: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    return jsonOk({ status: "degraded", error: String(error) }, 503);
  }
}
