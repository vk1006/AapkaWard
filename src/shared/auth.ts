import { cookies } from "next/headers";
import { getContainer } from "@/infrastructure/container";
import { SESSION_COOKIE } from "@/shared/types";
import { AppError } from "@/shared/errors";
import type { UserRole } from "@/shared/types";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const { identity } = getContainer();
  const session = await identity.getSession(sessionId);
  if (!session) return null;

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AppError(
      "UNAUTHORIZED",
      "कृपया लॉगिन करें।",
      "Please log in.",
      401
    );
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const { identity } = getContainer();
  identity.requireRole(user, ["admin"]);
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();
  const { identity } = getContainer();
  identity.requireRole(user, roles);
  return user;
}
