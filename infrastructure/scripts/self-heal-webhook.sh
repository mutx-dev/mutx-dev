#!/bin/bash
# Self-healing script for webhook delivery failures
# Usage: ./self-heal-webhook.sh <webhook_url> [max_retries]

set -euo pipefail

WEBHOOK_URL="${1:-}"
MAX_RETRIES="${2:-3}"
RETRY_DELAY=30

if [ -z "$WEBHOOK_URL" ]; then
    echo "Usage: $0 <webhook_url> [max_retries]"
    exit 1
fi

echo "[$(date)] Starting webhook health check for: $WEBHOOK_URL"

# Check webhook health (depends on webhook implementation)
# This is a generic ping endpoint check
check_webhook() {
    local url="$1"

    # Try to reach the webhook with a GET request
    local status
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" --connect-timeout 5 --max-time 10 2>/dev/null || echo "000")

    if [ "$status" -ge 200 ] && [ "$status" -lt 400 ]; then
        echo "[$(date)] Webhook is responding (HTTP $status)"
        return 0
    fi

    echo "[$(date)] Webhook returned HTTP $status"
    return 1
}

retry_webhook() {
    local url="$1"
    local attempt="$2"

    echo "[$(date)] Retrying webhook (attempt $attempt/$MAX_RETRIES)"

    # Re-deliver the webhook payload
    # This would typically re-read from a queue or event log

    if check_webhook "$url"; then
        echo "[$(date)] Webhook recovered"
        return 0
    fi

    return 1
}

attempt=1
while [ $attempt -le $MAX_RETRIES ]; do
    if check_webhook "$WEBHOOK_URL"; then
        exit 0
    fi

    if retry_webhook "$WEBHOOK_URL" "$attempt"; then
        exit 0
    fi

    if [ $attempt -lt $MAX_RETRIES ]; then
        echo "[$(date)] Waiting ${RETRY_DELAY}s before next attempt..."
        sleep $RETRY_DELAY
    fi

    attempt=$((attempt + 1))
done

echo "[$(date)] Failed to recover webhook after $MAX_RETRIES attempts"
exit 1
