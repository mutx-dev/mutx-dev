#!/bin/bash
# Self-healing script for Docker container restart automation
# Usage: ./self-heal-container.sh <container_name> [max_retries]

set -euo pipefail

CONTAINER_NAME="${1:-mutx}"
MAX_RETRIES="${2:-3}"
RETRY_DELAY=5

echo "[$(date)] Starting container health check for: $CONTAINER_NAME"

check_health() {
    local container="$1"
    if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo "[$(date)] Container $container is not running"
        return 1
    fi

    local health_status
    health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")

    if [ "$health_status" = "unhealthy" ]; then
        echo "[$(date)] Container $container is unhealthy"
        return 1
    fi

    local state
    state=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "unknown")
    if [ "$state" != "running" ]; then
        echo "[$(date)] Container $container is in state: $state"
        return 1
    fi

    echo "[$(date)] Container $container is healthy"
    return 0
}

restart_container() {
    local container="$1"
    local attempt="$2"

    echo "[$(date)] Attempting to restart container $container (attempt $attempt/$MAX_RETRIES)"

    docker stop "$container" 2>/dev/null || true
    sleep 2
    docker start "$container"
    sleep 5

    if check_health "$container"; then
        echo "[$(date)] Successfully recovered container $container"
        return 0
    fi
    return 1
}

attempt=1
while [ $attempt -le $MAX_RETRIES ]; do
    if check_health "$CONTAINER_NAME"; then
        exit 0
    fi

    if restart_container "$CONTAINER_NAME" "$attempt"; then
        exit 0
    fi

    if [ $attempt -lt $MAX_RETRIES ]; then
        echo "[$(date)] Waiting ${RETRY_DELAY}s before next attempt..."
        sleep $RETRY_DELAY
    fi

    attempt=$((attempt + 1))
done

echo "[$(date)] Failed to recover container $CONTAINER_NAME after $MAX_RETRIES attempts"
exit 1
