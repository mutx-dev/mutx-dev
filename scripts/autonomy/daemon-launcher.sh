#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${MUTX_REPO_ROOT:-/Users/fortune/MUTX}"
PID_FILE="${MUTX_AUTONOMY_PID:-$REPO_ROOT/.autonomy/daemon.pid}"
LOCK_FILE="${MUTX_AUTONOMY_LOCK:-$REPO_ROOT/.autonomy/daemon.lock}"
STATUS_FILE="${MUTX_AUTONOMY_STATUS:-$REPO_ROOT/.autonomy/daemon-status.json}"
LOG_FILE="${MUTX_AUTONOMY_LOG:-$REPO_ROOT/reports/autonomy-daemon.log}"
MAX_LOG_BYTES="${MUTX_AUTONOMY_MAX_LOG_BYTES:-20971520}"
PYTHON_BIN="${MUTX_AUTONOMY_PYTHON:-python3}"
COMMAND="${1:-start}"

mkdir -p "$(dirname "$PID_FILE")" "$(dirname "$LOCK_FILE")" "$(dirname "$STATUS_FILE")" "$(dirname "$LOG_FILE")"

is_running() {
  if [[ ! -f "$PID_FILE" ]]; then
    return 1
  fi
  local pid
  pid="$(tr -d '[:space:]' < "$PID_FILE")"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" >/dev/null 2>&1
}

read_status_value() {
  local key="$1"
  if [[ ! -f "$STATUS_FILE" ]]; then
    return 1
  fi
  "$PYTHON_BIN" - "$STATUS_FILE" "$key" <<'PY'
import json, sys
path, key = sys.argv[1], sys.argv[2]
with open(path, encoding='utf-8') as handle:
    payload = json.load(handle)
value = payload.get(key)
if value is None:
    raise SystemExit(1)
print(value)
PY
}

rotate_log_if_needed() {
  if [[ ! -f "$LOG_FILE" ]]; then
    return 0
  fi
  local size
  size="$(wc -c < "$LOG_FILE" | tr -d '[:space:]')"
  if [[ "$size" -lt "$MAX_LOG_BYTES" ]]; then
    return 0
  fi
  mv "$LOG_FILE" "$LOG_FILE.1"
  tail -n 4000 "$LOG_FILE.1" > "$LOG_FILE"
}

start_daemon() {
  if is_running; then
    echo "daemon already running: $(tr -d '[:space:]' < "$PID_FILE")"
    return 0
  fi
  rm -f "$PID_FILE"
  rotate_log_if_needed
  cd "$REPO_ROOT"
  nohup "$PYTHON_BIN" scripts/autonomy/daemon_main.py \
    --repo-root "$REPO_ROOT" \
    --lock-file "$LOCK_FILE" \
    --status-file "$STATUS_FILE" \
    --fleet-config "$REPO_ROOT/.autonomy/fleet.json" \
    --generated-task-output "$REPO_ROOT/.autonomy/generated-tasks.json" \
    >>"$LOG_FILE" 2>&1 </dev/null &
  local pid=$!
  echo "$pid" > "$PID_FILE"
  sleep 1
  if kill -0 "$pid" >/dev/null 2>&1; then
    echo "started daemon pid $pid"
    return 0
  fi
  echo "daemon failed to start; inspect $LOG_FILE" >&2
  rm -f "$PID_FILE"
  return 1
}

stop_daemon() {
  if ! is_running; then
    rm -f "$PID_FILE"
    echo "daemon not running"
    return 0
  fi
  local pid
  pid="$(tr -d '[:space:]' < "$PID_FILE")"
  kill "$pid" >/dev/null 2>&1 || true
  for _ in $(seq 1 20); do
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      rm -f "$PID_FILE"
      echo "stopped daemon pid $pid"
      return 0
    fi
    sleep 1
  done
  kill -9 "$pid" >/dev/null 2>&1 || true
  rm -f "$PID_FILE"
  echo "force killed daemon pid $pid"
}

show_status() {
  if is_running; then
    local pid
    pid="$(tr -d '[:space:]' < "$PID_FILE")"
    echo "daemon running: $pid"
    if [[ -f "$STATUS_FILE" ]]; then
      echo "status_file: $STATUS_FILE"
      read_status_value status || true
      read_status_value heartbeat_at || true
      "$PYTHON_BIN" - "$STATUS_FILE" <<'PY'
import json, sys
with open(sys.argv[1], encoding='utf-8') as handle:
    payload = json.load(handle)
summary = {
    'status': payload.get('status'),
    'heartbeat_at': payload.get('heartbeat_at'),
    'queue_depth': payload.get('queue_depth'),
    'cycle_count': payload.get('cycle_count'),
    'last_result': payload.get('last_result'),
    'last_error': payload.get('last_error'),
}
print(json.dumps(summary, indent=2, sort_keys=True))
PY
    fi
    return 0
  fi
  echo "daemon not running"
  if [[ -f "$STATUS_FILE" ]]; then
    echo "last_status:"
    "$PYTHON_BIN" - "$STATUS_FILE" <<'PY'
import json, sys
with open(sys.argv[1], encoding='utf-8') as handle:
    payload = json.load(handle)
print(json.dumps(payload, indent=2, sort_keys=True))
PY
  fi
  return 1
}

case "$COMMAND" in
  start)
    start_daemon
    ;;
  stop)
    stop_daemon
    ;;
  restart)
    stop_daemon || true
    start_daemon
    ;;
  status)
    show_status
    ;;
  *)
    echo "usage: $0 {start|stop|restart|status}" >&2
    exit 64
    ;;
esac
