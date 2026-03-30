# Guardrails Guide

## Overview

The GitHub Issue Resolver operates inside a **5-layer guardrail system** that prevents misuse while maintaining autonomous workflow capability.

## Layer Architecture

```
┌─────────────────────────────────────────┐
│  Layer 5: Audit Trail                   │  ← Everything logged
├─────────────────────────────────────────┤
│  Layer 4: Behavioral Constraints        │  ← How it behaves
├─────────────────────────────────────────┤
│  Layer 3: Command Allowlist             │  ← What it can execute
├─────────────────────────────────────────┤
│  Layer 2: Action Gates                  │  ← Human-in-the-loop
├─────────────────────────────────────────┤
│  Layer 1: Scope Lock                    │  ← What it can touch
└─────────────────────────────────────────┘
```

## Configuration

All guardrails are configured in `guardrails.json`. Sections:

### `scope.repos` — Repository allowlist
```json
{
  "mode": "allowlist",
  "allowed": ["myorg/myrepo", "myorg/*"],
  "denied": []
}
```
- Empty `allowed` = all repos permitted (first-run friendly)
- Add repos as you go: `"allowed": ["facebook/react"]`
- Wildcards: `"myorg/*"` allows all repos in org

### `scope.branches` — Branch protection
```json
{
  "protected": ["main", "master", "production"],
  "workPrefix": "fix-issue-"
}
```
- Agent auto-creates branches like `fix-issue-42`
- Protected branches can never be checked out or pushed to

### `scope.paths` — File access control
```json
{
  "denied": [".env", "secrets/", ".github/workflows/"],
  "denyPatterns": ["**/credentials*", "**/.env*"]
}
```
- Blocks read AND write to sensitive paths
- Glob patterns for flexible matching

### `gates` — Action approval levels
Three levels:
- `auto` — Proceeds without notice (safe actions like reading)
- `notify` — Tells user, proceeds unless stopped
- `approve` — **Stops and waits for explicit "yes"**

### `commands` — Execution allowlist
- Only commands in `allowed` list can run
- `blocked` list is checked first (deny wins)
- `blockPatterns` for regex matching dangerous patterns

### `behavior` — Behavioral rules
| Rule | Default | Effect |
|------|---------|--------|
| `oneIssueAtATime` | true | Must finish/abandon before starting new |
| `maxDiffLines` | 200 | Pause if changes exceed limit |
| `timeoutMinutes` | 15 | Auto-abort stuck operations |
| `draftPRByDefault` | true | Always open as draft PR |
| `noForceEver` | true | `--force` push permanently blocked |
| `noSelfModify` | true | Cannot edit its own skill/plugin files |
| `autoRollbackOnTestFail` | true | Revert changes if tests fail |

## Scripts

### guardrails.py — Enforcement engine
```bash
# Check if repo is allowed
python3 guardrails.py repo facebook react

# Check if branch is safe
python3 guardrails.py branch main

# Check if command is allowed
python3 guardrails.py command "git push --force"

# Check file path
python3 guardrails.py path ".env.production"

# Full validation
python3 guardrails.py validate write_code owner=facebook repo=react path=src/App.tsx
```

### sandbox.py — Safe execution wrapper
```bash
# Run a command through sandbox
python3 sandbox.py run git status

# Run with approval (user confirmed)
python3 sandbox.py run_approved git push origin fix-issue-42

# Check if file is safe
python3 sandbox.py check_file .env.local

# Get status
python3 sandbox.py status
```

### audit.py — Action logger
```bash
# Log an action
python3 audit.py log_action "clone_repo" "success"

# Log a decision
python3 audit.py log_decision "Chose issue #42" "Highest score, clear repro steps"

# Get session summary
python3 audit.py summary

# Generate decisions markdown
python3 audit.py decisions_md 42
```

## Audit Log Structure

```
audit/
├── 2026-03-01/
│   ├── session-010500.json     ← Full action log
│   ├── diffs/
│   │   ├── issue-42-src_App.tsx.patch
│   │   └── issue-42-tests_App.test.tsx.patch
│   └── decisions.md            ← Human-readable decisions
```

## Customizing Guardrails

Edit `guardrails.json` to:
- Add repos to allowlist
- Change gate levels (make things more/less restrictive)
- Add commands to allowlist
- Adjust diff size limits
- Enable/disable dry-run mode

**Note:** The agent cannot modify `guardrails.json` itself (`noSelfModify: true`).
