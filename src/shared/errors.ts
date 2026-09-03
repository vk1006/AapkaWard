export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly messageHi: string,
    public readonly messageEn: string,
    public readonly status: number = 400
  ) {
    super(messageEn);
    this.name = "AppError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export const Errors = {
  invalidOtp: () =>
    new AppError(
      "INVALID_OTP",
      "लॉगिन पूरा नहीं हो सका। OTP फिर से भेजें और पुनः प्रयास करें।",
      "Could not complete login. Send OTP again and retry.",
      401
    ),
  invalidRequest: () =>
    new AppError("INVALID_REQUEST", "अमान्य अनुरोध।", "Invalid request.", 400),
};
