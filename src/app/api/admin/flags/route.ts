import { z } from "zod";
import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";
import { requireAdmin } from "@/shared/auth";

export async function GET() {
  try {
    await requireAdmin();
    const { platform } = getContainer();
    const flags = await platform.getAllFlags();
    return jsonOk({ flags });
  } catch (error) {
    return jsonError(error);
  }
}

const schema = z.object({
  key: z.string(),
  enabled: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = schema.parse(await request.json());
    const { platform } = getContainer();
    await platform.setFlag(body.key, body.enabled, admin.id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
