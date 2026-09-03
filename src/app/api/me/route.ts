import { z } from "zod";
import { getCurrentUser, requireUser } from "@/shared/auth";
import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonOk({ user: null });
    return jsonOk({
      user: {
        id: user.id,
        phone: user.phoneE164,
        name: user.name,
        role: user.role,
        locale: user.locale,
        wardSelfDeclared: user.wardSelfDeclared,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

const patchSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  locale: z.enum(["hi", "en"]).optional(),
  wardSelfDeclared: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = patchSchema.parse(await request.json());
    const { identity } = getContainer();
    const updated = await identity.updateProfile(user.id, body);
    return jsonOk({
      id: updated.id,
      phone: updated.phoneE164,
      name: updated.name,
      role: updated.role,
      locale: updated.locale,
      wardSelfDeclared: updated.wardSelfDeclared,
    });
  } catch (error) {
    return jsonError(error);
  }
}
