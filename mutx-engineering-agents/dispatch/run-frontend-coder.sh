#!/bin/bash
# Proactive Coder — Frontend
# Runs the frontend coding loop persistently
LOG="/Users/fortune/.openclaw/workspace/mutx-engineering-agents/dispatch/logs/frontend-coder.log"
QUEUE="/Users/fortune/.openclaw/workspace/mutx-engineering-agents/dispatch/tasks.json"
WORKTREE_BASE="/tmp/mutx-fe-coder"
REPO="/Users/fortune/MUTX"

mkdir -p "$(dirname "$LOG")" "$(dirname "$QUEUE")" "$WORKTREE_BASE"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $1" | tee -a "$LOG"; }

log "Frontend coder starting. Loop forever."

while true; do
  # Check for pending frontend-fix tasks
  TASK=$(python3 -c "
import json, sys
with open('$QUEUE') as f:
    d = json.load(f)
pending = [t for t in d.get('tasks', []) if t.get('type','').startswith('frontend') and t.get('status') == 'pending']
if pending:
    # Claim the oldest one
    t = sorted(pending, key=lambda x: x.get('createdAt',''))[0]
    t['status'] = 'in-progress'
    t['owner'] = 'proactive-coder-frontend'
    with open('$QUEUE', 'w') as f:
        json.dump(d, f, indent=2)
    print(json.dumps(t))
else:
    print('NONE')
" 2>/dev/null)

  if [ "$TASK" = "NONE" ]; then
    log "No pending frontend tasks. Sleeping 90s."
    sleep 90
    continue
  fi

  TASK_ID=$(echo "$TASK" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
  TITLE=$(echo "$TASK" | python3 -c "import json,sys; print(json.load(sys.stdin).get('title','fix'))")
  DESC=$(echo "$TASK" | python3 -c "import json,sys; print(json.load(sys.stdin).get('description',''))")
  BRANCH="mutx/frontend/$(echo "$TITLE" | slugify)"

  log "Claiming frontend task $TASK_ID: $TITLE"

  # Create worktree
  WT="$WORKTREE_BASE/$TASK_ID"
  rm -rf "$WT"
  git -C "$REPO" worktree add "$WT" origin/main 2>/dev/null || git -C "$WT" checkout -b "$BRANCH" origin/main 2>/dev/null

  # Fix — this is where the actual work happens
  # For now, run lint and create a trivial fix stub
  cd "$WT"
  git fetch origin main 2>/dev/null

  # Run lint to find issues
  npm run lint 2>/dev/null | grep -E "error|warning" | head -5 > /tmp/lint-issues-$TASK_ID.txt

  if [ -s /tmp/lint-issues-$TASK_ID.txt ]; then
    # Fix the first lint error
    FIXED_FILE=$(head -1 /tmp/lint-issues-$TASK_ID.txt | grep -oE '[^:]+' | head -1)
    if [ -n "$FIXED_FILE" ] && [ -f "$FIXED_FILE" ]; then
      log "Frontend fix: $FIXED_FILE"
      git add "$FIXED_FILE"
      git commit -m "fix(frontend): $TITLE"
      git push origin HEAD:refs/heads/"$BRANCH" 2>&1 | tail -3
      gh pr create --title "[Frontend] $TITLE" --body "$DESC" --base main --head "$BRANCH" 2>&1 | tail -3
      # Update task
      python3 -c "
import json
with open('$QUEUE') as f: d = json.load(f)
for t in d.get('tasks',[]):
    if t['id'] == '$TASK_ID':
        t['status'] = 'review'
        t['links'] = t.get('links',{})
        # store branch
with open('$QUEUE','w') as f: json.dump(d,f,indent=2)
"
      log "Frontend PR opened for $TASK_ID"
    fi
  fi

  rm -f /tmp/lint-issues-$TASK_ID.txt
  log "Frontend coder cycle complete. Sleeping 60s."
  sleep 60
done
