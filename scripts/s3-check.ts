import "./load-env";

import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";

function createClient(region: string): S3Client {
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

  return new S3Client({ region });
}

async function main() {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION ?? "ap-south-1";

  if (!bucket) {
    console.error("AWS_S3_BUCKET is not set (check .env.local)");
    process.exit(1);
  }

  const client = createClient(region);

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`S3 OK: s3://${bucket} (${region})`);
  } catch (error) {
    console.error("S3 check failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
