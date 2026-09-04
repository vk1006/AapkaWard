import { z } from "zod";
import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";
import { requireAdmin } from "@/shared/auth";

export async function GET() {
  try {
    await requireAdmin();
    const { content } = getContainer();
    const items = await content.listPages();
    return jsonOk({ items });
  } catch (error) {
    return jsonError(error);
  }
}

const schema = z.object({
  slug: z.string().min(1),
  titleHi: z.string().min(1),
  titleEn: z.string().min(1),
  bodyHi: z.string().min(1),
  bodyEn: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const { content } = getContainer();
    const page = await content.upsertPage(body);
    return jsonOk(page);
  } catch (error) {
    return jsonError(error);
  }
}
