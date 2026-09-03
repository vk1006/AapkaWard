import { z } from "zod";
import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";
import { requireUser } from "@/shared/auth";

const schema = z.object({
  displayPublic: z.boolean().default(false),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = schema.parse(await request.json());
    const { petitions } = getContainer();
    const result = await petitions.sign(id, user.id, body.displayPublic);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
