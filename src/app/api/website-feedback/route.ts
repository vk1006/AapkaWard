import { z } from "zod";
import { getContainer } from "@/infrastructure/container";
import { jsonError, jsonOk } from "@/shared/api-response";
import { AppError } from "@/shared/errors";

const schema = z.object({
  name: z.string().trim().max(80).optional().default(""),
  email: z.union([z.literal(""), z.string().email().max(254)]).optional().default(""),
  message: z.string().trim().min(10).max(1000),
  website: z.string().max(0).optional().default(""),
});

function visitorKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const address = forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  return `website-feedback:${address}`;
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    if (body.website) return jsonOk({ sent: true });

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    const to = process.env.WEBSITE_FEEDBACK_TO;
    if (!apiKey || !from || !to) {
      throw new AppError(
        "EMAIL_NOT_CONFIGURED",
        "फीडबैक सेवा अभी उपलब्ध नहीं है।",
        "Feedback email is not configured yet.",
        503
      );
    }

    const { platform } = getContainer();
    const allowed = await platform.checkRateLimit(visitorKey(request), 5, 15);
    if (!allowed) {
      throw new AppError(
        "RATE_LIMITED",
        "कृपया कुछ देर बाद फिर से प्रयास करें।",
        "Please try again in a few minutes.",
        429
      );
    }

    const text = [
      "New website feedback from Aapka Ward 20",
      "",
      `Name: ${body.name || "Not provided"}`,
      `Email: ${body.email || "Not provided"}`,
      "",
      "Message:",
      body.message,
    ].join("\n");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Website feedback — Aapka Ward 20",
        text,
      }),
    });

    if (!response.ok) {
      console.error("Feedback email delivery failed", response.status, await response.text());
      throw new AppError(
        "EMAIL_DELIVERY_FAILED",
        "फीडबैक भेजा नहीं जा सका। कृपया फिर से प्रयास करें।",
        "Feedback could not be sent. Please try again.",
        502
      );
    }

    return jsonOk({ sent: true }, 202);
  } catch (error) {
    return jsonError(error);
  }
}
