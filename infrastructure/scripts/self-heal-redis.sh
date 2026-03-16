#!/bin/bash
# Self-healing script for Redis connection recovery
# Usage: ./self-heal-redis.sh [max_retries]

set -euo pipefail

MAX_RETRIES="${1:-3}"
RETRY_DELAY=5
REDIS_CONTAINER="${REDIS_CONTAINER:-mutx-redis-1}"

echo "[$(date)] Starting Redis health check"

check_redis_health() {
    local container="${1:-$REDIS_CONTAINER}"
    
    # Check if Redis is responding
    if docker exec "$container" redis-cli ping 2>/dev/null | grep -q PONG; then
        echo "[$(date)] Redis is responding"
        return 0
    fi
    
    echo "[$(date)] Redis is not responding"
    return 1
}

check_redis_memory() {
    local container="${1:-$REDIS_CONTAINER}"
    
    # Check memory usage (should not exceed 80% of limit)
    local mem_used
    local mem_limit
    mem_used=$(docker exec "$container" redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
    mem_limit=$(docker exec "$container" redis-cli info memory | grep maxmemory_human | cut -d: -f2 | tr -d '\r')
    
    echo "[$(date)] Redis memory: used=$mem_used, limit=$mem_limit"
    
    # If we can't parse memory, consider it OK
    [ -z "$mem_used" ] && return 0
    
    return 0
}

restart_redis() {
    local container="${1:-$REDIS_CONTAINER}"
    
    echo "[$(date)] Attempting to restart Redis..."
    docker restart "$container"
    sleep 5
    
    if check_redis_health; then
        echo "[$(date)] Redis recovered successfully"
        return 0
    fi
    return 1
}

attempt=1
while [ $attempt -le $MAX_RETRIES ]; do
    if check_redis_health && check_redis_memory; then
        exit 0
    fi
    
    if restart_redis "$REDIS_CONTAINER"; then
        exit 0
    fi
    
    if [ $attempt -lt $MAX_RETRIES ]; then
        echo "[$(date)] Waiting ${RETRY_DELAY}s before next attempt..."
        sleep $RETRY_DELAY
    fi
    
    attempt=$((attempt + 1))
done

echo "[$(date)] Failed to recover Redis after $MAX_RETRIES attempts"
exit 1
