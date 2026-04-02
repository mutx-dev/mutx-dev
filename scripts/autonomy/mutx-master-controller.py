#!/usr/bin/env python3
"""
MUTX Master Controller v3 — Lean Gap Scanner
Only runs gap scanner (every 5 min). Signal engine runs as OpenClaw cron instead.
"""
from pathlib import Path
import os, sys, time, subprocess, signal

_REPO = None
def _get_repo():
    global _REPO
    if _REPO: return _REPO
    _REPO = os.environ.get("MUTX_REPO")
    if _REPO and Path(_REPO).exists(): return _REPO
    _REPO = str(Path(__file__).resolve().parents[2])
    return _REPO

REPO = _get_repo()
GAPSCAN_V4 = f"{REPO}/scripts/autonomy/mutx-gap-scanner-v4.py"
LOG        = "/Users/fortune/.openclaw/logs/master-controller.log"
PIDFILE    = f"{REPO}/.master-controller.pid"
GAP_INTERVAL = 300  # 5 min

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG, "a") as f:
        f.write(line + "\n")

def run_gap_scan():
    log("Running gap scanner v4...")
    try:
        r = subprocess.run(['python3', GAPSCAN_V4], capture_output=True, text=True,
                          timeout=120, cwd=REPO)
        log(f"Gap scan {'OK' if r.returncode == 0 else f'error: {r.stderr[:100]}'}")
    except subprocess.TimeoutExpired:
        log("Gap scan timeout")
    except Exception as e:
        log(f"Gap scan exception: {e}")

def main():
    log("Master controller v3 starting — gap scan only")
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    run_gap_scan()
    last_gap = time.time()
    while True:
        now = time.time()
        if now - last_gap >= GAP_INTERVAL:
            run_gap_scan()
            last_gap = now
        time.sleep(10)

if __name__ == '__main__':
    if os.fork():
        sys.exit(0)
    os.setsid()
    if os.fork():
        sys.exit(0)
    with open(PIDFILE, 'w') as f:
        f.write(str(os.getpid()))
    signal.signal(signal.SIGTERM, lambda *a: sys.exit(0))
    main()
