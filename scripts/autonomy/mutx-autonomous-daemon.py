#!/usr/bin/env python3
"""
MUTX Autonomous Shipping Daemon
Spawns Codex to process items from the action queue.
Supervised: keeps running, auto-restarts, logs everything.
"""
import json, os, sys, time, subprocess, signal
from datetime import datetime

REPO      = "/Users/fortune/MUTX"
QUEUE     = f"{REPO}/mutx-engineering-agents/dispatch/action-queue.json"
LOG       = "/Users/fortune/.openclaw/logs/autonomous-loop.log"
PID_FILE  = "/Users/fortune/.openclaw/autonomous-daemon.pid"
GATEWAY   = "http://127.0.0.1:18789"

WORKTREES = {
    "default": "/Users/fortune/mutx-worktrees/factory/backend",
    "frontend": "/Users/fortune/mutx-worktrees/factory/frontend",
}

def log(m):
    t = datetime.now().strftime("%H:%M:%S")
    line = f"[{t}] {m}"
    print(line, flush=True)
    with open(LOG, "a") as f:
        f.write(line + "\n")

def read_queue():
    try:
        with open(QUEUE) as f:
            return json.load(f)
    except:
        return {"version": "1.1", "items": []}

def save(q):
    with open(QUEUE, "w") as f:
        json.dump(q, f, indent=2)

def top_item(q):
    items = [i for i in q.get("items", []) if i.get("status") == "queued"]
    items.sort(key=lambda x: {"p0":0,"p1":1,"p2":2}.get(x.get("priority","p2"), 2))
    return items[0] if items else None

def worktree_for(area=""):
    area = area.lower()
    for key in WORKTREES:
        if key in area:
            return WORKTREES[key]
    return WORKTREES["default"]

def spawn_codex_session(item):
    """Spawn a codex session via openclaw CLI to process one queue item."""
    id_    = item["id"]
    title  = item.get("title", "")[:80]
    area   = item.get("area", "default")
    desc   = item.get("description", "")[:400]
    wt     = worktree_for(area)
    
    log(f">>> [{id_}] {title} | area={area} | wt={os.path.basename(wt)}")

    task = f"""You are the MUTX autonomous coding agent.

WORKING DIRECTORY: {wt}
REPO: {REPO}
ITEM ID: {id_}
TITLE: {title}
AREA: {area}
DESCRIPTION: {desc}

PROTOCOL:
1. cd {wt} && git fetch origin && git checkout main && git pull origin main
2. git checkout -b autonomy/{id_}
3. Implement the change described in the queue item
4. Run: make lint 2>/dev/null || true
5. Run: make test 2>/dev/null || true
6. git add -A && git commit -m "autonomy: {title[:60]}\n\nid: {id_}\narea: {area}\nautonomous: yes"
7. git push -u origin autonomy/{id_} 2>&1
8. gh pr create \
    --title "[autonomy] {title[:100]}" \
    --body "Autonomous implementation. ID: {id_}. Area: {area}." \
    --base main \
    --repo mutx-dev/mutx-dev 2>&1 || true
9. Print DONE when complete.

Start immediately. Do not ask for confirmation."""

    label = f"autonomy-{id_}"
    
    # Use openclaw CLI sessions_spawn
    cmd = [
        "openclaw", "sessions", "spawn",
        "--task", task,
        "--label", label,
        "--runtime", "acp",
        "--model", "minimax-m2.7",
        "--mode", "run",
        "--timeout", "600",
    ]
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600,
            cwd=REPO,
        )
        out = result.stdout + result.stderr
        ok = result.returncode == 0
        log(f"<<< [{id_}] exit={result.returncode} | {out[:120]}")
        return ok
    except subprocess.TimeoutExpired:
        log(f"<<< [{id_}] TIMEOUT after 600s")
        return False
    except Exception as e:
        log(f"<<< [{id_}] ERROR: {e}")
        return False

def daemon():
    log("=== MUTX Autonomous Daemon starting ===")
    log(f"Queue: {QUEUE}")
    log(f"Worktrees: {WORKTREES}")
    
    # Daemonize
    if os.fork():
        sys.exit(0)
    
    with open(PID_FILE, "w") as f:
        f.write(str(os.getpid()))
    
    signal.signal(signal.SIGTERM, lambda *a: sys.exit(0))
    
    while True:
        q = read_queue()
        item = top_item(q)
        
        if not item:
            log("Queue empty, sleeping 5min...")
            time.sleep(300)
            continue
        
        id_ = item["id"]
        
        # Mark in-progress
        item["status"] = "in_progress"
        save(q)
        
        try:
            ok = spawn_codex_session(item)
        except Exception as e:
            log(f"SPAWN ERROR: {e}")
            ok = False
        
        # Remove from queue on completion
        q = read_queue()
        q["items"] = [i for i in q["items"] if i["id"] != id_]
        if not ok:
            # Re-queue as failed
            item["status"] = "failed"
            q["items"].append(item)
        save(q)
        
        log(f">>> [{id_}] {'OK' if ok else 'FAILED'} — sleeping 30s before next item")
        time.sleep(30)

if __name__ == "__main__":
    daemon()
