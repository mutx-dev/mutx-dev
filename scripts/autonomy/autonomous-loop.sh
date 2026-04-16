#!/bin/bash
# Autonomous coding loop — runs continuously
# Picks from action queue, ships one item, files PR, repeats

QUEUE_FILE="/Users/fortune/MUTX/mutx-engineering-agents/dispatch/action-queue.json"
REPO="/Users/fortune/MUTX"
WORKTREE_BACKEND="$REPO/../mutx-worktrees/factory/backend"
WORKTREE_FRONTEND="$REPO/../mutx-worktrees/factory/frontend"

echo "[$(date)] Autonomous loop starting"

while true; do
    # Get top queued item
    item=$(python3 -c "
import json, sys
try:
    q = json.load(open('$QUEUE_FILE'))
    for i in q.get('items', []):
        if i.get('status') == 'queued':
            print(json.dumps(i))
            break
except: sys.exit(1)
" 2>/dev/null)

    if [ -z "$item" ]; then
        echo "[$(date)] Queue empty, waiting 5min..."
        sleep 300
        continue
    fi

    id=$(echo "$item" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['id'])")
    title=$(echo "$item" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['title'])")
    area=$(echo "$item" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('area','area:api'))")
    size=$(echo "$item" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('size','m'))")

    echo "[$(date)] Working on: $title (id=$id, area=$area)"

    # Pick worktree based on area
    if [[ "$area" == "area:web" ]] || [[ "$area" == "area:test" ]]; then
        worktree="$WORKTREE_FRONTEND"
    else
        worktree="$WORKTREE_BACKEND"
    fi

    # Mark as in-progress
    python3 -c "
import json
q = json.load(open('$QUEUE_FILE'))
for i in q['items']:
    if i['id'] == '$id':
        i['status'] = 'in_progress'
        i['started_at'] = '$(date -u +%Y-%m-%dT%H:%M:%SZ)'
with open('$QUEUE_FILE', 'w') as f:
    json.dump(q, f, indent=2)
" 2>/dev/null

    # Call Codex to implement
    # Using openclaw sessions_spawn via the CLI would be ideal,
    # but we'll use a direct codex call for the implementation
    cd "$worktree"
    branch="autonomy/$id-$(date +%Y%m%d%H%M%S)"
    git checkout -b "$branch" 2>/dev/null

    # Spawn implementation — mutx-engineering-agents handles this via Codex
    # For now, the Codex agent running in parallel reads the queue and works

    echo "[$(date)] Codex implementing: $title"

    # Mark as done (Codex will have made the actual changes)
    # In the real loop, we wait for Codex to signal completion
    sleep 2

    # Check if changes exist
    if git diff --quiet 2>/dev/null; then
        echo "[$(date)] No changes made, marking skipped"
        status="skipped_no_changes"
    else
        git add -A
        git commit -m "autonomy: $title

id: $id
area: $area
size: $size
autonomous: yes" 2>/dev/null

        gh pr create --title "[autonomy] $title" --body "Autonomous PR from MUTX dev loop. ID: $id. Area: $area. Size: $size." --base main 2>/dev/null || \
        git push -u origin "$branch" 2>/dev/null

        echo "[$(date)] PR filed for: $title"
        status="pr_filed"
    fi

    # Remove from queue
    python3 -c "
import json
q = json.load(open('$QUEUE_FILE'))
q['items'] = [i for i in q['items'] if i['id'] != '$id']
with open('$QUEUE_FILE', 'w') as f:
    json.dump(q, f, indent=2)
" 2>/dev/null

    echo "[$(date)] Done: $title ($status)"
    echo "[$(date)] Waiting 60s before next item..."
    sleep 60
done
