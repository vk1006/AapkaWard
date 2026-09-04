#!/usr/bin/env node
/**
 * Fast env sync using local vercel binary (avoids npx re-download per var).
 * Usage: node deploy/vercel/sync-env.mjs [production|preview]
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const TARGET = process.argv[2] ?? "production";
const VERCEL = join(ROOT, "node_modules/.bin/vercel");

const KEEP = new Set([
  "DATABASE_URL",
  "OTP_ADAPTER",
  "NEXT_PUBLIC_OTP_ADAPTER",
  "ADMIN_PHONES",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FILE_STORE_ADAPTER",
  "AWS_REGION",
  "AWS_S3_BUCKET",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_ACCOUNT_ID",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_BUCKET",
  "CLOUDFLARE_R2_PUBLIC_URL",
  "CLOUDFLARE_R2_ENDPOINT",
  "MODERATION_ADAPTER",
  "NODE_ENV",
]);

function parseEnvFile(path) {
  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function run(args, input) {
  const result = spawnSync(VERCEL, args, {
    cwd: ROOT,
    input: input ?? undefined,
    encoding: "utf8",
    stdio: input !== undefined ? ["pipe", "pipe", "pipe"] : ["inherit", "pipe", "pipe"],
  });
  return result;
}

const envFile = existsSync(join(ROOT, ".env.production"))
  ? join(ROOT, ".env.production")
  : join(ROOT, ".env.local");

if (!existsSync(envFile)) {
  console.error("Missing .env.production or .env.local");
  process.exit(1);
}

const vars = parseEnvFile(envFile);
console.log(`→ Syncing ${envFile} to Vercel (${TARGET})...\n`);

for (const key of KEEP) {
  const value = vars[key];
  if (value === undefined || value === "") {
    console.warn(`  ! skip ${key} (empty)`);
    continue;
  }

  process.stdout.write(`  + ${key}... `);
  run(["env", "rm", key, TARGET, "--yes"]);
  const useStdin = value.length > 180 || key === "FIREBASE_PRIVATE_KEY";
  const addArgs = ["env", "add", key, TARGET, "--yes", "--force"];
  if (key.startsWith("NEXT_PUBLIC_")) addArgs.push("--type", "config");
  if (!useStdin) addArgs.push("--value", value);
  const add = useStdin ? run(addArgs, value) : run(addArgs);
  if (add.status !== 0) {
    console.log("FAILED");
    console.error(add.stderr || add.stdout);
    process.exit(1);
  }
  console.log("ok");
}

console.log("\n✓ Done");
