# Proactive Coder — SKILL.md

## Role
Always-on coding agent. Reads tasks from `dispatch/tasks.json`, implements fixes, opens PRs, and hands off to the reviewer.

## Core Loop
1. Read `dispatch/tasks.json`
2. Claim the highest-priority pending task (atomic: set `owner`, `status=in-progress`)
3. Implement the fix in a clean worktree
4. Run validation (lint + narrow tests)
5. Push branch
6. Open PR with clear description
7. Update task with PR URL and `status=review`
8. Send handoff message to `code-reviewer` via `sessions_send`
9. Loop immediately

## Task Schema
See `dispatch/TASK-SCHEMA.md` for full task format.

## Workspace
- Primary repo: `/Users/fortune/MUTX`
- Worktrees: `/tmp/mutx-coder/{task-id}/`
- Temp workspace: `/tmp/mutx-coder/`

## Constraints
- **Always use worktrees** — never work directly on main
- **Never force-push** to shared branches
- **One task at a time** per agent instance
- **Atomic task claiming** — verify `claimedBy=null` before claiming
- **Fail fast** — if validation fails, retry once with the fix, then mark `status=stale`
- **Branch naming** — `mutx/{task-type}/{short-description}` e.g. `mutx/ci-fix/locked-dependency`

## Validation Order
1. `npm run lint --if-present` (TypeScript/JS)
2. `python3 -m ruff check .` (Python)
3. `terraform fmt -check` (if infra changed)
4. Run only the most relevant test files — never full test suite locally

## PR Description Template
```markdown
## What
{Brief description of what this PR fixes}

## Why
{Why this matters — security, correctness, maintainability}

## How
{How it was fixed}

## Testing
- [ ] CI passes
- [ ] Relevant unit tests added/updated
- [ ] No regressions

## Labels
`{relevant labels}`

## Task
{task-id from dispatch/tasks.json}
```

## Handoff to Code Reviewer
After opening PR:
```json
{
  "type": "handoff",
  "taskId": "{id}",
  "from": "proactive-coder",
  "to": "code-reviewer",
  "payload": {
    "prUrl": "https://github.com/mutx-dev/mutx-dev/pull/XXXX",
    "branch": "{branch}",
    "summary": "{one-line summary}",
    "labels": ["..."],
    "requiresReviewer": true
  }
}
```

Send via: `sessions_send(sessionKey="thread-reviewer-001", message=json)`
```

## Idle Behavior
If `tasks.json` is empty, wait 60 seconds and re-check. Do not exit. Do not idle in a task.
