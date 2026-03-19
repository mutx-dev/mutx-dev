#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="infrastructure/docker/docker-compose.prod.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for the production compose smoke test."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not available. Start Docker or set MUTX_SKIP_COMPOSE_SMOKE=1."
  exit 1
fi

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-mutx-smoke}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-mutx-smoke-password}"
export JWT_SECRET="${JWT_SECRET:-mutx-smoke-jwt-secret-please-change-32chars}"
export SECRET_ENCRYPTION_KEY="${SECRET_ENCRYPTION_KEY:-$JWT_SECRET}"
export DATABASE_URL="${DATABASE_URL:-postgresql://mutx:${POSTGRES_PASSWORD}@postgres:5432/mutx}"
export DATABASE_SSL_MODE="${DATABASE_SSL_MODE:-disable}"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://api.mutx.dev}"
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://app.mutx.dev}"
export CORS_ORIGINS="${CORS_ORIGINS:-https://mutx.dev,https://app.mutx.dev}"

cleanup() {
  docker compose -f "$COMPOSE_FILE" down -v --remove-orphans >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "Starting production compose smoke stack..."
docker compose -f "$COMPOSE_FILE" up -d --build postgres redis migrate api monitor frontend nginx

echo "Waiting for API health endpoint..."
for _ in $(seq 1 60); do
  if docker compose -f "$COMPOSE_FILE" exec -T api curl -fsS http://localhost:8000/health >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

docker compose -f "$COMPOSE_FILE" exec -T api curl -fsS http://localhost:8000/health >/dev/null
docker compose -f "$COMPOSE_FILE" exec -T api curl -fsS http://localhost:8000/ready >/dev/null

echo "Production compose smoke test passed."
