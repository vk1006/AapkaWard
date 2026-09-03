import { NextRequest } from "next/server";
import { z } from "zod";
import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";
import { setSessionCookie } from "@/shared/session-cookie";
import { Errors } from "@/shared/errors";

const schema = z.object({
  idToken: z.string().optional(),
  phone: z.string().optional(),
  code: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const { otp, identity } = getContainer();
    const adapter = process.env.OTP_ADAPTER ?? "mock";

    let phone: string;

    if (adapter === "mock" && body.phone && body.code) {
      const mockOtp = otp as import("@/infrastructure/adapters/otp/mock").MockOtpAdapter;
      if (!mockOtp.verifyCode) throw Errors.invalidRequest();
      const result = await mockOtp.verifyCode(body.phone, body.code);
      phone = result.phone;
    } else if (body.idToken) {
      const result = await otp.verifyIdToken(body.idToken);
      phone = result.phone;
    } else {
      throw Errors.invalidRequest();
    }

    const { user, sessionId, expiresAt } = await identity.loginWithPhone(
      phone,
      request.headers.get("user-agent")
    );

    const response = jsonOk({
      user: {
        id: user.id,
        phone: user.phoneE164,
        name: user.name,
        role: user.role,
        locale: user.locale,
      },
    });

    setSessionCookie(response, sessionId, expiresAt);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
