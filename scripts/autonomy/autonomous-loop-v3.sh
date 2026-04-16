#!/bin/bash
LOG="/Users/fortune/.openclaw/logs/autonomous-loop.log"
QUEUE="/Users/fortune/MUTX/mutx-engineering-agents/dispatch/action-queue.json"
REPO="/Users/fortune/MUTX"
WORKTREE_BACKEND="/Users/fortune/mutx-worktrees/factory/backend"
WORKTREE_FRONTEND="/Users/fortune/mutx-worktrees/factory/frontend"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

log "=== Autonomous loop v3 starting ==="

while true; do
    ITEM=$(python3 -c "
import json
try:
    q = json.load(open('$QUEUE'))
    items = [i for i in q.get('items', []) if i.get('status') == 'queued']
    items.sort(key=lambda x: {'p0':0,'p1':1,'p2':2}.get(x.get('priority','p2'), 2))
    if items: print(json.dumps(items[0]))
except: pass
" 2>/dev/null)

    if [ -z "$ITEM" ]; then
        log "Queue empty, sleeping 5min..."
        sleep 300
        continue
    fi

    ID=$(echo "$ITEM" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['id'])")
    TITLE=$(echo "$ITEM" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['title'])")
    AREA=$(echo "$ITEM" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('area','area:api'))")

    log "=== Working: $TITLE [$ID] area=$AREA ==="

    if [[ "$AREA" == *"web"* ]] || [[ "$AREA" == *"test"* ]]; then
        WT="$WORKTREE_FRONTEND"
    else
        WT="$WORKTREE_BACKEND"
    fi

    python3 -c "
import json
q = json.load(open('$QUEUE'))
for i in q['items']:
    if i['id'] == '$ID': i['status'] = 'in_progress'
with open('$QUEUE', 'w') as f: json.dump(q, f, indent=2)
" 2>/dev/null

    BRANCH="autonomy/$ID-$(date +%Y%m%d%H%M)"
    cd "$WT" && git fetch origin 2>/dev/null && git checkout main 2>/dev/null && git pull origin main 2>/dev/null && git checkout -b "$BRANCH" 2>/dev/null

    TASK="You are the MUTX autonomous coding agent.

Item ID: $ID
Title: $TITLE
Area: $AREA
Description: $(echo "$ITEM" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('description','')[:300])")

Working dir: $WT
Queue file: $QUEUE

1. Read the queue file at $QUEUE to understand this item
2. cd to $WT
3. Implement the change
4. Run: make lint 2>/dev/null || true
5. git add -A && git commit -m 'autonomy: $TITLE
id: $ID
area: $AREA
autonomous: yes'
6. git push -u origin $BRANCH
7. gh pr create --title '[autonomy] $TITLE' --body 'Autonomous PR. ID: $ID. Area: $AREA.' --base main
8. echo 'DONE'

Start now."

    RESULT=$(openclaw sessions spawn --task "$TASK" --label "autonomy-$ID" --model "minimax-portal/MiniMax-M2.7" --timeout 300 2>&1) || RESULT="spawn failed"
    log "Spawn: ${RESULT:0:120}"

    python3 -c "
import json
q = json.load(open('$QUEUE'))
q['items'] = [i for i in q['items'] if i['id'] != '$ID']
with open('$QUEUE', 'w') as f: json.dump(q, f, indent=2)
" 2>/dev/null

    log "Done: $ID, sleeping 30s..."
    sleep 30
done
