import { z } from "zod";
import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";
import { requireAdmin } from "@/shared/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { adminComments } = getContainer();
    const items = await adminComments.listForSubject("issue", id);
    return jsonOk({ items });
  } catch (error) {
    return jsonError(error);
  }
}

const addSchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = addSchema.parse(await request.json());
    const { adminComments } = getContainer();
    const comment = await adminComments.add("issue", id, admin.id, body.body);
    return jsonOk(comment);
  } catch (error) {
    return jsonError(error);
  }
}
