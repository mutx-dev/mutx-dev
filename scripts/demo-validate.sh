#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infrastructure/docker/docker-compose.yml"

echo "🚀 Starting MUTX local demo stack for validation..."

if ! command -v docker >/dev/null 2>&1; then
  echo "✗ Docker is required for one-command demo validation."
  echo "  Install Docker Desktop and rerun this command."
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose -f "$COMPOSE_FILE")
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose -f "$COMPOSE_FILE")
else
  echo "✗ docker compose is required for one-command demo validation."
  echo "  Install Docker Compose or a Docker distribution with compose support."
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "✗ Compose file missing at $COMPOSE_FILE"
  exit 1
fi

if [[ ! -f "$ROOT_DIR/.env" && -f "$ROOT_DIR/.env.example" ]]; then
  echo "Creating .env from .env.example for container defaults..."
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
fi

"${COMPOSE_CMD[@]}" up --build -d postgres redis api frontend

echo "Demo stack booted. Running validation checks (frontend + API)."

DEMO_SKIP_START=1 \
DEMO_API_URL="${DEMO_API_URL:-http://localhost:8000}" \
DEMO_PORT="${DEMO_PORT:-3000}" \
DEMO_HOST="${DEMO_HOST:-localhost}" \
DEMO_CHECK_API="${DEMO_CHECK_API:-1}" \
node "$ROOT_DIR/scripts/validate-demo.js"

echo "Stack is running and ready for demo use."
echo "Frontend: http://localhost:3000"
echo "API: http://localhost:8000"
echo "Stop stack later with: docker compose -f infrastructure/docker/docker-compose.yml down"
