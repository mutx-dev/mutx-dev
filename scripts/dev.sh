#!/usr/bin/env bash

# MUTX Local Development Bootstrap
# Default mode starts the full stack and tails logs.
# Additional modes:
#   up    - detached startup
#   logs  - follow stack logs
#   stop  - stop stack
#   ps    - show service status

set -euo pipefail

ACTION="${1:-start}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infrastructure/docker/docker-compose.yml"
COMPOSE_PROJECT="${MUTX_COMPOSE_PROJECT:-mutx}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}MUTX Local Development Bootstrap${NC}"
echo "========================================"

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}Docker not found. Install Docker Desktop or Docker Engine first.${NC}"
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Docker daemon is not running.${NC}"
    echo "  Start Docker Desktop (or the Docker service) and retry."
    exit 1
  fi
}

resolve_compose() {
  if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD=(docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE")
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD=(docker-compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE")
  else
    echo -e "${RED}Docker Compose not found.${NC}"
    echo "  Install Docker Compose (\`docker compose\` plugin or \`docker-compose\`) and retry."
    exit 1
  fi

  if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}Compose file not found at:${NC} $COMPOSE_FILE"
    echo "  Verify your checkout includes infrastructure/docker/docker-compose.yml"
    exit 1
  fi

  COMPOSE_CMD_STRING="${COMPOSE_CMD[*]}"
}

ensure_env() {
  if [ -f "$ROOT_DIR/.env" ]; then
    return
  fi

  if [ ! -f "$ROOT_DIR/.env.example" ]; then
    echo -e "${RED}Missing $ROOT_DIR/.env.example${NC}"
    echo "  Create .env manually with required local variables and retry."
    exit 1
  fi

  echo -e "${YELLOW}Creating .env from .env.example...${NC}"
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"

  JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || openssl rand -base64 24)
  if sed --version >/dev/null 2>&1; then
    sed -i "s|^JWT_SECRET=.*$|JWT_SECRET=$JWT_SECRET|" "$ROOT_DIR/.env"
  else
    sed -i '' "s|^JWT_SECRET=.*$|JWT_SECRET=$JWT_SECRET|" "$ROOT_DIR/.env"
  fi

  echo -e "${GREEN}Created .env with generated JWT_SECRET${NC}"
}

stack_is_running() {
  local services
  services="$("${COMPOSE_CMD[@]}" ps --services --status running 2>/dev/null || true)"
  for service in postgres redis api frontend; do
    if ! printf '%s\n' "$services" | grep -qx "$service"; then
      return 1
    fi
  done
  return 0
}

wait_for_service() {
  local label="$1"
  local attempts="$2"
  local command="$3"

  for _ in $(seq 1 "$attempts"); do
    if eval "$command" >/dev/null 2>&1; then
      echo -e "${GREEN}${label} is ready${NC}"
      return
    fi
    sleep 1
  done

  echo -e "${YELLOW}${label} did not report ready within the expected window.${NC}"
}

show_summary() {
  echo ""
  echo -e "${BLUE}Service Status:${NC}"
  "${COMPOSE_CMD[@]}" ps
  echo ""
  echo "========================================"
  echo -e "${GREEN}Local stack is running${NC}"
  echo "========================================"
  echo ""
  echo -e "  ${BLUE}Compose Project:${NC} $COMPOSE_PROJECT"
  echo -e "  ${BLUE}Frontend:${NC}    http://localhost:3000"
  echo -e "  ${BLUE}Backend API:${NC}  http://localhost:8000"
  echo -e "  ${BLUE}API Docs:${NC}    http://localhost:8000/docs"
  echo -e "  ${BLUE}Health:${NC}      http://localhost:8000/health"
  echo ""
  echo "Next operator steps:"
  echo "  mutx setup local"
  echo "  mutx doctor"
  echo "  mutx tui"
  echo ""
}

start_stack() {
  if stack_is_running; then
    echo -e "\n${GREEN}Existing local stack detected for project ${COMPOSE_PROJECT}; reusing it.${NC}"
    show_summary
    return
  fi

  echo -e "\n${BLUE}Building and starting all services...${NC}"
  "${COMPOSE_CMD[@]}" up --build -d

  echo -e "\n${YELLOW}Waiting for services to be ready...${NC}"
  wait_for_service "PostgreSQL" 30 "${COMPOSE_CMD_STRING} exec -T postgres pg_isready -U mutx"
  wait_for_service "Redis" 10 "${COMPOSE_CMD_STRING} exec -T redis redis-cli ping"
  wait_for_service "Backend API" 60 "curl -fsS http://localhost:8000/ready"
  wait_for_service "Frontend" 60 "curl -fsS http://localhost:3000"

  show_summary
}

follow_logs() {
  "${COMPOSE_CMD[@]}" logs -f
}

stop_stack() {
  echo -e "${YELLOW}Stopping local stack...${NC}"
  "${COMPOSE_CMD[@]}" down
}

cleanup() {
  echo ""
  stop_stack
  exit 0
}

require_docker
resolve_compose

case "$ACTION" in
  start)
    ensure_env
    trap cleanup SIGINT SIGTERM
    start_stack
    echo "Press Ctrl+C to stop all services"
    echo ""
    follow_logs
    ;;
  up)
    ensure_env
    start_stack
    ;;
  logs)
    follow_logs
    ;;
  stop|down)
    stop_stack
    ;;
  ps|status)
    "${COMPOSE_CMD[@]}" ps
    ;;
  *)
    echo "Usage: ./scripts/dev.sh [start|up|logs|stop|ps]"
    exit 1
    ;;
esac
