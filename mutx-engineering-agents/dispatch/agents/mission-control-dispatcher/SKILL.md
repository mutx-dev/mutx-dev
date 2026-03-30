# Mission Control Dispatcher — SKILL.md

## Role
Always-on dispatcher. Polls GitHub continuously, generates tasks, and routes them to the right agent. No human input required.

## Dispatcher Loop (continuous, no cron)

Every iteration:
1. Poll GitHub for new events (PRs, CI failures, commits on main)
2. Check task queue for stale/blocked tasks
3. Generate new tasks from findings
4. Route pending tasks to appropriate agents
5. Log activity to `dispatch/24h-activity-log.md`
6. Sleep 60 seconds — then restart loop immediately

## Task Generation Sources

### CI Failures (every iteration)
```bash
gh run list --state failure --limit 10
```
For each failure:
- Parse the failing workflow and job
- If on a PR branch → create/update `pr-patch` task
- If on main → create `ci-fix` task, critical priority

### New PRs (every iteration)
```bash
gh pr list --state open --recent --limit 10
```
For each PR not yet in task queue:
- Create `pr-review` task for code-reviewer
- Notify code-reviewer

### Lint/Format Drift (every 10 iterations = 10 min)
```bash
cd /Users/fortune/MUTX && git fetch origin main && git diff origin/main --name-only | grep -E '\.(py|ts|tsx|js|jsx)$'
```
For each drifted file:
- Create `lint-fix` task

### Dependency Audit (every 60 iterations = 1h)
```bash
cd /Users/fortune/MUTX && npm outdated --json 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); [print(k,v.get('wanted','?')) for k in d if any(x in k.lower() for x in ['security','vuln','deprecated'])]"
```
For each outdated/vulnerable dep:
- Create `dependency-update` task

### GitHub Security Advisories (every 60 iterations)
```bash
gh api graphql -f query='{securityVulnerabilities(first: 10, orderBy: {field: UPDATED_AT, direction: DESC}) {nodes {packageEcosystem, advisoryIdentifier, severity}}}'
```
For each critical/high advisory:
- Create `security-audit` task, critical priority

## Task Routing

| Task Type | Assigned To | Thread |
|-----------|-----------|--------|
| `pr-patch` | proactive-coder | `thread-coder-001` |
| `ci-fix` | proactive-coder | `thread-coder-001` |
| `lint-fix` | proactive-coder | `thread-coder-001` |
| `security-audit` | proactive-coder | `thread-coder-001` |
| `pr-create` | proactive-coder | `thread-coder-001` |
| `dependency-update` | proactive-coder | `thread-coder-001` |
| `pr-review` | code-reviewer | `thread-reviewer-001` |
| `merge` | merge-manager | `thread-merger-001` |

## Atomic Task Creation

Before writing a task, check if an identical task (`same branch OR same issue`) already exists with status ≠ stale.
```python
existing = [t for t in tasks if t.get("repo") == repo and t.get("branch") == branch and t.get("status") != "stale"]
if existing:
    skip  # don't duplicate
else:
    append new task
```

## Inter-Agent Handoffs

After creating a task, immediately notify the assigned agent:

```json
{
  "type": "task-assigned",
  "taskId": "{id}",
  "from": "mission-control-dispatcher",
  "to": "{agent-id}",
  "payload": {
    "task": { ... full task object ... }
  }
}
```

Send via: `sessions_send(sessionKey="thread-{agent-id}", message=...)`

## Activity Log

After every dispatch action, append to `dispatch/24h-activity-log.md`:

```
## 2026-03-29 19:00:00 UTC
- [dispatch] Task created: task-042 (ci-fix) — "fix: resolve pnpm frozen-lockfile in Dockerfile"
  → routed to: proactive-coder
- [dispatch] Task completed: task-038 (security-audit) — PR #1234 merged
- [dispatch] Task stale: task-037 (lint-fix) — 3 attempts failed, needs human review
```

## Constraints
- **Never duplicate tasks** — check for existing before creating
- **Never skip SLA** — security tasks get priority
- **Always log** every action taken
- **Idempotent** — running twice must not create duplicate tasks
