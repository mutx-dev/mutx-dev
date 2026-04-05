#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${MUTX_REPO_ROOT:-/Users/fortune/MUTX}"
LAUNCHER="$REPO_ROOT/scripts/autonomy/daemon-launcher.sh"
PID_FILE="${MUTX_AUTONOMY_PID:-$REPO_ROOT/.autonomy/daemon.pid}"
STATUS_FILE="${MUTX_AUTONOMY_STATUS:-$REPO_ROOT/.autonomy/daemon-status.json}"
WATCHDOG_LOG="${MUTX_AUTONOMY_WATCHDOG_LOG:-$REPO_ROOT/reports/autonomy-watchdog.log}"
RESTART_STAMP="${MUTX_AUTONOMY_RESTART_STAMP:-$REPO_ROOT/.autonomy/watchdog-last-restart.txt}"
HEARTBEAT_TIMEOUT="${MUTX_AUTONOMY_HEARTBEAT_TIMEOUT:-900}"
RESTART_COOLDOWN="${MUTX_AUTONOMY_RESTART_COOLDOWN:-180}"
BOOTSTRAP_PYTHON="${MUTX_AUTONOMY_BOOTSTRAP_PYTHON:-python3}"
PYTHON_RESOLVER="$REPO_ROOT/scripts/autonomy/python_runtime.py"
PYTHON_BIN=""

mkdir -p "$(dirname "$WATCHDOG_LOG")" "$(dirname "$RESTART_STAMP")"

resolve_python_bin() {
  if ! PYTHON_BIN="$($BOOTSTRAP_PYTHON "$PYTHON_RESOLVER")"; then
    echo "failed to resolve supported autonomy python runtime" >&2
    return 1
  fi
  export MUTX_AUTONOMY_PYTHON="$PYTHON_BIN"
}

resolve_python_bin

log_watchdog() {
  printf '%s %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*" >> "$WATCHDOG_LOG"
}

is_running() {
  if [[ ! -f "$PID_FILE" ]]; then
    return 1
  fi
  local pid
  pid="$(tr -d '[:space:]' < "$PID_FILE")"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" >/dev/null 2>&1
}

heartbeat_is_fresh() {
  if [[ ! -f "$STATUS_FILE" ]]; then
    return 1
  fi
  "$PYTHON_BIN" - "$STATUS_FILE" "$HEARTBEAT_TIMEOUT" <<'PY'
import json, sys, time
from datetime import datetime
path, timeout = sys.argv[1], int(sys.argv[2])
with open(path, encoding='utf-8') as handle:
    payload = json.load(handle)
heartbeat = payload.get('heartbeat_at')
if not heartbeat:
    raise SystemExit(1)
heartbeat = heartbeat.replace('Z', '+00:00')
try:
    ts = datetime.fromisoformat(heartbeat).timestamp()
except ValueError:
    raise SystemExit(1)
raise SystemExit(0 if (time.time() - ts) <= timeout else 1)
PY
}

recent_restart() {
  if [[ ! -f "$RESTART_STAMP" ]]; then
    return 1
  fi
  local now last
  now="$(date +%s)"
  last="$(tr -d '[:space:]' < "$RESTART_STAMP")"
  [[ -n "$last" ]] || return 1
  (( now - last < RESTART_COOLDOWN ))
}

record_restart() {
  date +%s > "$RESTART_STAMP"
}

if is_running && heartbeat_is_fresh; then
  exit 0
fi

if recent_restart; then
  log_watchdog "restart suppressed by cooldown; daemon unhealthy or missing"
  exit 1
fi

if is_running; then
  log_watchdog "heartbeat stale; restarting daemon"
  "$LAUNCHER" restart
else
  rm -f "$PID_FILE"
  log_watchdog "daemon missing; starting daemon"
  "$LAUNCHER" start
fi
record_restart
