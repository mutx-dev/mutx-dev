#!/usr/bin/env python3
"""
Mission Control Dispatcher Loop
Runs forever, polling every 60 seconds.
"""
import json
import subprocess
import os
import time
from datetime import datetime, timezone

WORKSPACE = "/Users/fortune/.openclaw/workspace/mutx-engineering-agents/dispatch"
REPO_DIR = "/Users/fortune/MUTX"
TASKS_FILE = f"{WORKSPACE}/tasks.json"
LOG_FILE = f"{WORKSPACE}/24h-activity-log.md"
THREADS_FILE = f"{WORKSPACE}/threads.json"

def gh(args, cwd=REPO_DIR):
    result = subprocess.run(
        ["gh"] + args,
        cwd=cwd,
        capture_output=True, text=True
    )
    return result.stdout.strip(), result.stderr.strip(), result.returncode

def log(msg):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    entry = f"\n## {ts}\n{msg}\n"
    with open(LOG_FILE, "a") as f:
        f.write(entry)
    print(f"[dispatcher] {ts} {msg}")

def load_tasks():
    with open(TASKS_FILE) as f:
        return json.load(f)

def save_tasks(data):
    data["version"] = 1
    data["lastUpdated"] = datetime.now(timezone.utc).isoformat()
    with open(TASKS_FILE, "w") as f:
        json.dump(data, f, indent=2)

def task_exists(tasks, branch, task_type):
    for t in tasks.get("tasks", []):
        if t.get("branch") == branch and t.get("type") == task_type and t.get("status") != "stale":
            return True
    return False

def next_id(tasks):
    max_id = 0
    for t in tasks.get("tasks", []):
        if t["id"].startswith("task-"):
            try:
                n = int(t["id"].split("-")[1])
                if n > max_id:
                    max_id = n
            except:
                pass
    return f"task-{max_id + 1}"

def create_task(tasks, task_obj):
    tasks["tasks"].append(task_obj)
    save_tasks(tasks)
    return task_obj["id"]

def notify_agent(agent, task):
    """Notify agent via sessions_send placeholder - log the handoff"""
    log(f"[handoff] → {agent} | task-{task['id']} ({task['type']}) | \"{task['title']}\"")

def run_iteration(iteration):
    now = datetime.now(timezone.utc)
    findings = []

    # ── 1. CI failures ──────────────────────────────────────────
    stdout, stderr, rc = gh(["run", "list", "-s", "failure", "-L", "10"])
    if rc == 0 and stdout:
        for line in stdout.strip().split("\n"):
            parts = line.split()
            if len(parts) < 2:
                continue
            run_id = parts[0]
            name = " ".join(parts[1:])
            # Get run details
            r_out, _, _ = gh(["run", "view", run_id, "--json", "headBranch,status,conclusion,databaseId"])
            try:
                run_data = json.loads(r_out)
                branch = run_data.get("headBranch", "")
                conclusion = run_data.get("conclusion", "")
                if conclusion != "failure":
                    continue
            except:
                branch = ""

            tasks = load_tasks()

            if branch == "main":
                if not task_exists(tasks, "main", "ci-fix"):
                    task_id = next_id(tasks)
                    task = {
                        "id": task_id,
                        "type": "ci-fix",
                        "priority": "critical",
                        "status": "pending",
                        "createdAt": now.isoformat(),
                        "updatedAt": now.isoformat(),
                        "owner": None,
                        "claimedBy": None,
                        "branch": "main",
                        "title": f"ci-fix: GitHub Actions failure on main — run {run_id}",
                        "description": f"CI run {run_id} failed on main. Workflow: {name}. Check CI logs and fix.",
                        "repo": "mutx-dev/mutx-dev",
                        "assignee": "proactive-coder",
                        "handoffs": [{"to": "code-reviewer", "when": "status=review"}, {"to": "merge-manager", "when": "status=approved"}],
                        "links": {"pr": None, "ci": f"https://github.com/mutx-dev/mutx-dev/actions/runs/{run_id}", "issue": None},
                        "tags": ["ci", "main", "critical"],
                        "error": None,
                        "attempts": 0,
                        "maxAttempts": 3
                    }
                    create_task(tasks, task)
                    notify_agent("proactive-coder", task)
                    findings.append(f"created {task_id} (ci-fix/main) from run {run_id}")
                else:
                    findings.append(f"ci-fix on main already exists, skipping")
            elif branch:
                if not task_exists(tasks, branch, "pr-patch"):
                    task_id = next_id(tasks)
                    task = {
                        "id": task_id,
                        "type": "pr-patch",
                        "priority": "high",
                        "status": "pending",
                        "createdAt": now.isoformat(),
                        "updatedAt": now.isoformat(),
                        "owner": None,
                        "claimedBy": None,
                        "branch": branch,
                        "title": f"pr-patch: CI failure on branch {branch}",
                        "description": f"CI run {run_id} failed on branch {branch}. Fix the CI failure to unblock the PR.",
                        "repo": "mutx-dev/mutx-dev",
                        "assignee": "proactive-coder",
                        "handoffs": [{"to": "code-reviewer", "when": "status=review"}],
                        "links": {"pr": None, "ci": f"https://github.com/mutx-dev/mutx-dev/actions/runs/{run_id}", "issue": None},
                        "tags": ["ci", "pr-patch"],
                        "error": None,
                        "attempts": 0,
                        "maxAttempts": 3
                    }
                    create_task(tasks, task)
                    notify_agent("proactive-coder", task)
                    findings.append(f"created {task_id} (pr-patch/{branch}) from run {run_id}")
    elif stderr:
        log(f"[warn] gh run list failed: {stderr[:200]}")

    # ── 2. Lint drift (every 10 iterations = 10 min) ──────────
    if iteration % 10 == 0:
        _, stderr_fetch, rc_fetch = gh(["fetch", "origin", "main"])
        if rc_fetch == 0:
            diff_out, _, _ = gh(["diff", "origin/main", "--name-only"])
            if diff_out:
                # Filter relevant source files
                relevant = [f for f in diff_out.strip().split("\n")
                            if f and any(f.endswith(ext) for ext in [".py", ".ts", ".tsx", ".js", ".jsx", ".py", ".sh"])]
                if relevant:
                    tasks = load_tasks()
                    if not task_exists(tasks, "main", "lint-fix"):
                        task_id = next_id(tasks)
                        task = {
                            "id": task_id,
                            "type": "lint-fix",
                            "priority": "high",
                            "status": "pending",
                            "createdAt": now.isoformat(),
                            "updatedAt": now.isoformat(),
                            "owner": None,
                            "claimedBy": None,
                            "branch": "main",
                            "title": f"lint-fix: {len(relevant)} files drifted from origin/main",
                            "description": f"Files out of sync with origin/main: {', '.join(relevant[:20])}. Run lint + format and commit.",
                            "repo": "mutx-dev/mutx-dev",
                            "assignee": "proactive-coder",
                            "handoffs": [],
                            "links": {"pr": None, "ci": None, "issue": None},
                            "tags": ["lint", "format", "main", "drift"],
                            "error": None,
                            "attempts": 0,
                            "maxAttempts": 3
                        }
                        create_task(tasks, task)
                        notify_agent("proactive-coder", task)
                        findings.append(f"created {task_id} (lint-fix) — {len(relevant)} files drifted")
                    else:
                        findings.append("lint-fix task already exists, skipping")
        else:
            log(f"[warn] git fetch failed: {stderr_fetch[:200]}")

    # ── 3. Stale task check ─────────────────────────────────────
    tasks = load_tasks()
    stale_count = 0
    for t in tasks.get("tasks", []):
        if t.get("status") in ("in-progress", "pending") and t.get("attempts", 0) >= t.get("maxAttempts", 3):
            t["status"] = "stale"
            t["updatedAt"] = now.isoformat()
            findings.append(f"marked {t['id']} ({t['type']}) as stale ({t.get('attempts',0)} attempts)")
            stale_count += 1
    if stale_count > 0:
        save_tasks(tasks)

    # ── 4. Log ──────────────────────────────────────────────────
    if findings:
        for f in findings:
            log(f"[action] {f}")
    else:
        log(f"[heartbeat] iteration {iteration} — no new findings")

    return len(findings)

def main():
    iteration = 0
    log("=== Mission Control Dispatcher started ===")
    while True:
        iteration += 1
        try:
            findings = run_iteration(iteration)
        except Exception as e:
            log(f"[ERROR] iteration {iteration} crashed: {str(e)}")
        time.sleep(60)

if __name__ == "__main__":
    main()
