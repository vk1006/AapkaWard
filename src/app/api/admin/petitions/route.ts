import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";
import { requireAdmin } from "@/shared/auth";

export async function GET() {
  try {
    await requireAdmin();
    const { petitions } = getContainer();
    const items = await petitions.listAllForAdmin();
    return jsonOk({ items });
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
    const { petitions } = getContainer();
    await petitions.adminDelete(id, admin.id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
