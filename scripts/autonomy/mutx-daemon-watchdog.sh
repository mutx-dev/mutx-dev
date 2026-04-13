#!/usr/bin/env bash
set -euo pipefail

# Legacy compatibility wrapper.
# Old cron wiring still calls this path; hand off to the current watchdog.

REPO_ROOT="${MUTX_REPO_ROOT:-/Users/fortune/MUTX}"
CURRENT_WATCHDOG="$REPO_ROOT/scripts/autonomy/daemon-watchdog.sh"
WATCHDOG_LOG="${MUTX_AUTONOMY_WATCHDOG_LOG:-$REPO_ROOT/reports/autonomy-watchdog.log}"

mkdir -p "$(dirname "$WATCHDOG_LOG")"
printf '%s legacy watchdog wrapper -> daemon-watchdog.sh\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> "$WATCHDOG_LOG"

exec "$CURRENT_WATCHDOG"
