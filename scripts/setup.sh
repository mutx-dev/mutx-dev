#!/bin/bash
set -euo pipefail

echo "Setting up mutx.dev..."

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="$ROOT_DIR/infrastructure/docker/docker-compose.yml"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD=(docker-compose)
else
    echo "Docker Compose is required (docker compose or docker-compose)."
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "Compose file not found at $COMPOSE_FILE"
    exit 1
fi

if [ ! -f .env ]; then
    echo "Creating .env from example..."
    cp .env.example .env
fi

echo "Installing Python dependencies..."
pip install -r requirements.txt
pip install -e ".[dev]" 2>/dev/null || true

echo "Installing Node.js dependencies..."
npm install

echo "Building Docker services..."
"${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" build

echo "Starting database services..."
"${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" up -d postgres redis

echo "Waiting for database to be ready..."
sleep 5

echo "Running migrations..."
PYTHONPATH=./src/api alembic upgrade head

echo "Setup complete!"
echo "Run ./scripts/dev.sh to start development services"
