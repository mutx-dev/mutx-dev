#!/usr/bin/env python3
"""
MUTX Signal Engine v2 — gap scan → dispatch specialized agents
Every 5 min: read signals/gap-scan signal.md, queue new items, spawn agents.
"""
from pathlib import Path
import json, os, re, time, sys, subprocess
from datetime import datetime

_REPO = None
def _get_repo():
    global _REPO
    if _REPO: return _REPO
    _REPO = os.environ.get("MUTX_REPO")
    if _REPO and Path(_REPO).exists(): return _REPO
    _REPO = str(Path(__file__).resolve().parents[2])
    return _REPO

REPO = _get_repo()
SIGNAL_FILE = f"{REPO}/signals/gap-scan signal.md"
QUEUE_FILE  = f"{REPO}/mutx-engineering-agents/dispatch/action-queue.json"
LOG         = "/Users/fortune/.openclaw/logs/signal-engine.log"
GH_REPO     = "mutx-dev/mutx-dev"
LOOP_SECS   = 300

GH_TOKEN = ""
try:
    GH_TOKEN = subprocess.check_output(["gh", "auth", "token"], text=True).strip()
except:
    GH_TOKEN = os.environ.get("GH_TOKEN", "")

WT_BACK  = "/Users/fortune/mutx-worktrees/factory/backend"
WT_FRONT = "/Users/fortune/mutx-worktrees/factory/frontend"

def log(m):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] {m}"
    print(line, flush=True)
    with open(LOG, "a") as f:
        f.write(line + "\n")

def sh(cmd, cwd=None, timeout=30):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True,
                      cwd=cwd or REPO, timeout=timeout)
    return r.returncode, r.stdout + r.stderr

def sig_id(item):
    key = f"{item['desc'][:30]}{item['file']}"
    import hashlib
    return f"sig-{hashlib.md5(key.encode()).hexdigest()[:8]}"

def area_for(file_):
    if any(ext in file_ for ext in ['.tsx', '.ts']) or 'components/' in file_ or 'app/' in file_:
        return 'frontend'
    return 'backend'

def worktree_for(area):
    return WT_FRONT if area == 'frontend' else WT_BACK

def sync_wt(wt, name):
    """Sync worktree to GitHub main."""
    if GH_TOKEN:
        sh(f"git remote set-url origin https://x-access-token:{GH_TOKEN}@github.com/{GH_REPO}.git", cwd=wt)
    rc, _ = sh("git fetch origin main:github-main 2>&1", cwd=wt, timeout=15)
    if rc == 0:
        rc2, _ = sh("git checkout --detach github-main 2>&1", cwd=wt, timeout=10)
        if rc2 == 0:
            _, out = sh("git rev-parse --short github-main", cwd=wt, timeout=5)
            log(f"  [{name}] synced → {out.strip()}")
            return True
    log(f"  [!] [{name}] sync failed")
    return False

def parse_signal():
    """Parse gap-scan signal.md into items."""
    if not os.path.exists(SIGNAL_FILE):
        return []
    with open(SIGNAL_FILE) as f:
        content = f.read()
    items = []
    in_high = False
    for line in content.split("\n"):
        if "## 🔴 High Priority" in line:
            in_high = True
            continue
        if "## 🟡 Medium Priority" in line or "## 🔇 Noise" in line:
            in_high = False
            continue
        if in_high and line.strip().startswith("- ["):
            m = re.match(r"- \[(\w+)\] \[(p\d)\] (.+?) \| ([^\|]+) \| effort: (\w)", line.strip())
            if m:
                area, priority, desc, file_, effort = m.groups()
                items.append({
                    "area": area, "priority": priority,
                    "desc": desc.strip(), "file": file_.strip(),
                    "effort": effort, "status": "queued"
                })
    return items

def read_queue():
    try:
        with open(QUEUE_FILE) as f:
            return json.load(f)
    except:
        return {"version": "1.2", "generated": "", "items": []}

def save_queue(q):
    with open(QUEUE_FILE, "w") as f:
        json.dump(q, f, indent=2)

def spawn_agent(item):
    """Spawn a subagent via openclaw CLI using task file."""
    id_    = sig_id(item)
    desc   = item["desc"]
    file_  = item["file"]
    area   = item.get("area", area_for(file_))
    effort = item.get("effort", "M")
    wt     = worktree_for(area)
    timeout = 600 if effort == "H" else 300

    sync_wt(wt, area)

    task = f"""MUTX autonomous coding task. Execute without asking for confirmation.

**Task**: {desc}
**File**: {file_}
**Area**: {area}
**Repo**: {GH_REPO}
**Worktree**: {wt}

**Steps**:
1. `cd {wt} && git fetch origin main:github-main && git checkout --detach github-main`
2. `git checkout -b autonomy/{id_}`
3. Implement the work described. Write real code/tests — no stubs.
4. `pytest tests/ -q` to verify nothing broke.
5. `git add -A && git commit -m "autonomy: {desc[:60]}"`
6. `git push origin HEAD:refs/heads/autonomy/{id_} --force`
7. `gh pr create --title "autonomy: {desc[:80]}" --body "Automated implementation. ID: {id_}. Area: {area}." --base main`
8. Print the PR URL.

Execute autonomously. Do not ask for permission."""

    log(f"  Spawning: {id_} ({desc[:50]})")

    task_file = f"/tmp/mutx-task-{id_}.txt"
    with open(task_file, "w") as f:
        f.write(task)

    cli = "/opt/homebrew/bin/openclaw"
    if not Path(cli).exists():
        cli = "openclaw"

    # Spawn via openclaw CLI
    rc, out = sh(
        f'"{cli}" sessions spawn '
        f'--label "autonomy-{id_}" '
        f'--mode run '
        f'--runtime subagent '
        f'--task-file "{task_file}" '
        f'--run-timeout-seconds {timeout}',
        timeout=20
    )
    try:
        os.unlink(task_file)
    except:
        pass

    if rc == 0:
        log(f"  ✓ Agent dispatched: {id_}")
        return True
    else:
        log(f"  [!] Spawn failed for {id_}: {out[:200]}")
        return False

def main():
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    os.makedirs(os.path.dirname(QUEUE_FILE), exist_ok=True)
    log("Signal engine v2 started")

    cycle = 0
    while True:
        cycle += 1
        log(f"=== Cycle {cycle} ===")

        items = parse_signal()
        log(f"  Signal: {len(items)} items")

        if items:
            queue = read_queue()
            existing = {i["id"] for i in queue.get("items", [])}

            added = 0
            spawned = 0
            for item in items:
                id_ = sig_id(item)
                item["id"] = id_
                item["generated"] = datetime.now().isoformat()
                if id_ not in existing:
                    queue["items"].append(item)
                    added += 1
                    log(f"  + {item['desc'][:60]}")
                    if item["priority"] in ["p1", "p2"] and item["effort"] in ["L", "M"]:
                        spawn_agent(item)
                        spawned += 1
                        time.sleep(3)  # stagger spawns
            queue["generated"] = datetime.now().isoformat()
            save_queue(queue)
            log(f"  Done: +{added} queued, {spawned} agents spawned")
        else:
            log("  No signal items — skipping")

        log(f"  Sleeping {LOOP_SECS}s...")
        time.sleep(LOOP_SECS)

if __name__ == "__main__":
    if os.fork():
        sys.exit(0)
    os.setsid()
    if os.fork():
        sys.exit(0)
    with open(f"{REPO}/.signal-engine.pid", "w") as f:
        f.write(str(os.getpid()))
    import signal
    signal.signal(signal.SIGTERM, lambda *a: sys.exit(0))
    main()