#!/bin/bash

# MUTX Local Development Bootstrap
# Starts all services via Docker Compose: PostgreSQL, Redis, Backend API, Frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 MUTX Local Development Bootstrap${NC}"
echo "========================================"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Please install Docker.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ docker-compose not found. Please install docker-compose.${NC}"
    exit 1
fi

# Use docker compose (v2) or docker-compose (v1)
COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
    COMPOSE_CMD="docker-compose"
fi

# Check if .env exists, create from example if not
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}Creating .env from .env.example...${NC}"
        cp .env.example .env
        # Generate a stable JWT secret
        JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || openssl rand -base64 24)
        sed -i '' "s/JWT_SECRET=replace-with-a-stable-secret/JWT_SECRET=$JWT_SECRET/" .env
        echo -e "${GREEN}✓ Created .env with generated JWT_SECRET${NC}"
    else
        echo -e "${RED}✗ No .env.example found${NC}"
        exit 1
    fi
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    $COMPOSE_CMD down
    exit 0
}

trap cleanup SIGINT SIGTERM

# Build and start all services
echo -e "\n${BLUE}🐳 Building and starting all services...${NC}"
$COMPOSE_CMD up --build -d

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to be ready...${NC}"

# Wait for PostgreSQL
for i in {1..30}; do
    if $COMPOSE_CMD exec -T postgres pg_isready -U mutx &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi
    sleep 1
done

# Wait for Redis
for i in {1..10}; do
    if $COMPOSE_CMD exec -T redis redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis is ready${NC}"
        break
    fi
    sleep 1
done

# Wait for API
for i in {1..60}; do
    if curl -s http://localhost:8000/health &> /dev/null; then
        echo -e "${GREEN}✓ Backend API is ready${NC}"
        break
    fi
    sleep 1
done

# Wait for Frontend
for i in {1..60}; do
    if curl -s http://localhost:3000 &> /dev/null; then
        echo -e "${GREEN}✓ Frontend is ready${NC}"
        break
    fi
    sleep 1
done

# Show service status
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
$COMPOSE_CMD ps

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}🎉 All services are running!${NC}"
echo "========================================"
echo ""
echo -e "  ${BLUE}Frontend:${NC}  http://localhost:3000"
echo -e "  ${BLUE}Backend API:${NC} http://localhost:8000"
echo -e "  ${BLUE}API Docs:${NC}  http://localhost:8000/docs"
echo -e "  ${BLUE}Health:${NC}    http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Follow logs
$COMPOSE_CMD logs -f
