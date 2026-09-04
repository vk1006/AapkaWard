import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";
import { requireAdmin } from "@/shared/auth";

export async function GET() {
  try {
    await requireAdmin();
    const { events } = getContainer();
    const items = await events.listAll();
    return jsonOk({ items });
  } catch (error) {
    return jsonError(error);
  }
}

const schema = z.object({
  id: z.string().uuid().optional(),
  titleHi: z.string().min(1),
  titleEn: z.string().min(1),
  bodyHi: z.string().min(1),
  bodyEn: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  placeText: z.string().min(1),
  mapUrl: z.string().url().optional(),
  capacity: z.number().int().positive().optional(),
  published: z.boolean(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const { events } = getContainer();
    const item = await events.upsert({
      ...body,
      startsAt: new Date(body.startsAt),
      endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
    });
    revalidatePath("/events");
    revalidatePath("/[locale]/events", "page");
    return jsonOk(item, body.id ? 200 : 201);
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
    const { events, platform } = getContainer();
    await events.adminDelete(id);
    await platform.audit(admin.id, "event.delete", "event", id);
    revalidatePath("/events");
    revalidatePath("/[locale]/events", "page");
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
