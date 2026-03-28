#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v railway >/dev/null 2>&1; then
  echo "Railway CLI is required. Install it with: npm install -g @railway/cli" >&2
  exit 1
fi

required_vars=(
  RAILWAY_TOKEN
  RAILWAY_PROJECT_ID
  RAILWAY_FRONTEND_SERVICE_ID
  RAILWAY_API_SERVICE_ID
  RAILWAY_ENVIRONMENT_ID
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required Railway environment variable: ${var_name}" >&2
    exit 1
  fi
done

RELEASE_TAG="${RELEASE_TAG:-v$(node -p "require('./package.json').version")}"

deploy_service() {
  local service_id="$1"
  local label="$2"

  echo "Promoting ${label} via Railway service ${service_id} for release ${RELEASE_TAG}..."
  railway up \
    --ci \
    --project "${RAILWAY_PROJECT_ID}" \
    --environment "${RAILWAY_ENVIRONMENT_ID}" \
    --service "${service_id}"
}

deploy_service "${RAILWAY_FRONTEND_SERVICE_ID}" "frontend"
deploy_service "${RAILWAY_API_SERVICE_ID}" "backend"

echo "Railway production promotion complete for ${RELEASE_TAG}."
