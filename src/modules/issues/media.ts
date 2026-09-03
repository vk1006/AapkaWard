import { AppError } from "@/shared/errors";

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 20 * 1024 * 1024;
export const MAX_PHOTOS = 3;
export const MAX_VIDEOS = 1;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"] as const;
export const ACCEPTED_MEDIA_ACCEPT = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(",");

const IMAGE_TYPES = new Set<string>(ACCEPTED_IMAGE_TYPES);
const VIDEO_TYPES = new Set<string>(ACCEPTED_VIDEO_TYPES);

export function classifyMediaKind(contentType: string): "photo" | "video" | null {
  if (IMAGE_TYPES.has(contentType)) return "photo";
  if (VIDEO_TYPES.has(contentType)) return "video";
  return null;
}

export type IssueMediaInput = {
  buffer: Buffer;
  contentType: string;
  size: number;
  kind: "photo" | "video";
};

export function extForContentType(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
  };
  return map[contentType] ?? "bin";
}

export function mimeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    mp4: "video/mp4",
    webm: "video/webm",
  };
  return map[ext ?? ""] ?? "application/octet-stream";
}

export function validateIssueMedia(files: IssueMediaInput[]): void {
  const photos = files.filter((f) => f.kind === "photo");
  const videos = files.filter((f) => f.kind === "video");

  if (photos.length > MAX_PHOTOS) {
    throw new AppError(
      "TOO_MANY_PHOTOS",
      `अधिकतम ${MAX_PHOTOS} फ़ोटो अपलोड कर सकते हैं।`,
      `You can upload up to ${MAX_PHOTOS} photos.`,
      400
    );
  }

  if (videos.length > MAX_VIDEOS) {
    throw new AppError(
      "TOO_MANY_VIDEOS",
      `अधिकतम ${MAX_VIDEOS} वीडियो अपलोड कर सकते हैं।`,
      `You can upload up to ${MAX_VIDEOS} video.`,
      400
    );
  }

  for (const file of files) {
    if (file.kind === "photo") {
      if (!IMAGE_TYPES.has(file.contentType)) {
        throw new AppError(
          "INVALID_IMAGE",
          "केवल JPEG, PNG या WebP फ़ोटो स्वीकार हैं।",
          "Only JPEG, PNG, or WebP photos are accepted.",
          400
        );
      }
      if (file.size > IMAGE_MAX_BYTES) {
        throw new AppError(
          "IMAGE_TOO_LARGE",
          "फ़ोटो 5 MB से छोटी होनी चाहिए।",
          "Each photo must be under 5 MB.",
          400
        );
      }
    } else {
      if (!VIDEO_TYPES.has(file.contentType)) {
        throw new AppError(
          "INVALID_VIDEO",
          "केवल MP4 या WebM वीडियो स्वीकार हैं।",
          "Only MP4 or WebM videos are accepted.",
          400
        );
      }
      if (file.size > VIDEO_MAX_BYTES) {
        throw new AppError(
          "VIDEO_TOO_LARGE",
          "वीडियो 20 MB से छोटा होना चाहिए।",
          "Video must be under 20 MB.",
          400
        );
      }
    }
  }
}
