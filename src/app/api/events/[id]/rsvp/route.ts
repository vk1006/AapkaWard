import { z } from "zod";
import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";
import { requireUser } from "@/shared/auth";

const schema = z.object({
  status: z.enum(["going", "maybe", "not_going"]),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = schema.parse(await request.json());
    const { events } = getContainer();
    const rsvp = await events.upsertRsvp(id, user.id, body.status);
    // Return the database count rather than asking the browser to calculate it.
    // This remains correct when other residents RSVP at the same time.
    return jsonOk({ rsvp, goingCount: await events.getGoingCount(id) });
  } catch (error) {
    return jsonError(error);
  }
}
