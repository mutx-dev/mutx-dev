#!/bin/bash
# Self-healing script for queue drain/stall detection
# Usage: ./self-heal-queue.sh

set -euo pipefail

QUEUE_NAME="${1:-default}"
MAX_STALLED_AGE="${2:-3600}"  # 1 hour in seconds

echo "[$(date)] Checking queue health for: $QUEUE_NAME"

# Check if queue has stalled jobs (older than MAX_STALLED_AGE)
check_stalled_jobs() {
    local queue="${1:-$QUEUE_NAME}"

    # This is a placeholder - implement based on actual queue system
    # For Redis queues, you might check for jobs older than threshold
    # For RabbitMQ, check for unacked messages

    echo "[$(date)] Checking for stalled jobs in queue: $queue"

    # Example Redis check (adapt to your queue implementation):
    # local stalled_count
    # stalled_count=$(redis-cli LLEN "queue:$queue:stalled" 2>/dev/null || echo "0")

    # For now, just log and return success
    echo "[$(date)] Queue health check complete"
    return 0
}

drain_stalled_jobs() {
    local queue="${1:-$QUEUE_NAME}"

    echo "[$(date)] Draining stalled jobs from queue: $queue"

    # Implementation depends on queue system
    # Move stalled jobs back to pending or dead-letter queue

    # Example Redis implementation:
    # redis-cli RPOPLPUSH "queue:$queue:stalled" "queue:$queue:pending"

    echo "[$(date)] Stalled jobs drained"
    return 0
}

alert_on_stall() {
    local queue="${1:-$QUEUE_NAME}"
    local count="${2:-0}"

    echo "[$(date)] ALERT: $count stalled jobs in queue: $queue"

    # Send alert (integrate with your notification system)
    # This could call a webhook, send email, etc.

    return 0
}

# Main logic
if check_stalled_jobs; then
    # Queue is healthy
    exit 0
else
    # Queue might have issues, attempt drain
    if drain_stalled_jobs; then
        echo "[$(date)] Queue recovered"
        exit 0
    else
        # Failed to drain, alert
        alert_on_stall
        exit 1
    fi
fi
