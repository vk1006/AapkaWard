import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { FileMeta, FileStorePort } from "@/infrastructure/ports/file-store";

const PRESIGN_CACHE_BUFFER_SEC = 300;

type PresignCacheEntry = { url: string; expiresAt: number };

const presignCache = new Map<string, PresignCacheEntry>();

export class R2FileAdapter implements FileStorePort {
  private client: S3Client | null = null;
  private readonly bucket: string;
  private readonly publicUrl?: string;

  constructor() {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const customEndpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
    const accessKeyId =
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;

    this.bucket =
      process.env.CLOUDFLARE_R2_BUCKET ?? process.env.AWS_S3_BUCKET ?? "";
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

    const endpoint =
      customEndpoint ||
      (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

    if (endpoint && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: "auto",
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    } else {
      console.warn(
        "[R2FileAdapter] Cloudflare R2 credentials or endpoint not fully set. File uploads will be unavailable until credentials are provided."
      );
    }
  }

  private ensureReady(): { client: S3Client; bucket: string } {
    if (!this.client || !this.bucket) {
      throw new Error(
        "Cloudflare R2 is not configured. Please set CLOUDFLARE_R2_ACCOUNT_ID (or CLOUDFLARE_R2_ENDPOINT), CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET."
      );
    }
    return { client: this.client, bucket: this.bucket };
  }

  async put(key: string, body: Buffer, meta: FileMeta): Promise<string> {
    const { client, bucket } = this.ensureReady();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: meta.contentType,
      })
    );
    return key;
  }

  async getSignedUrl(key: string, ttlSec: number): Promise<string> {
    // If a public domain/URL is configured for the R2 bucket, return direct CDN URL
    if (this.publicUrl) {
      const base = this.publicUrl.replace(/\/$/, "");
      return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
    }

    const { client, bucket } = this.ensureReady();
    const now = Date.now();
    const cached = presignCache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.url;
    }

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(client, command, { expiresIn: ttlSec });
    presignCache.set(key, {
      url,
      expiresAt: now + (ttlSec - PRESIGN_CACHE_BUFFER_SEC) * 1000,
    });
    return url;
  }

  async delete(key: string): Promise<void> {
    const { client, bucket } = this.ensureReady();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  async read(key: string): Promise<Buffer> {
    const { client, bucket } = this.ensureReady();
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await client.send(command);
    if (!response.Body) {
      throw new Error(`Empty body returned for key: ${key}`);
    }
    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }
}
