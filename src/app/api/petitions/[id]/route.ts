import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { petitions } = getContainer();
    const petition = await petitions.getWithProgress(id);
    if (!petition) {
      const { AppError } = await import("@/shared/errors");
      throw new AppError("NOT_FOUND", "याचिका नहीं मिली।", "Petition not found.", 404);
    }
    return jsonOk(petition);
  } catch (error) {
    return jsonError(error);
  }
}
