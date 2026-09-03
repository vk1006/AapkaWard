import { z } from "zod";
import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";
import { requireAdmin } from "@/shared/auth";

export async function GET() {
  try {
    await requireAdmin();
    const { issues, adminComments } = getContainer();
    const items = await issues.listAllForAdmin();
    const commentsMap = await adminComments.listGroupedBySubject(
      "issue",
      items.map((item) => item.id)
    );
    return jsonOk({
      items: items.map((item) => ({
        ...item,
        comments: commentsMap.get(item.id) ?? [],
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

const decideSchema = z.object({
  issueId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = decideSchema.parse(await request.json());
    const { issues } = getContainer();
    const result = await issues.adminDecide(body.issueId, body.decision, admin.id);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return jsonError({
        code: "INVALID_REQUEST",
        messageHi: "आईडी आवश्यक है।",
        messageEn: "ID is required.",
        status: 400,
      });
    }
    const { issues } = getContainer();
    await issues.adminDelete(id, admin.id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
