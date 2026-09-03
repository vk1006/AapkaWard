import { z } from "zod";
import { getContainer } from "@/infrastructure/container";
import { jsonOk, jsonError } from "@/shared/api-response";
import { requireUser } from "@/shared/auth";
import { classifyMediaKind, type IssueMediaInput } from "@/modules/issues/media";
import { AppError } from "@/shared/errors";

const jsonSchema = z.object({
  body: z.string().min(10).max(2000),
  category: z.string().min(1).max(64),
  landmark: z.string().max(256).optional(),
  locale: z.enum(["hi", "en"]).default("hi"),
});

async function parseMediaFiles(formData: FormData): Promise<IssueMediaInput[]> {
  const files: IssueMediaInput[] = [];

  for (const [name, value] of formData.entries()) {
    if (name !== "media" || !(value instanceof File) || value.size === 0) continue;

    const contentType = value.type || "application/octet-stream";
    const kind = classifyMediaKind(contentType);
    if (!kind) {
      throw new AppError(
        "INVALID_MEDIA",
        "केवल JPEG, PNG, WebP, MP4 या WebM फ़ाइलें स्वीकार हैं।",
        "Only JPEG, PNG, WebP, MP4, or WebM files are accepted.",
        400
      );
    }

    files.push({
      buffer: Buffer.from(await value.arrayBuffer()),
      contentType,
      size: value.size,
      kind,
    });
  }

  return files;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { issues } = getContainer();
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const body = jsonSchema.parse({
        body: String(formData.get("body") ?? ""),
        category: String(formData.get("category") ?? ""),
        landmark: formData.get("landmark") ? String(formData.get("landmark")) : undefined,
        locale: String(formData.get("locale") ?? "hi"),
      });
      const media = await parseMediaFiles(formData);
      const issue = await issues.create({ userId: user.id, ...body, media });
      return jsonOk(issue, 201);
    }

    const body = jsonSchema.parse(await request.json());
    const issue = await issues.create({ userId: user.id, ...body });
    return jsonOk(issue, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    const { issues } = getContainer();
    const items = await issues.listApproved();
    return jsonOk({ items });
  } catch (error) {
    return jsonError(error);
  }
}
