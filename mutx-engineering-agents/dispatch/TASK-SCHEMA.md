# Task Schema — 24/7 Engineering Dispatch

## Task Queue (`dispatch/tasks.json`)

All engineering tasks flow through this file. Agents read it, claim tasks atomically, and report completion.

```json
{
  "tasks": [
    {
      "id": "task-001",
      "type": "pr-create | pr-patch | ci-fix | lint-fix | security-audit | dependency-update",
      "priority": "critical | high | medium | low",
      "status": "pending | in-progress | review | blocked | done | stale",
      "createdAt": "2026-03-29T00:00:00Z",
      "updatedAt": "2026-03-29T00:00:00Z",
      "owner": null,
      "claimedBy": null,
      "branch": "feat/issue-123-fix",
      "title": "fix: resolve CSRF vulnerability in refresh endpoint",
      "description": "The refresh endpoint does not validate refresh_token binding. Found via code review.",
      "repo": "mutx-dev/mutx-dev",
      "assignee": "proactive-coder",
      "handoffs": [
        { "to": "code-reviewer", "when": "status=review" },
        { "to": "merge-manager", "when": "status=approved" }
      ],
      "links": {
        "pr": null,
        "ci": null,
        "issue": "issue-123"
      },
      "tags": ["security", "auth", "critical"],
      "error": null,
      "attempts": 0,
      "maxAttempts": 3
    }
  ],
  "version": 1
}
```

## Task Types

| Type | Description | Priority | SLA |
|------|-------------|----------|-----|
| `security-audit` | Vulnerability or hardening fix | critical | 1h |
| `ci-fix` | CI/CD pipeline fix | critical | 2h |
| `lint-fix` | Lint/format drift | high | 4h |
| `pr-patch` | Fix failing CI on existing PR | high | 2h |
| `pr-create` | Create new PR from scratch | medium | 24h |
| `dependency-update` | Update outdated dependency | low | 48h |
| `schema-fix` | API/schema drift fix | high | 4h |

## Status Transitions

```
pending → in-progress (coder claims)
in-progress → review (coder opens PR, all checks green)
in-progress → stale (3 attempts failed)
in-progress → blocked (needs human decision)
review → approved (reviewer approves)
review → changes-requested (reviewer asks for fixes → in-progress)
approved → done (merge-manager merges)
```

## Routing Rules

1. **New task** → `proactive-coder` claims it
2. **PR opened** → `code-reviewer` notified via ACP thread message
3. **Review approved** → `merge-manager` claims for merge
4. **Review changes-requested** → `proactive-coder` re-claims
5. **Stale task** → `mission-control-dispatcher` re-evaluates or closes

## ACP Thread Lanes

Each agent has a persistent ACP thread. Thread IDs are stored in `dispatch/threads.json`.

```json
{
  "threads": {
    "dispatcher": "thread-dispatcher-001",
    "proactive-coder": "thread-coder-001",
    "code-reviewer": "thread-reviewer-001",
    "merge-manager": "thread-merger-001",
    "human-escalation": "thread-human-001"
  }
}
```

## Inter-Agent Messages (sessions_send)

All agent-to-agent handoffs use `sessions_send` to the target thread.

```json
{
  "type": "handoff",
  "taskId": "task-001",
  "from": "proactive-coder",
  "to": "code-reviewer",
  "payload": {
    "prUrl": "https://github.com/mutx-dev/mutx-dev/pull/1234",
    "branch": "feat/issue-123-fix",
    "summary": "Fixed CSRF in refresh endpoint by binding token to refresh cookie",
    "labels": ["security", "auth"],
    "requiresReviewer": true
  }
}
```

## Task Generation Triggers

Tasks are created by the dispatcher from these sources (priority order):

1. **GitHub webhook** (highest priority) — PR created, CI failed, review requested
2. **CI poll** (every 5 min) — failing checks on main or PRs
3. **Lint drift check** (every 15 min) — format/lint drift from main
4. **Dependency audit** (every 24h) — outdated or vulnerable deps
5. **Human request** — via Discord thread or direct message
6. **Agent self-report** — agent finds an issue during work
