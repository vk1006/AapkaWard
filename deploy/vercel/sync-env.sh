#!/usr/bin/env bash
set -euo pipefail

# Push env vars from .env.production (or .env.local) to a linked Vercel project.
#
# Prereqs: npx vercel login && npx vercel link
# Usage: ./deploy/vercel/sync-env.sh [production|preview]

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

TARGET="${1:-production}"

if [[ "$TARGET" != "production" && "$TARGET" != "preview" ]]; then
  echo "Usage: $0 [production|preview]" >&2
  exit 1
fi

ENV_FILE=".env.production"
if [[ ! -f "$ENV_FILE" ]]; then
  ENV_FILE=".env.local"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env.production or .env.local" >&2
  exit 1
fi

if ! npx vercel whoami >/dev/null 2>&1; then
  echo "Not logged in. Run: npx vercel login" >&2
  exit 1
fi

if [[ ! -f .vercel/project.json ]]; then
  echo "Project not linked. Run: npx vercel link" >&2
  exit 1
fi

echo "→ Syncing env from ${ENV_FILE} to Vercel (${TARGET})..."

# Keys the app needs in production (skip Neon CLI-only metadata).
KEEP=(
  DATABASE_URL
  OTP_ADAPTER
  NEXT_PUBLIC_OTP_ADAPTER
  ADMIN_PHONES
  FIREBASE_PROJECT_ID
  FIREBASE_CLIENT_EMAIL
  FIREBASE_PRIVATE_KEY
  NEXT_PUBLIC_FIREBASE_API_KEY
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  NEXT_PUBLIC_FIREBASE_PROJECT_ID
  NEXT_PUBLIC_FIREBASE_APP_ID
  FILE_STORE_ADAPTER
  AWS_REGION
  AWS_S3_BUCKET
  AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY
  CLOUDFLARE_R2_ACCOUNT_ID
  CLOUDFLARE_R2_ACCESS_KEY_ID
  CLOUDFLARE_R2_SECRET_ACCESS_KEY
  CLOUDFLARE_R2_BUCKET
  CLOUDFLARE_R2_PUBLIC_URL
  CLOUDFLARE_R2_ENDPOINT
  MODERATION_ADAPTER
  NODE_ENV
)

should_keep() {
  local key="$1"
  for k in "${KEEP[@]}"; do
    [[ "$k" == "$key" ]] && return 0
  done
  return 1
}

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  key="${line%%=*}"
  key="${key#"${key%%[![:space:]]*}"}"
  key="${key%"${key##*[![:space:]]}"}"
  [[ -z "$key" ]] && continue
  should_keep "$key" || continue

  value="${line#*=}"
  # Strip surrounding quotes
  if [[ "$value" =~ ^\"(.*)\"$ ]]; then
    value="${BASH_REMATCH[1]}"
  elif [[ "$value" =~ ^\'(.*)\'$ ]]; then
    value="${BASH_REMATCH[1]}"
  fi

  echo "  + ${key}"
  npx vercel env rm "$key" "$TARGET" --yes 2>/dev/null || true
  if ! printf '%s' "$value" | npx vercel env add "$key" "$TARGET" >/dev/null 2>&1; then
    echo "    retrying ${key}..."
    printf '%s' "$value" | npx vercel env add "$key" "$TARGET" >/dev/null
  fi
done < "$ENV_FILE"

echo "✓ Env sync complete for ${TARGET}"
