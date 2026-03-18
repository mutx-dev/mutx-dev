#!/bin/bash
# parallel-agent-launcher.sh - Spawns Codex agents on multiple issues in parallel

set -e

MAX_AGENTS="${1:-5}"
WORKTREE_BASE="$HOME/mutx-worktrees/factory"
REPO="fortunexbt/mutx-dev"

# Ensure worktrees directory exists
mkdir -p "$WORKTREE_BASE"

# Get list of autonomy:ready issues (top N) - exclude already in progress
existing_branches=$(cd ~/MUTX && git branch --list 'codex/issue-*' --format '%(refname:short)' | sed 's/codex\/issue-//' | tr '\n' ',')

issues=$(gh issue list --state open --repo "$REPO" --json number,title,labels --jq "[.[] | select(.labels[]?.name == \"autonomy:ready\") | select(($existing_branches | split(\",\")) | .[\"\\( .number )\"] | not)] | .[0:$MAX_AGENTS] | .[] | \"\( .number ) \( .title )\"" 2>/dev/null)

# Fallback: get any open issues if none with autonomy:ready
if [ -z "$issues" ]; then
    issues=$(gh issue list --state open --repo "$REPO" --json number,title --jq ".[] | \"\( .number ) \( .title )\"" | head -"$MAX_AGENTS")
fi

echo "🚀 Spawning agents for issues:"
echo "$issues"
echo ""

# Track spawned agents
agent_count=0

while IFS= read -r line; do
    [ -z "$line" ] && continue
    
    issue_num=$(echo "$line" | cut -d' ' -f1)
    issue_title=$(echo "$line" | cut -d' ' -f2-)
    
    # Create branch name
    branch="codex/issue-$issue_num-$(echo "$issue_title" | tr ' ' '-' | tr -cd 'a-z0-9-' | cut -c1-40)"
    
    # Create worktree
    worktree_path="$WORKTREE_BASE/issue-$issue_num"
    
    if [ -d "$worktree_path" ]; then
        echo "⚠️  Worktree already exists for issue #$issue_num, skipping"
        continue
    fi
    
    # Check if branch exists
    if cd ~/MUTX && git rev-parse --verify "$branch" >/dev/null 2>&1; then
        echo "⚠️  Branch already exists for issue #$issue_num, skipping"
        continue
    fi
    
    echo "📦 Creating worktree: $worktree_path"
    cd ~/MUTX
    git worktree add "$worktree_path" -b "$branch" 2>/dev/null
    
    # Spawn Codex agent in background
    echo "🤖 Spawning Codex agent for issue #$issue_num..."
    
    # Use sessions_spawn via curl to call the OpenClaw API
    curl -s -X POST "http://localhost:49300/api/sessions/spawn" \
        -H "Content-Type: application/json" \
        -d "{
            \"agentId\": \"codex\",
            \"mode\": \"run\",
            \"runTimeoutSeconds\": 300,
            \"cleanup\": \"keep\",
            \"task\": \"You are an autonomous coding agent. Your task is to:
1. Read the issue at https://github.com/$REPO/issues/$issue_num
2. Understand what needs to be built: $issue_title
3. Write the code to implement the feature/fix in $worktree_path
4. Commit your changes with a descriptive message
5. Push: git push -u origin
6. Create a PR with title: \\\"$issue_title\\\"

Do not ask for confirmation. Just do the work.\"
        }" > "/tmp/spawn-issue-$issue_num.json" 2>&1 &
    
    agent_count=$((agent_count + 1))
    echo "✅ Agent spawned for issue #$issue_num"
    
done <<< "$issues"

echo ""
echo "🎉 Spawned $agent_count agents in parallel"
