#!/usr/bin/env bash
# Source production env for deploy scripts (.env.production preferred, then .env.local).
load_production_env() {
  local root="${1:-.}"
  if [[ -f "${root}/.env.production" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "${root}/.env.production"
    set +a
  elif [[ -f "${root}/.env.local" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "${root}/.env.local"
    set +a
  else
    echo "Missing env file. Copy .env.production.example → .env.production (or use .env.local)." >&2
    exit 1
  fi
}
