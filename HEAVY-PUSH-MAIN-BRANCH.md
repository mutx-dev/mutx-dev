# MUTX HEAVY PUSH — MAIN BRANCH BLITZ

**Status:** 2026-03-18 19:32 UTC  
**Mission:** Get mutx-dev main branch current with all shippable PRs  
**Model:** MiniMax-M2.7  
**Codex Limits:** ~4 hours until lift  

---

## SITUATION ANALYSIS

**Current State:**
- 113 remote branches
- 100+ worktrees (many stale)
- PR #1154 is UI porting (in progress)
- Many PRs have "merge-ready" label but blocked by conflicts
- Main branch is falling behind

**Bottlenecks:**
1. 20+ PRs with merge conflicts
2. 5 PRs waiting on CI
3. Stale branches never cleaned up
4. Too many open PRs, nothing getting merged

**Root Cause:** Previous fleet spawned workers that created PRs but never resolved conflicts or merged.

---

## STRATEGY: DIRECT SHIP

### Rule 1: Direct Push for Internal Work

If you have a fix that's isolated (doesn't touch shared code):
```bash
git checkout main
git pull origin main
git checkout -b fix/{issue}
# Make changes
git push origin HEAD:main  # Direct to main, no PR
```

**When to use:**
- Bug fixes in isolated files
- Adding new components
- Test improvements
- Documentation
- UI component ports

**When NOT to use:**
- Changes to shared code (auth, core models, API contracts)
- Changes that need review
- Breaking changes

### Rule 2: Mass Conflict Resolution

For PRs with conflicts:
```bash
# Check which PRs have conflicts
gh pr list --state=open --label=merge-ready

# For each conflict:
git fetch origin pull/{PR}/head:pr-{PR}
git checkout pr-{PR}
git rebase origin/main
# Resolve conflicts
git push origin HEAD:main  # Direct ship if clean
git close PR
```

### Rule 3: CI-Gated Merge

For PRs waiting on CI:
```bash
# Check CI status
gh pr view {PR} --json=status

# If all checks pass + no conflicts = MERGE NOW
gh pr merge {PR} --squash --delete-branch
```

---

## IMMEDIATE ACTIONS (Next 2 Hours)

### 1. Check All Open PRs

```bash
gh pr list --state=open --limit 100
```

Categorize:
- **READY TO SHIP:** CI green + no conflicts → MERGE
- **CONFLICTS:** Has conflicts → REBASE + SHIP
- **BLOCKED:** CI failing or needs review → SKIP FOR NOW

### 2. Mass Merge Ready PRs

Priority order:
1. UI component PRs (clean, isolated)
2. Test additions
3. Bug fixes
4. Feature additions

```bash
# Quick merge script
for pr in $(gh pr list --state=open --json=number --jq='.[].number'); do
  status=$(gh pr view $pr --json=statuses --jq '.statuses[].state')
  conflicts=$(gh pr view $pr --json=hasConflict --jq '.hasConflict')
  if [ "$status" == "SUCCESS" ] && [ "$conflicts" == "false" ]; then
    gh pr merge $pr --squash --delete-branch
    echo "Merged #$pr"
  fi
done
```

### 3. Resolve Conflicts on Merge-Ready PRs

For PRs with "merge-ready" label but conflicts:

```bash
# Batch rebase and merge
gh pr list --state=open --label=merge-ready --json=number | jq -r '.[].number' | while read pr; do
  echo "Processing #$pr"
  git fetch origin pull/$pr/head:pr-$pr 2>/dev/null
  git checkout pr-$pr
  git rebase origin/main
  if [ $? -eq 0 ]; then
    git push origin HEAD:main && gh pr close $pr --delete-branch
    echo "Shipped #$pr"
  else
    echo "Conflicts in #$pr - needs manual fix"
  fi
done
```

### 4. Force Push UI Porting

PR #1154 is behind main. Fast-forward it:

```bash
cd ~/mutx-worktrees/factory/ship
git fetch origin
git rebase origin/main
git push origin HEAD:main --force-with-lease
```

---

## CLEANUP: Delete Stale Branches

### Identify Stale Worktrees

```bash
git worktree list
# Check which branches are merged
git branch --merged main | grep -v main | head -50
```

### Remove Stale Worktrees + Branches

```bash
# For each merged branch:
gitbranch -d codex/issue-{N}
git worktree remove ~/mutx-worktrees/factory/issue-{N}
git push origin --delete codex/issue-{N}
```

### Batch Cleanup

```bash
# Find and delete merged branches
for branch in $(git branch --merged main | grep -E 'codex/|fix/|feature/' | head -30); do
  git branch -d $branch
  git push origin --delete $branch
  echo "Deleted $branch"
done
```

---

## WORKER SETUP (After Codex Lifts)

When Codex limits lift (~4hrs), add parallel workers:

### mutx-healer (Every 5 min)
```
1. Fetch open PRs with conflicts
2. For each: rebase on main
3. If clean: direct push + close PR
4. If dirty: log blocker, skip
```

### mutx-merger (Every 2 min)
```
1. Fetch PRs with CI green + no conflicts
2. Merge immediately
3. Update state
```

### mutx-cleaner (Every 1 hour)
```
1. List merged branches
2. Delete local + remote
3. Remove worktrees for deleted branches
```

---

## STATE FILES

| File | Update After |
|------|--------------|
| `mutx-fleet-state.md` | Every 10 merges |
| `autonomy-queue.json` | When queue changes |
| `CLEANUP-LOG.md` | Each cleanup action |

---

## RATE LIMIT RULES

**GitHub API:**
- Log → wait 5min → retry once → skip PR
- Don't spam `gh` commands — batch where possible

**MiniMax:**
- Use for conflict resolution, code generation
- If rate limited: log → wait 2min → retry once

---

## WHAT NOT TO DO

- DON'T merge broken code (CI red = skip)
- DON'T force push unless behind main
- DON'T delete branches that aren't merged
- DON'T create new PRs — direct push internal work
- DON'T spawn 50 workers (we tried, it failed)

---

## THE PUSH

Go. Check the PRs. Ship what's ready. Resolve conflicts. Cleanup stale branches. Push to main.

You have:
- MiniMax M2.7 for code
- Direct push access
- State file discipline
- Clear priorities

Ship it.

---

## SUCCESS METRICS (Next 2 Hours)

- [ ] 10+ PRs merged to main
- [ ] 20+ stale branches cleaned up
- [ ] 10+ stale worktrees removed
- [ ] UI porting PR rebased and current
- [ ] mutx-healer + mutx-merger cron workers created

---

_2026-03-18 19:32 UTC_  
_Directive: MAX VELOCITY TO MAIN_
