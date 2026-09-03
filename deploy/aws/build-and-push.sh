#!/usr/bin/env bash
set -euo pipefail

# Build and push ward-campaign Docker image to ECR.
#
# Usage:
#   export AWS_REGION=ap-south-1
#   export AWS_ACCOUNT_ID=123456789012
#   export ECR_REPO=ward-campaign
#   # Loads .env.production or .env.local automatically if vars are unset
#   ./deploy/aws/build-and-push.sh

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=deploy/aws/load-env.sh
source "${ROOT_DIR}/deploy/aws/load-env.sh"
if [[ -z "${NEXT_PUBLIC_FIREBASE_API_KEY:-}" ]]; then
  load_production_env "${ROOT_DIR}"
fi

# Prefer explicit keys from env over a missing AWS_PROFILE
if [[ -n "${AWS_ACCESS_KEY_ID:-}" && -n "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
  unset AWS_PROFILE
fi

: "${AWS_REGION:=ap-south-1}"
: "${ECR_REPO:=ward-campaign}"
: "${IMAGE_TAG:=latest}"

if [[ -z "${AWS_ACCOUNT_ID:-}" ]]; then
  AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
fi

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

echo "→ Ensuring ECR repository exists: ${ECR_REPO}"
aws ecr describe-repositories --repository-names "${ECR_REPO}" --region "${AWS_REGION}" >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name "${ECR_REPO}" --region "${AWS_REGION}"

echo "→ Logging in to ECR"
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "→ Building image (NEXT_PUBLIC_* baked in at build time)"
docker build \
  --build-arg "NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY:-}" \
  --build-arg "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:-}" \
  --build-arg "NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-}" \
  --build-arg "NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID:-}" \
  --build-arg "NEXT_PUBLIC_OTP_ADAPTER=${NEXT_PUBLIC_OTP_ADAPTER:-firebase}" \
  -t "${ECR_REPO}:${IMAGE_TAG}" \
  -f Dockerfile \
  .

docker tag "${ECR_REPO}:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"

echo "→ Pushing ${ECR_URI}:${IMAGE_TAG}"
docker push "${ECR_URI}:${IMAGE_TAG}"

echo "✓ Done. Image: ${ECR_URI}:${IMAGE_TAG}"
