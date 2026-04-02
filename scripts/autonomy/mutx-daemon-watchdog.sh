#!/bin/bash
# MUTX Daemon Health Watchdog — no sudo required
LOG="/Users/fortune/.openclaw/logs/autonomous-daemon.log"
QUEUE="/Users/fortune/MUTX/mutx-engineering-agents/dispatch/action-queue.json"
DAEMON="/Users/fortune/MUTX/scripts/autonomy/mutx-autonomous-daemon.py"

# Check if daemon is running
if pgrep -f "mutx-autonomous-daemon" > /dev/null 2>&1; then
    echo "$(date -u '+%Y-%m-%d %H:%M:%S') UTC - Daemon alive" >> "$LOG"
else
    echo "$(date -u '+%Y-%m-%d %H:%M:%S') UTC - Daemon dead, restarting" >> "$LOG"

    # Reset stuck in_progress items to queued
    python3 -c "
import json
try:
    with open('$QUEUE') as f:
        d = json.load(f)
    for item in d.get('items', []):
        if item.get('status') == 'in_progress':
            item['status'] = 'queued'
    with open('$QUEUE', 'w') as f:
        json.dump(d, f, indent=2)
    print('Queue reset OK')
except Exception as e:
    print(f'Queue reset error: {e}')
" >> "$LOG" 2>&1

    # Start daemon
    cd /Users/fortune/MUTX
    nohup python3 "$DAEMON" --no-daemonize >> "$LOG" 2>&1 &
    sleep 2
    if pgrep -f "mutx-autonomous-daemon" > /dev/null 2>&1; then
        echo "$(date -u '+%Y-%m-%d %H:%M:%S') UTC - Daemon restarted OK" >> "$LOG"
    else
        echo "$(date -u '+%Y-%m-%d %H:%M:%S') UTC - Daemon restart FAILED" >> "$LOG"
    fi
fi
