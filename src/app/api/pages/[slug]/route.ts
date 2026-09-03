import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";
import { AppError } from "@/shared/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { content } = getContainer();
    const page = await content.getPage(slug);
    if (!page) {
      throw new AppError("NOT_FOUND", "पृष्ठ नहीं मिला।", "Page not found.", 404);
    }
    return jsonOk(page);
  } catch (error) {
    return jsonError(error);
  }
}
