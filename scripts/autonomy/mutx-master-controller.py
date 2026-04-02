#!/usr/bin/env python3
"""
MUTX Master Controller — runs gap scanner + daemon watchdog in one supervised process.
Replaces LaunchAgent approach (sandbox issues). Uses simple nohup supervision.
"""
import os, sys, time, subprocess, json, signal
import os
_REPO = None
def _get_repo():
    global _REPO
    if _REPO:
        return _REPO
    # MUTX_REPO env var takes priority (for CI/cross-clone use)
    _REPO = os.environ.get("MUTX_REPO")
    if _REPO and Path(_REPO).exists():
        return _REPO
    # Fall back to repo root relative to this file
    _REPO = str(Path(__file__).resolve().parents[2])
    return _REPO
REPO = _get_repo()

REPO      = "REPO"
DAEMON    = f"{REPO}/scripts/autonomy/mutx-autonomous-daemon.py"
GAPSCAN   = f"{REPO}/scripts/autonomy/mutx-gap-scanner-v3.py"
QUEUE     = f"{REPO}/mutx-engineering-agents/dispatch/action-queue.json"
LOG       = "/Users/fortune/.openclaw/logs/master-controller.log"
PIDFILE   = f"{REPO}/.master-controller.pid"

GAP_INTERVAL  = 300  # 5 min
WATCH_INTERVAL = 120  # 2 min

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG, "a") as f:
        f.write(line + "\n")

def run_cmd(cmd, timeout=60):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout, cwd=REPO)
        return r.returncode, r.stdout, r.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "timeout"
    except Exception as e:
        return -1, "", str(e)

def is_daemon_running():
    r = subprocess.run(['pgrep', '-f', 'mutx-autonomous-daemon.py'], capture_output=True, text=True)
    pids = [p for p in r.stdout.strip().split('\n') if p and int(p) != os.getpid()]
    return len(pids) > 0

def reset_stuck_queue():
    try:
        with open(QUEUE) as f:
            d = json.load(f)
    except:
        return
    for item in d.get('items', []):
        if item.get('status') == 'in_progress':
            item['status'] = 'queued'
    with open(QUEUE, 'w') as f:
        json.dump(d, f, indent=2)
    log("Reset stuck in_progress items to queued")

def start_daemon():
    if is_daemon_running():
        return
    reset_stuck_queue()
    log("Starting autonomous daemon...")
    subprocess.Popen(
        ['python3', DAEMON, '--no-daemonize'],
        stdout=open("/Users/fortune/.openclaw/logs/autonomous-daemon.log", "a"),
        stderr=subprocess.STDOUT,
        cwd=REPO
    )
    time.sleep(3)
    if is_daemon_running():
        log("Daemon started OK")
    else:
        log("WARNING: daemon may not have started")

def run_gap_scan():
    log("Running gap scanner v3...")
    rc, out, err = run_cmd(f'python3 {GAPSCAN}', timeout=120)
    if rc == 0:
        log(f"Gap scan OK")
    else:
        log(f"Gap scan error: {err[:100]}")

def main():
    log("Master controller starting")
    os.makedirs(os.path.dirname(LOG), exist_ok=True)

    last_gap = 0
    last_watch = 0

    while True:
        now = time.time()

        # Run gap scanner every GAP_INTERVAL
        if now - last_gap >= GAP_INTERVAL:
            run_gap_scan()
            last_gap = now

        # Watchdog every WATCH_INTERVAL
        if now - last_watch >= WATCH_INTERVAL:
            if not is_daemon_running():
                log("Daemon not running — restarting")
                start_daemon()
            last_watch = now

        time.sleep(10)  # check every 10 seconds

if __name__ == '__main__':
    # Daemonize
    if os.fork():
        sys.exit(0)
    os.setsid()
    if os.fork():
        sys.exit(0)
    with open(PIDFILE, 'w') as f:
        f.write(str(os.getpid()))
    signal.signal(signal.SIGTERM, lambda *a: sys.exit(0))
    main()
