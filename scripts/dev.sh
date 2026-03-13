#!/usr/bin/env bash

# MUTX Local Development Bootstrap
# Starts all services via Docker Compose: PostgreSQL, Redis, Backend API, Frontend

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infrastructure/docker/docker-compose.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 MUTX Local Development Bootstrap${NC}"
echo "========================================"

# Check for Docker
if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}✗ Docker not found. Install Docker Desktop or Docker Engine first.${NC}"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}✗ Docker daemon is not running.${NC}"
  echo "  Start Docker Desktop (or the Docker service) and retry."
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose -f "$COMPOSE_FILE")
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose -f "$COMPOSE_FILE")
else
  echo -e "${RED}✗ Docker Compose not found.${NC}"
  echo "  Install Docker Compose (\`docker compose\` plugin or \`docker-compose\`) and retry."
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo -e "${RED}✗ Compose file not found at:${NC} $COMPOSE_FILE"
  echo "  Verify your checkout includes infrastructure/docker/docker-compose.yml"
  exit 1
fi

# Check if .env exists in repo root, create from example if not
if [ ! -f "$ROOT_DIR/.env" ]; then
  if [ -f "$ROOT_DIR/.env.example" ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"

    # Generate a stable JWT secret
    JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || openssl rand -base64 24)
    if sed --version >/dev/null 2>&1; then
      sed -i "s|JWT_SECRET=replace-with-a-stable-secret|JWT_SECRET=$JWT_SECRET|" "$ROOT_DIR/.env"
    else
      sed -i '' "s|JWT_SECRET=replace-with-a-stable-secret|JWT_SECRET=$JWT_SECRET|" "$ROOT_DIR/.env"
    fi

    echo -e "${GREEN}✓ Created .env with generated JWT_SECRET${NC}"
  else
    echo -e "${RED}✗ Missing $ROOT_DIR/.env.example${NC}"
    echo "  Create .env manually with required local variables and retry."
    exit 1
  fi
fi

# Function to cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down services...${NC}"
  "${COMPOSE_CMD[@]}" down
  exit 0
}

trap cleanup SIGINT SIGTERM

# Build and start all services
echo -e "\n${BLUE}🐳 Building and starting all services...${NC}"
"${COMPOSE_CMD[@]}" up --build -d

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to be ready...${NC}"

# Wait for PostgreSQL
for _ in {1..30}; do
  if "${COMPOSE_CMD[@]}" exec -T postgres pg_isready -U mutx >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
    break
  fi
  sleep 1
done

# Wait for Redis
for _ in {1..10}; do
  if "${COMPOSE_CMD[@]}" exec -T redis redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is ready${NC}"
    break
  fi
  sleep 1
done

# Wait for API
for _ in {1..60}; do
  if curl -fsS http://localhost:8000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is ready${NC}"
    break
  fi
  sleep 1
done

# Wait for Frontend
for _ in {1..60}; do
  if curl -fsS http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is ready${NC}"
    break
  fi
  sleep 1
done

# Show service status
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
"${COMPOSE_CMD[@]}" ps

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}🎉 All services are running!${NC}"
echo "========================================"
echo ""
echo -e "  ${BLUE}Frontend:${NC}   http://localhost:3000"
echo -e "  ${BLUE}Backend API:${NC} http://localhost:8000"
echo -e "  ${BLUE}API Docs:${NC}   http://localhost:8000/docs"
echo -e "  ${BLUE}Health:${NC}     http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Follow logs
"${COMPOSE_CMD[@]}" logs -f
