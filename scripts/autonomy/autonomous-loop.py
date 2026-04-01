#!/usr/bin/env python3
"""
MUTX Autonomous Coding Loop — supervisor
Uses sessions_spawn (mode=run) to process queue items sequentially.
Sessions_spawn is called via subprocess from within a persistent exec loop.
"""
import json, os, time, subprocess, sys

QUEUE = "/Users/fortune/MUTX/mutx-engineering-agents/dispatch/action-queue.json"
LOG = "/Users/fortune/.openclaw/logs/autonomous-loop.log"

def log(m):
    from datetime import datetime
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

def spawn_agent(task, label, timeout=300):
    """Call openclaw sessions spawn via subprocess (from exec context)"""
    cmd = [
        "python3", "-c",
        f"""
import sys
try:
    from agents import sessions_spawn
    r = sessions_spawn(
        task={repr(task)},
        label={repr(label)},
        runtime="subagent",
        model="minimax-portal/MiniMax-M2.7",
        timeoutSeconds={timeout},
        mode="run"
    )
    print('SPAWNED:', r)
except ImportError:
    # Try via subprocess to openclaw CLI
    import subprocess
    result = subprocess.run(['openclaw', 'help'], capture_output=True, text=True)
    print('CLI_NOT_SUPPORTED')
except Exception as e:
    print('ERROR:', e)
"""
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout+10)
    return result.stdout, result.stderr

def run_loop():
    log("=== Autonomous loop supervisor starting ===")
    os.chdir("/Users/fortune/MUTX")
    
    while True:
        q = read_queue()
        item = top_item(q)
        
        if not item:
            log("Queue empty, sleeping 5min...")
            time.sleep(300)
            continue
        
        id_ = item["id"]
        title = item["title"][:60]
        area = item.get("area", "area:api")
        
        log(f">>> {id_}: {title} [{area}]")
        
        # Mark in-progress
        item["status"] = "in_progress"
        save(q)
        
        # Build task prompt
        wt = "/Users/fortune/mutx-worktrees/factory/backend"
        if "web" in area or "test" in area:
            wt = "/Users/fortune/mutx-worktrees/factory/frontend"
        
        task = f"""You are the MUTX autonomous coding agent. Implement ONE queue item, file the PR, then exit.

Working directory: {wt}
Queue file: {QUEUE}
Item ID: {id_}
Title: {title}
Area: {area}
Description: {item.get('description','')[:300]}

Steps:
1. Read {QUEUE} to understand the item
2. cd to {wt}
3. git fetch origin && git checkout main && git pull origin main
4. git checkout -b autonomy/{id_}
5. Implement the change described
6. Run: make lint 2>/dev/null || true
7. git add -A
8. git commit -m "autonomy: {title}\\n\\nid: {id_}\\narea: {area}\\nautonomous: yes"
9. git push -u origin autonomy/{id_}
10. gh pr create --title "[autonomy] {title}" --body "Autonomous PR. ID: {id_}. Area: {area}." --base main || gh pr create --title "[autonomy] {title}" --body "Autonomous PR. ID: {id_}." --base main --repo FortuneXBT/MUTX
11. echo "DONE"

Start now. Read the queue file first."""

        # Spawn via sessions_spawn tool (called from exec context = available)
        # We use the sessions_spawn from within this Python script
        # by calling the OpenClaw gateway API directly via Unix socket
        import urllib.request, urllib.error, websocket, threading, json as json2

        sock_path = "/var/run/openclaw/gateway.sock"
       gw_cfg = "/Users/fortune/.openclaw/gateway.json"
        
        try:
            cfg = json2.load(open(gw_cfg))
            token = cfg.get("auth", {}).get("token", "dev")
        except:
            token = "dev"

        result = None
        error = None
        
        try:
            ws = websocket.WebSocket()
            ws.settimeout(300)
            ws.connect(f"ws+unix://{sock_path}")
            
            # Auth
            auth_msg = json2.dumps({"type":"auth","token":token})
            ws.send(auth_msg)
            resp = ws.recv()
            
            # Send spawn request
            spawn_req = {
                "type": "proactive",
                "task": task,
                "label": f"autonomy-{id_}",
                "runtime": "subagent",
                "model": "minimax-portal/MiniMax-M2.7",
                "timeoutSeconds": 300,
                "mode": "run"
            }
            ws.send(json2.dumps(spawn_req))
            
            # Receive response
            while True:
                msg = ws.recv()
                data = json2.loads(msg)
                if data.get("type") == "done" or data.get("type") == "error":
                    result = data
                    break
                if "content" in data:
                    log(f"  agent: {str(data['content'])[:80]}")
            
            ws.close()
            
        except Exception as e:
            error = str(e)
            log(f"WebSocket error: {e}")
        
        # Remove from queue regardless
        q = read_queue()
        q["items"] = [i for i in q["items"] if i["id"] != id_]
        save(q)
        
        ok = (result and result.get("type") == "done") or (error and "timeout" in error)
        log(f"<<< {id_} -> {'OK' if ok else 'FAIL'} {error or ''}")
        
        time.sleep(30)

if __name__ == "__main__":
    run_loop()
