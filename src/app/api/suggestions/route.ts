import { z } from "zod";
import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";
import { requireUser } from "@/shared/auth";

const schema = z.object({
  category: z.string().min(1).max(64),
  body: z.string().min(10).max(500),
  landmark: z.string().max(256).optional(),
  locale: z.enum(["hi", "en"]).default("hi"),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await request.json());
    const { suggestions } = getContainer();
    const result = await suggestions.submit({
      userId: user.id,
      ...body,
    });
    return jsonOk(result, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const { suggestions } = getContainer();
    const result = await suggestions.listApproved(cursor ?? undefined);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
