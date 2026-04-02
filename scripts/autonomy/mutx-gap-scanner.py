#!/usr/bin/env python3
"""MUTX Gap Scanner v4 — shell=False, proper gh CLI calls."""
import json, os, subprocess, time, glob
from datetime import datetime
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

GH      = "/opt/homebrew/bin/gh"
QUEUE   = "REPO/mutx-engineering-agents/dispatch/action-queue.json"
LOG     = "/Users/fortune/.openclaw/logs/gap-scanner.log"
REPO    = "REPO"
WT      = "/Users/fortune/mutx-worktrees/factory/backend"
GH_REPO = "mutx-dev/mutx-dev"

def log(m):
    t = datetime.now().strftime("%H:%M:%S")
    line = f"[{t}] {m}"
    print(line, flush=True)
    with open(LOG, "a") as f:
        f.write(line + "\n")

def gh(args, timeout=30):
    """Run gh with args list, return json or []"""
    cmd = [GH] + args
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    try:
        return json.loads(r.stdout), r.returncode
    except:
        return [], r.returncode

def gh_text(args, timeout=30):
    """Run gh, return raw stdout string."""
    cmd = [GH] + args
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    return r.stdout.strip(), r.returncode

def git(args, cwd=WT, timeout=30):
    cmd = ["git"] + args
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd, timeout=timeout)
    return r.stdout.strip(), r.returncode

def read_queue():
    try:
        with open(QUEUE) as f:
            return json.load(f)
    except:
        return {"version": "1.1", "items": []}

def save(q):
    with open(QUEUE, "w") as f:
        json.dump(q, f, indent=2)

def in_queue(q, title):
    return any(i.get("title","").lower() == title.lower() for i in q.get("items",[]))

def add(q, item):
    q.setdefault("items",[])
    if not in_queue(q, item["title"]):
        q["items"].append(item)
        log(f"  + [{item['priority']}] {item['title'][:80]}")
    else:
        log(f"    already queued: {item['title'][:60]}")

def main():
    log("=== Gap scanner v4 starting ===")
    q = read_queue()

    # 1. GitHub issues: autonomy:ready / good-first-issue
    for label in ["autonomy:ready", "good-first-issue"]:
        data, rc = gh(["issue", "list", "--repo", GH_REPO, "--label", label,
                        "--state", "open", "--limit", "20", "--json", "number,title,body"])
        for issue in (data or []):
            num = issue.get("number","")
            title = issue.get("title","")
            body = issue.get("body","")[:200]
            if not title:
                continue
            pri = "p1" if "good-first" in label else "p2"
            add(q, {"id": f"scan-gh-{num}", "title": title, "description": body,
                     "area": "github", "priority": pri, "status": "queued",
                     "source": f"gap-scanner:{label}"})

    # 2. Stale open PRs (>7 days)
    data, rc = gh(["pr", "list", "--repo", GH_REPO, "--state", "open",
                    "--limit", "50", "--json", "number,title,createdAt"])
    for pr in (data or []):
        try:
            created = datetime.strptime(pr.get("createdAt","1970-01-01")[:10], "%Y-%m-%d")
            age = (datetime.now() - created).days
        except:
            age = 0
        if age > 7:
            add(q, {"id": f"pr-stale-{pr['number']}",
                     "title": f"review: merge/close PR #{pr['number']} — {pr.get('title','')[:50]}",
                     "description": f"PR #{pr['number']} open {age} days. Review or close.",
                     "area": "github", "priority": "p1", "status": "queued",
                     "source": "gap-scanner:stale-prs"})

    # 4. SDK test coverage gaps
    modules = set(glob.glob(f"{REPO}/sdk/mutx/*.py"))
    modules = {os.path.basename(m).replace(".py","") for m in modules}
    modules = {m for m in modules if not m.startswith("_")}
    tested = set()
    for f in glob.glob(f"{REPO}/tests/sdk/test_*.py"):
        tested.add(os.path.basename(f).replace("test_","").replace(".py",""))
    for mod in sorted(modules - tested)[:5]:
        add(q, {"id": f"coverage-{mod}",
                 "title": f"test: add coverage for SDK module `{mod}`",
                 "description": f"No test found for SDK module `{mod}`. Create tests/sdk/test_{mod}.py",
                 "area": "backend", "priority": "p1", "status": "queued",
                 "source": "gap-scanner:coverage"})

    # 5. Stale un-pushed local branches (>7d old) — SKIP cleanup items, they flood the queue
    # Branch cleanup is handled by the daemon directly via git automation, not via queue
    # This section is disabled to prevent queue flooding with un-actionable stale branch items
    pass

    save(q)
    log(f"=== Gap scanner done — {len(q.get('items',[]))} items queued ===")

if __name__ == "__main__":
    main()
