import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, isAppError } from "@/shared/errors";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

function logClientError(code: string, status: number, message: string) {
  console.warn(`[${status}] ${code}: ${message}`);
}

export function jsonError(error: unknown) {
  if (isAppError(error)) {
    if (error.status >= 500) {
      console.error(`[${error.status}] ${error.code}`, error);
    } else {
      logClientError(error.code, error.status, error.messageEn);
    }
    return NextResponse.json(
      {
        error: {
          code: error.code,
          messageHi: error.messageHi,
          messageEn: error.messageEn,
        },
      },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    logClientError("VALIDATION_ERROR", 400, error.message);
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          messageHi: "भरा गया डेटा सही नहीं है।",
          messageEn: "The submitted data is not valid.",
        },
      },
      { status: 400 }
    );
  }

  console.error("[500] INTERNAL_ERROR", error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        messageHi: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
        messageEn: "Something went wrong. Please try again.",
      },
    },
    { status: 500 }
  );
}
