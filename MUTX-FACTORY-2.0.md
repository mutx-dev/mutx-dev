# MUTX FACTORY 2.0 - Streamlined Architecture

## Current State Analysis

### Problems Identified
1. **Race conditions**: Backend + frontend workers pick same issues, duplicate work
2. **No validation before push**: Agents push code without running tests → CI fails → waste
3. **Verbose prompts**: Cron messages are 50+ lines each, hard to follow
4. **No single source of truth**: Multiple crons doing overlapping work
5. **Stale branches**: Old branches accumulate → branch bloat

### What's Working
- Branch cleanup now automated
- CodeQL fixed (JS/Python only)
- Validation added to worker prompts
- GitHub repo is clean (5 branches)

---

## NEW ARCHITECTURE

### Core Principle: ONE WORKER PER ISSUE
- First worker to claim an issue owns it until PR or explicit abandon
- No duplicate work, no races

### Simplified Cron Topology (6 crons)

| Cron | Cadence | Job | Rule |
|------|---------|-----|------|
| `mutx-ship-worker` | */5 | Merge green PRs, rebase red | Always running |
| `mutx-backend-worker` | */5 | Pick 1 issue from queue, push PR | Run validation FIRST |
| `mutx-frontend-worker` | */5 | Pick 1 issue from queue, push PR | Run validation FIRST |
| `mutx-cleanup` | 0 */2 | Close stale PRs, prune branches | Every 2h |
| `mutx-progress-dm` | 0 */2 | DM status to Fortune | Every 2h |
| `mutx-roadmap-creator` | 0 6 * * 1 | Convert ROADMAP.md "Now" → issues | Weekly (Mon) |

### Validation Mandate (NON-NEGOTIABLE)

**Before ANY push:**
```bash
# Backend
cd /Users/fortune/MUTX && ruff format . && ruff check --fix . && bash scripts/test.sh

# Frontend  
cd /Users/fortune/MUTX && npm run lint && npm run build
```

**If validation fails → FIX FIRST → THEN PUSH**

### Issue Ownership Protocol

1. Worker checks `gh issue list --state open --limit 10`
2. Worker CLAIMS issue: comment `@mutx-worker taking` on issue
3. Other workers skip claimed issues
4. Worker pushes PR, references issue
5. On merge, issue auto-closes

### Worktree Policy

Keep ONLY:
- `/Users/fortune/MUTX` (main)
- `/Users/fortune/mutx-worktrees/factory/backend`
- `/Users/fortune/mutx-worktrees/factory/frontend`
- `/Users/fortune/mutx-worktrees/factory/ship`

Delete anything else. Run factory doctor if stuck.

### Anti-Mistake Rules

1. **One file per subagent** - Don't let subagents touch multiple files
2. **Validation before push** - Not optional
3. **Small PRs** - Max 200 lines per PR, prefer smaller
4. **Test the happy path** - At minimum run the relevant test file
5. **No force pushes to PR branches** - Rebase locally, push clean

### Model Selection

- **Ship/merge**: `minimax-portal/MiniMax-M2.5` (fast, reliable)
- **Backend/Frontend**: `minimax-portal/MiniMax-M2.5` (not Codex Spark, more accurate)

### Metrics to Track

- PRs merged per day
- Time from issue → PR
- CI failure rate (target: <5%)
- Stale branch count (target: 0)

---

## Implementation Plan

1. Kill all crons except the 5 core ones
2. Simplify prompts to <10 lines each
3. Add `@mutx-worker taking` claim protocol
4. Add factory doctor cron every 4h as safety net
5. Track metrics in memory/ folder
