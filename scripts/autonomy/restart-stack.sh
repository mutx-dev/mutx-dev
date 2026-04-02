#!/bin/bash
# Restart the full MUTX autonomy stack
set -e

LOG="/Users/fortune/.openclaw/logs"
REPO="/Users/fortune/MUTX"

echo "=== Stopping old processes ==="
# Kill old master controller and signal engine
[ -f "$REPO/.master-controller.pid" ] && kill $(cat "$REPO/.master-controller.pid") 2>/dev/null && echo "Master controller stopped" || true
[ -f "$REPO/.signal-engine.pid" ] && kill $(cat "$REPO/.signal-engine.pid") 2>/dev/null && echo "Signal engine stopped" || true

sleep 2

echo "=== Testing gap scanner v4 ==="
cd "$REPO"
python3 scripts/autonomy/mutx-gap-scanner-v4.py
echo "Gap scan exit: $?"

echo "=== Testing signal engine (dry) ==="
# Just verify the script syntax
python3 -c "import sys; sys.path.insert(0,'scripts/autonomy'); import mutx_signal_engine; print('Signal engine OK')"

echo "=== Starting master controller ==="
nohup python3 "$REPO/scripts/autonomy/mutx-master-controller.py" >> "$LOG/master-controller.log" 2>&1 &
echo "Master controller PID: $!"

sleep 2
echo "=== Done ==="
tail -5 "$LOG/master-controller.log"