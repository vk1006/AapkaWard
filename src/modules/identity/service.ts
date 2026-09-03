import { eq, and, isNull, gt } from "drizzle-orm";
import { createHash } from "crypto";
import type { AppDatabase } from "@/infrastructure/adapters/database/postgres";
import type { ClockPort } from "@/infrastructure/ports/clock";
import { users, sessions, DEFAULT_TENANT_ID } from "@/infrastructure/db/schema";
import { AppError } from "@/shared/errors";
import { SESSION_TTL_DAYS, type UserRole } from "@/shared/types";

function hashUserAgent(ua: string | null): string | null {
  if (!ua) return null;
  return createHash("sha256").update(ua).digest("hex").slice(0, 64);
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, "");
  if (!cleaned.startsWith("+")) return `+${cleaned}`;
  return cleaned;
}

function resolveRole(phone: string): UserRole {
  const adminPhones = (process.env.ADMIN_PHONES ?? "")
    .split(",")
    .map((p) => normalizePhone(p.trim()))
    .filter(Boolean);
  if (adminPhones.includes(normalizePhone(phone))) return "admin";
  return "resident";
}

export class IdentityService {
  constructor(
    private readonly db: AppDatabase,
    private readonly clock: ClockPort
  ) {}

  async loginWithPhone(phone: string, userAgent: string | null) {
    const phoneE164 = normalizePhone(phone);

    const [existing] = await this.db
      .select()
      .from(users)
      .where(eq(users.phoneE164, phoneE164))
      .limit(1);

    let user = existing;
    if (!user) {
      const [created] = await this.db
        .insert(users)
        .values({
          tenantId: DEFAULT_TENANT_ID,
          phoneE164,
          role: resolveRole(phoneE164),
          locale: "hi",
        })
        .returning();
      user = created!;
    } else if (user.bannedAt) {
      throw new AppError(
        "USER_BANNED",
        "आपका खाता निलंबित है।",
        "Your account is suspended.",
        403
      );
    } else {
      const role = resolveRole(phoneE164);
      if (user.role !== role) {
        const [updated] = await this.db
          .update(users)
          .set({ role })
          .where(eq(users.id, user.id))
          .returning();
        user = updated!;
      }
    }

    const expiresAt = new Date(this.clock.now());
    expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

    const [session] = await this.db
      .insert(sessions)
      .values({
        userId: user.id,
        expiresAt,
        userAgentHash: hashUserAgent(userAgent),
      })
      .returning();

    return { user, sessionId: session!.id, expiresAt };
  }

  async getSession(sessionId: string) {
    const now = this.clock.now();
    const [row] = await this.db
      .select({
        session: sessions,
        user: users,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.id, sessionId),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, now)
        )
      )
      .limit(1);

    if (!row || row.user.bannedAt) return null;
    return { session: row.session, user: row.user };
  }

  async logout(sessionId: string) {
    await this.db
      .update(sessions)
      .set({ revokedAt: this.clock.now() })
      .where(eq(sessions.id, sessionId));
  }

  async updateProfile(
    userId: string,
    data: { name?: string; locale?: string; wardSelfDeclared?: boolean }
  ) {
    const [updated] = await this.db
      .update(users)
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.locale !== undefined ? { locale: data.locale } : {}),
        ...(data.wardSelfDeclared !== undefined
          ? { wardSelfDeclared: data.wardSelfDeclared }
          : {}),
      })
      .where(eq(users.id, userId))
      .returning();
    return updated!;
  }

  requireRole(user: { role: string }, roles: UserRole[]) {
    if (!roles.includes(user.role as UserRole)) {
      throw new AppError(
        "FORBIDDEN",
        "आपको यह कार्य करने की अनुमति नहीं है।",
        "You do not have permission to perform this action.",
        403
      );
    }
  }
}
