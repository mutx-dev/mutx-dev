#!/usr/bin/env bash
# MUTX Repo Heartbeat — runs make dev, reports health, opens issue if broken
# Scheduled: every 4 hours via crontab
set -euo pipefail

REPO="/Users/fortune/MUTX"
LOG="/Users/fortune/.openclaw/logs/mutx-heartbeat.log"
DISCORD_WEBHOOK="${DISCORD_MUTX_WEBHOOK:-}"
GITHUB_TOKEN="${GH_TOKEN:-}"
GITHUB_REPO="mutx-dev/mutx-dev"
ISSUES_URL="https://api.github.com/repos/$GITHUB_REPO/issues"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"
}

notify_discord() {
    local status="$1"
    local msg="$2"
    if [[ -n "$DISCORD_WEBHOOK" ]]; then
        curl -s -X POST "$DISCORD_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"content\": \"[$status] MUTX Heartbeat: $msg\"}" >> /dev/null 2>&1 || true
    fi
}

open_github_issue() {
    local title="$1"
    local body="$2"
    if [[ -z "$GITHUB_TOKEN" ]]; then
        log "WARN: GH_TOKEN not set, skipping GitHub issue creation"
        return
    fi
    # Check if there's already an open heartbeat issue
    existing=$(curl -s -X GET "https://api.github.com/repos/$GITHUB_REPO/issues?state=open&labels=heartbeat" \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" 2>/dev/null || echo "[]")
    
    if echo "$existing" | grep -q '"number"'; then
        log "Open heartbeat issue already exists, skipping duplicate"
        return
    fi
    
    curl -s -X POST "$ISSUES_URL" \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Content-Type: application/json" \
        -d "$(jq -n --arg title "$title" --arg body "$body" \
            '{title: $title, body: $body, labels: ["heartbeat", "automated"]}')" >> /dev/null 2>&1 || true
}

# ── Main ─────────────────────────────────────────────────────────────────────
log "=== Heartbeat starting ==="
cd "$REPO"

# Ensure Docker context is correct
docker context use desktop-linux >> /dev/null 2>&1 || true

# Capture baseline
git rev-parse --short HEAD > /tmp/heartbeat_baseline.txt 2>/dev/null || echo "unknown" > /tmp/heartbeat_baseline.txt

# Run make dev
start_time=$(date +%s)
output=$(make dev 2>&1)
exit_code=$?
end_time=$(date +%s)
duration=$((end_time - start_time))

if [[ $exit_code -eq 0 ]]; then
    baseline=$(cat /tmp/heartbeat_baseline.txt)
    log "PASS [${duration}s] commit=$baseline"
    notify_discord "✅ PASS" "MUTX healthy in ${duration}s | commit=$(cat /tmp/heartbeat_baseline.txt)"
    
    # Close any open heartbeat issues if we're now healthy
    # (handled by next run if this was previously broken)
else
    baseline=$(cat /tmp/heartbeat_baseline.txt 2>/dev/null || echo "unknown")
    log "FAIL [${duration}s] commit=$baseline"
    log "Output: $output" | head -20 >> "$LOG"
    notify_discord "🚨 FAIL" "MUTX broken | commit=$baseline | ${duration}s | see heartbeat log"
    open_github_issue "🚨 [AUTOMATED] MUTX heartbeat failed — make dev broken" \
        "Heartbeat detected at $(date '+%Y-%m-%d %H:%M:%S').
        
Commit: \`$(cat /tmp/heartbeat_baseline.txt)\`
Duration: ${duration}s
Exit code: $exit_code

**Last 20 lines of make dev output:**
\`\`\`
$(echo "$output" | tail -20)
\`\`\`

This issue was opened automatically by the MUTX heartbeat cron. Assign and fix."
fi

log "=== Heartbeat done ==="
