import type { OtpPort, OtpVerifyResult } from "@/infrastructure/ports/otp";
import { Errors } from "@/shared/errors";

const MOCK_CODE = "123456";

export class MockOtpAdapter implements OtpPort {
  async verifyIdToken(idToken: string): Promise<OtpVerifyResult> {
    if (idToken.startsWith("mock:")) {
      return { phone: idToken.slice(5) };
    }
    throw Errors.invalidOtp();
  }

  async verifyCode(phone: string, code: string): Promise<OtpVerifyResult> {
    if (code.trim() !== MOCK_CODE) throw Errors.invalidOtp();
    return { phone };
  }
}
