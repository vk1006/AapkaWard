import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const { events } = getContainer();
    const items = await events.listPublic(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined
    );
    return jsonOk({ items });
  } catch (error) {
    return jsonError(error);
  }
}
