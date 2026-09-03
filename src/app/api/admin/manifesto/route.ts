import { z } from "zod";
import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";
import { requireAdmin } from "@/shared/auth";

export async function GET() {
  try {
    await requireAdmin();
    const { content } = getContainer();
    const items = await content.listManifesto(false);
    return jsonOk({ items });
  } catch (error) {
    return jsonError(error);
  }
}

const schema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  theme: z.string().min(1),
  sortOrder: z.number().int(),
  titleHi: z.string().min(1),
  titleEn: z.string().min(1),
  bodyHi: z.string().min(1),
  bodyEn: z.string().min(1),
  published: z.boolean(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const { content } = getContainer();
    const item = await content.upsertManifesto(body);
    return jsonOk(item, body.id ? 200 : 201);
  } catch (error) {
    return jsonError(error);
  }
}
