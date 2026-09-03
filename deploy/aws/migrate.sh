#!/usr/bin/env bash
set -euo pipefail

# Run database migrations against production (Neon/RDS).
#
# Usage:
#   DATABASE_URL="postgresql://..." ./deploy/aws/migrate.sh
#
# Or load env from .env.production / .env.local:
#   ./deploy/aws/migrate.sh

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=deploy/aws/load-env.sh
source "${ROOT_DIR}/deploy/aws/load-env.sh"
if [[ -z "${DATABASE_URL:-}" ]]; then
  load_production_env "${ROOT_DIR}"
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

echo "→ Running migrations..."
npm run db:migrate
echo "✓ Migrations complete"
