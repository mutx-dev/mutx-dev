#!/bin/bash
# Self-healing script for PostgreSQL connection recovery
# Usage: ./self-heal-db.sh [max_retries]

set -euo pipefail

MAX_RETRIES="${1:-3}"
RETRY_DELAY=10
DB_CONTAINER="${DB_CONTAINER:-mutx-postgres-1}"

echo "[$(date)] Starting database health check"

check_db_health() {
    local container="${1:-$DB_CONTAINER}"

    # Check if PostgreSQL is accepting connections
    if docker exec "$container" pg_isready -U mutx >/dev/null 2>&1; then
        echo "[$(date)] PostgreSQL is accepting connections"
        return 0
    fi

    echo "[$(date)] PostgreSQL is not accepting connections"
    return 1
}

check_db_size() {
    local container="${1:-$DB_CONTAINER}"

    # Check for unusual database size (might indicate corruption)
    local db_size
    db_size=$(docker exec "$container" psql -U mutx -d mutx -t -c "SELECT pg_database_size('mutx');" 2>/dev/null || echo "0")

    # If db_size is very large (> 100GB), might need attention
    if [ "$db_size" -gt 100000000000 ]; then
        echo "[$(date)] WARNING: Unusually large database detected: $db_size bytes"
        return 1
    fi

    return 0
}

restart_postgres() {
    echo "[$(date)] Attempting to restart PostgreSQL..."
    docker restart "$DB_CONTAINER"
    sleep 10

    if check_db_health; then
        echo "[$(date)] PostgreSQL recovered successfully"
        return 0
    fi
    return 1
}

attempt=1
while [ $attempt -le $MAX_RETRIES ]; do
    if check_db_health && check_db_size; then
        exit 0
    fi

    if restart_postgres; then
        exit 0
    fi

    if [ $attempt -lt $MAX_RETRIES ]; then
        echo "[$(date)] Waiting ${RETRY_DELAY}s before next attempt..."
        sleep $RETRY_DELAY
    fi

    attempt=$((attempt + 1))
done

echo "[$(date)] Failed to recover PostgreSQL after $MAX_RETRIES attempts"
exit 1
