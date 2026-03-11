#!/bin/bash
# MUTX Monitoring Stack Startup Script

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.monitoring"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "❌ Missing ${ENV_FILE}"
  echo "Create it from .env.monitoring.example first:"
  echo "   cp .env.monitoring.example .env.monitoring"
  exit 1
fi

# Load monitoring env vars so port/password settings are visible to this script too
set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "❌ docker compose is not installed"
  exit 1
fi

echo "🧪 Starting MUTX Monitoring Stack..."
"${COMPOSE_CMD[@]}" --env-file "${ENV_FILE}" -f docker-compose.monitoring.yml up -d

echo ""
echo "✅ Monitoring stack started"
echo ""
echo "📊 Services (localhost only):"
echo "   - Prometheus:     http://localhost:${PROMETHEUS_PORT:-9090}"
echo "   - Grafana:        http://localhost:${GRAFANA_PORT:-3001}"
echo "   - Node Exporter:  http://localhost:${NODE_EXPORTER_PORT:-9100}"
echo "   - Redis Exporter: http://localhost:${REDIS_EXPORTER_PORT:-9121}"
echo "   - PG Exporter:    http://localhost:${POSTGRES_EXPORTER_PORT:-9187}"
echo ""
echo "To stop: ${COMPOSE_CMD[*]} --env-file ${ENV_FILE} -f docker-compose.monitoring.yml down"
