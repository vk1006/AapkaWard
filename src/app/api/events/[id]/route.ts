import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";
import { getCurrentUser } from "@/shared/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { events } = getContainer();
    const event = await events.getById(id);
    if (!event) {
      return jsonError({
        code: "NOT_FOUND",
        messageHi: "कार्यक्रम नहीं मिला।",
        messageEn: "Event not found.",
        status: 404,
      });
    }

    const user = await getCurrentUser();
    let userRsvp = null;
    if (user) {
      userRsvp = await events.getUserRsvp(id, user.id);
    }

    return jsonOk({ event, userRsvp });
  } catch (error) {
    return jsonError(error);
  }
}
