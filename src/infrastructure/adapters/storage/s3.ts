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

function createS3Client(region: string): S3Client {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  if (accessKeyId && secretAccessKey) {
    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {}),
      },
    });
  }

  // Uses AWS_PROFILE, ~/.aws/credentials, or instance role when keys are omitted.
  return new S3Client({ region });
}

export class S3FileAdapter implements FileStorePort {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const region = process.env.AWS_REGION ?? "ap-south-1";
    this.bucket = process.env.AWS_S3_BUCKET ?? "";
    if (!this.bucket) {
      throw new Error("AWS_S3_BUCKET is not set (required when FILE_STORE_ADAPTER=s3)");
    }

    this.client = createS3Client(region);
  }

  async put(key: string, body: Buffer, meta: FileMeta): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: meta.contentType,
      })
    );
    return key;
  }

  async getSignedUrl(key: string, ttlSec: number): Promise<string> {
    const now = Date.now();
    const cached = presignCache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.url;
    }

    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const url = await getSignedUrl(this.client, command, { expiresIn: ttlSec });
    presignCache.set(key, {
      url,
      expiresAt: now + (ttlSec - PRESIGN_CACHE_BUFFER_SEC) * 1000,
    });
    return url;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
