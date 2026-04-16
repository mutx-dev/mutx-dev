#!/usr/bin/env python3
"""
MUTX Autonomous Coding Loop
Reads queue → MiniMax generates code → git commits → gh PRs → loops
"""
import json, os, time, subprocess, urllib.request, urllib.error, shlex, re
from datetime import datetime
from pathlib import Path
_REPO = None
def _get_repo():
    global _REPO
    if _REPO:
        return _REPO
    _REPO = os.environ.get("MUTX_REPO")
    if _REPO and Path(_REPO).exists():
        return _REPO
    _REPO = str(Path(__file__).resolve().parents[2])
    return _REPO

def validate_branch_name(name: str) -> str:
    """Sanitize branch names: only allow alphanumeric, dashes, underscores, slashes."""
    if not re.match(r'^[a-zA-Z0-9/_\-]+$', name):
        raise ValueError(f"Invalid branch name: {name!r}")
    return name
REPO = _get_repo()
WT_BACKEND = "/Users/fortune/mutx-worktrees/factory/backend"
WT_FRONTEND = "/Users/fortune/mutx-worktrees/factory/frontend"
QUEUE = f"{REPO}/mutx-engineering-agents/dispatch/action-queue.json"
LOG = "/Users/fortune/.openclaw/logs/autonomous-coder.log"
GW = "http://localhost:18789"

F = open(LOG, "a", buffering=1)
def log(m):
    t = datetime.now().strftime("%H:%M:%S")
    line = f"[{t}] {m}"
    print(line, flush=True)
    F.write(line+"\n"); F.flush()

def api(prompt, max_tokens=3000):
    """Call MiniMax-M2.7 via gateway"""
    payload = {
        "model": "minimax-portal/MiniMax-M2.7",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens
    }
    try:
        req = urllib.request.Request(
            f"{GW}/api/v1/chat/completions",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read())
    except Exception as e:
        log(f"API error: {e}")
        return None

def run(cmd, cwd=None, timeout=60):
    """Execute a command. Accepts either a string (split into args) or a list of args.
    Never uses shell=True to prevent injection."""
    try:
        if isinstance(cmd, str):
            cmd = shlex.split(cmd)
        r = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd, timeout=timeout)
        return r.returncode, r.stdout, r.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "timeout"
    except Exception as e:
        return -1, "", str(e)

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

def worktree_for(area):
    if "web" in area or "test" in area or "frontend" in area:
        return WT_FRONTEND
    return WT_BACKEND

def sync(wt):
    run("git fetch origin", cwd=wt, timeout=30)
    run("git checkout main", cwd=wt, timeout=30)
    run("git pull origin main", cwd=wt, timeout=60)

def make_branch(wt, name):
    sync(wt)
    run(f"git checkout -b {name}", cwd=wt, timeout=30)

def implement(item):
    id_ = item["id"]
    title = item["title"]
    area = item.get("area", "area:api")
    desc = item.get("description", "")
    wt = worktree_for(area)
    branch = f"autonomy/{validate_branch_name(id_)}"

    log(f"Branch: {branch} in {wt}")
    make_branch(wt, branch)

    # Generate implementation
    prompt = f"""You are implementing a MUTX autonomous task.

Working dir: {wt}
Task: {title}
Description: {desc}

Generate the complete file changes needed. Respond ONLY with a JSON object:
{{
  "files": [
    {{
      "path": "relative/path/from/{wt}/to/file.ext",
      "content": "complete file content here"
    }}
  ],
  "commit_message": "short commit message"
}}

Rules:
- path is relative to {wt}
- Include ALL files that need to be created or modified
- content is the COMPLETE file content, not a diff
- Keep commits small and focused
- For docs: put in docs/
- For SDK: put in sdk/mutx/
- For CLI: put in cli/commands/
- For web: put in app/dashboard/

Respond with ONLY the JSON, no explanation."""

    log(f"Calling MiniMax for {id_}...")
    resp = api(prompt)

    if not resp:
        log(f"MiniMax call failed for {id_}")
        return False

    try:
        choices = resp.get("choices", [])
        if not choices:
            log(f"No choices in response: {resp}")
            return False
        content = choices[0].get("message", {}).get("content", "")
        # Extract JSON
        start = content.find("{")
        end = content.rfind("}") + 1
        data = json.loads(content[start:end])

        files = data.get("files", [])
        commit_msg = data.get("commit_message", f"autonomy: {title}")

        log(f"Applying {len(files)} files...")

        for fdata in files:
            fpath = os.path.join(wt, fdata["path"])
            os.makedirs(os.path.dirname(fpath), exist_ok=True)
            with open(fpath, "w") as f:
                f.write(fdata["content"])
            log(f"  wrote: {fdata['path']}")

        # Commit and PR
        run("make lint 2>/dev/null || true", cwd=wt, timeout=60)
        run("git add -A", cwd=wt, timeout=30)

        commit_body = f"autonomy: {title}\n\nid: {id_}\narea: {area}\nautonomous: yes"
        code, out, err = run(f'git commit -m {shlex.quote(commit_body)}', cwd=wt, timeout=30)

        if code != 0:
            log(f"Commit failed: {err[:100]}")
            # Maybe nothing changed, check if at least the branch exists
            if "nothing to commit" in err:
                log("Nothing to commit, checking branch...")
                run(f"git push -u origin {branch}", cwd=wt, timeout=60)
            else:
                return False

        run(f"git push -u origin {branch}", cwd=wt, timeout=60)

        # Create PR — title and pr_body are untrusted, quote them
        pr_title = f"[autonomy] {title}"
        pr_body = f"Autonomous PR | id: {id_} | area: {area}\n\n{title}"
        code, out, err = run(
            f'gh pr create --title {shlex.quote(pr_title)} --body {shlex.quote(pr_body)} --base main',
            cwd=wt, timeout=30
        )

        if code == 0:
            log(f"PR created for {id_}: {out[:100]}")
            return True
        else:
            log(f"PR create: {err[:100]}")
            return "already_exists" in err

    except json.JSONDecodeError as e:
        log(f"JSON parse error: {e}")
        log(f"Content: {content[:200] if content else 'empty'}")
        return False
    except Exception as e:
        log(f"Error: {e}")
        return False

def main():
    log("=== Autonomous coder starting ===")
    os.chdir(REPO)

    while True:
        q = read_queue()
        item = top_item(q)

        if not item:
            log("Queue empty, sleeping 5min")
            time.sleep(300)
            continue

        id_ = item["id"]
        title = item["title"][:60]
        item["status"] = "in_progress"
        save(q)

        log(f">>> {id_}: {title}")

        ok = implement(item)

        # Remove from queue
        q = read_queue()
        q["items"] = [i for i in q["items"] if i["id"] != id_]
        save(q)

        log(f"<<< {id_} -> {'OK' if ok else 'FAIL'}")
        time.sleep(15)

if __name__ == "__main__":
    main()
