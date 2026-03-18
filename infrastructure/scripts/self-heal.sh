#!/bin/bash
# Unified self-healing script triggered by AlertManager
# Usage: ./self-heal.sh <alert_name> [container/service name]

set -euo pipefail

ALERT_NAME="${1:-}"
TARGET="${2:-mutx}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Log all healing attempts
LOG_FILE="${LOG_FILE:-/var/log/self-heal.log}"

log() {
    echo "[$(date)] [HEAL] $1" | tee -a "$LOG_FILE"
}

if [ -z "$ALERT_NAME" ]; then
    echo "Usage: $0 <alert_name> [target]"
    exit 1
fi

log "Processing alert: $ALERT_NAME for target: $TARGET"

case "$ALERT_NAME" in
    "MutxApiDown"|"HighErrorRate")
        log "Triggering container restart for: $TARGET"
        bash "$SCRIPT_DIR/self-heal-container.sh" "$TARGET" 3
        ;;
    "PostgresConnectionExhaustion"|"PostgresSlowQueries")
        log "Triggering database recovery"
        bash "$SCRIPT_DIR/self-heal-db.sh" 3
        ;;
    "RedisExporterDown")
        log "Triggering Redis recovery"
        bash "$SCRIPT_DIR/self-heal-redis.sh" 3
        ;;
    "QueueStalled")
        log "Triggering queue drain"
        bash "$SCRIPT_DIR/self-heal-queue.sh" "$TARGET"
        ;;
    "WebhookDeliveryFailed")
        log "Triggering webhook retry"
        bash "$SCRIPT_DIR/self-heal-webhook.sh" "$TARGET" 3
        ;;
    *)
        log "Unknown alert: $ALERT_NAME - no action taken"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    log "Successfully healed: $ALERT_NAME"
    exit 0
else
    log "Failed to heal: $ALERT_NAME"
    exit 1
fi
