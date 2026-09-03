export interface OtpVerifyResult {
  phone: string;
}

export interface OtpPort {
  verifyIdToken(idToken: string): Promise<OtpVerifyResult>;
  verifyCode?(phone: string, code: string): Promise<OtpVerifyResult>;
}
