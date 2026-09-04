import "./load-env";
import { R2FileAdapter } from "../src/infrastructure/adapters/storage/r2";

async function main() {
  console.log("Testing Cloudflare R2 connection...");
  const r2 = new R2FileAdapter();
  const testKey = `issues/test-connection-${Date.now()}.txt`;
  const testBody = Buffer.from("Cloudflare R2 test connection successful");

  try {
    console.log(`1. Uploading test file: ${testKey}`);
    await r2.put(testKey, testBody, { contentType: "text/plain", size: testBody.length });
    console.log("✓ Upload succeeded!");

    console.log("2. Generating signed URL...");
    const url = await r2.getSignedUrl(testKey, 300);
    console.log(`✓ Signed URL generated:\n   ${url}`);

    console.log("3. Deleting test file...");
    await r2.delete(testKey);
    console.log("✓ Deletion succeeded!");

    console.log("\n🎉 Cloudflare R2 is fully working and verified!");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Cloudflare R2 test failed:", error.message || error);
    process.exit(1);
  }
}

main();
