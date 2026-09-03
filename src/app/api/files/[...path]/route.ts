import { NextResponse } from "next/server";
import { getContainer } from "@/infrastructure/container";
import { LocalFileAdapter } from "@/infrastructure/adapters/storage/local";
import { mimeFromKey } from "@/modules/issues/media";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const key = path.map((segment) => decodeURIComponent(segment)).join("/");

  if (!key.startsWith("issues/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { fileStore } = getContainer();

  if (fileStore instanceof LocalFileAdapter) {
    try {
      const buffer = await fileStore.read(key);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": mimeFromKey(key),
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      return new NextResponse("Not found", { status: 404 });
    }
  }

  const ttlSec = 3600;
  const url = await fileStore.getSignedUrl(key, ttlSec);
  return NextResponse.redirect(url, {
    headers: {
      "Cache-Control": `private, max-age=${ttlSec - 300}`,
    },
  });
}
