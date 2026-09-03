#!/usr/bin/env bash
set -euo pipefail

# Deploy ward-campaign to Vercel (production).
#
# First time:
#   npx vercel login
#   npx vercel link
#   ./deploy/vercel/sync-env.sh production
#   ./deploy/vercel/deploy.sh
#
# Redeploy:
#   ./deploy/vercel/deploy.sh

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

if ! npx vercel whoami >/dev/null 2>&1; then
  echo "→ Log in to Vercel first:"
  npx vercel login
fi

if [[ ! -f .vercel/project.json ]]; then
  echo "→ Link this folder to a Vercel project:"
  npx vercel link
fi

if [[ "${SYNC_ENV:-}" == "1" ]]; then
  ./deploy/vercel/sync-env.sh production
fi

echo "→ Deploying to Vercel (production)..."
npx vercel deploy --prod --yes

echo ""
echo "Next steps:"
echo "  1. Copy your *.vercel.app hostname from the output above"
echo "  2. Firebase Console → Authentication → Authorized domains → add hostname"
echo "  3. Google Cloud → reCAPTCHA → Domains → add same hostname"
echo "  4. curl https://YOUR_APP.vercel.app/api/health"
