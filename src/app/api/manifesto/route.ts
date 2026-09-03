import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";

export async function GET() {
  try {
    const { content } = getContainer();
    const items = await content.listManifesto(true);
    return jsonOk({ items });
  } catch (error) {
    return jsonError(error);
  }
}
