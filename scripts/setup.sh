#!/usr/bin/env bash
set -euo pipefail

echo "Setting up mutx.dev..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infrastructure/docker/docker-compose.yml"
PYTHON_BIN=""
cd "$ROOT_DIR"

for candidate in python3 python; do
    if command -v "$candidate" >/dev/null 2>&1; then
        PYTHON_BIN="$candidate"
        break
    fi
done

if [ -z "$PYTHON_BIN" ]; then
    echo "Python 3 is required for local setup."
    echo "Install python3 and retry."
    exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required for local setup."
    echo "Install Docker Desktop or Docker Engine and retry."
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "Docker daemon is not running."
    echo "Start Docker Desktop (or the Docker service) and retry."
    exit 1
fi

if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD=(docker-compose)
else
    echo "Docker Compose is required (docker compose plugin or docker-compose)."
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "Compose file not found at $COMPOSE_FILE"
    echo "Expected local stack file: infrastructure/docker/docker-compose.yml"
    exit 1
fi

if [ ! -f "$ROOT_DIR/.env" ]; then
    if [ -f "$ROOT_DIR/.env.example" ]; then
        echo "Creating .env from .env.example..."
        cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
    else
        echo "Missing $ROOT_DIR/.env.example"
        echo "Create $ROOT_DIR/.env with required local values and retry."
        exit 1
    fi
fi

echo "Installing Python dependencies..."
if ! "$PYTHON_BIN" -m pip --version >/dev/null 2>&1; then
    echo "Bootstrapping pip for $PYTHON_BIN..."
    "$PYTHON_BIN" -m ensurepip --upgrade >/dev/null 2>&1 || {
        echo "pip is unavailable for $PYTHON_BIN."
        echo "Install pip or rerun with a Python distribution that includes ensurepip."
        exit 1
    }
fi
"$PYTHON_BIN" -m pip install -r requirements.txt
"$PYTHON_BIN" -m pip install -e ".[dev]" 2>/dev/null || true

echo "Installing Node.js dependencies..."
if [ -f package-lock.json ]; then
    npm ci
else
    npm install
fi

echo "Building Docker services..."
"${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" build

echo "Starting database services..."
"${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" up -d postgres redis

echo "Waiting for database to be ready..."
sleep 5

echo "Running migrations..."
PYTHONPATH=./src/api alembic upgrade head

echo "Setup complete!"
echo "Canonical local bootstrap command: ./scripts/dev.sh"
