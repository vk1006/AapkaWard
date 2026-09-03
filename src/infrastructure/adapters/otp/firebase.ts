import type { OtpPort, OtpVerifyResult } from "@/infrastructure/ports/otp";
import { Errors } from "@/shared/errors";

type LookupResponse = {
  users?: Array<{ phoneNumber?: string }>;
  error?: { message?: string; code?: number };
};

/**
 * Verify Firebase phone-auth idTokens via Identity Toolkit REST API.
 * Avoids firebase-admin (jose/jwks ESM issues on Vercel serverless).
 */
export class FirebaseOtpAdapter implements OtpPort {
  async verifyIdToken(idToken: string): Promise<OtpVerifyResult> {
    const apiKey =
      process.env.FIREBASE_WEB_API_KEY ??
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (!apiKey) {
      console.error("[firebase] missing FIREBASE_WEB_API_KEY / NEXT_PUBLIC_FIREBASE_API_KEY");
      throw Errors.invalidOtp();
    }

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    const data = (await res.json()) as LookupResponse;

    if (!res.ok) {
      console.error(
        "[firebase] accounts:lookup failed:",
        data.error?.message ?? res.status
      );
      throw Errors.invalidOtp();
    }

    const phone = data.users?.[0]?.phoneNumber;
    if (!phone) {
      console.error("[firebase] accounts:lookup returned no phoneNumber");
      throw Errors.invalidOtp();
    }

    return { phone };
  }
}
