import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";
import { getSessionIdFromCookies, clearSessionCookie } from "@/shared/session-cookie";

export async function POST() {
  try {
    const sessionId = await getSessionIdFromCookies();
    if (sessionId) {
      const { identity } = getContainer();
      await identity.logout(sessionId);
    }
    const response = jsonOk({ ok: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
