# TODAY.md — Project Shepherd

**Refreshed: 2026-04-01 08:15 Europe/Rome**

## Current operating truth
- **PR #1230: CI GREEN, still CONFLICTING.** All CI checks passed re-run at 06:34 UTC. Merge conflicts unresolved — `sdk/mutx/__init__.py` and/or workflow files. **No change in 2 hours.**
- **`main` branch CI: SUCCESS** — confirmed at 07:20 UTC today.
- **Infrastructure Drift Detection: FAILED** at 06:58 UTC — may indicate config drift; separate from PR queue.
- **PR #1219: 36 hours stuck.** `pygments` bump, CI GREEN, mergeable, no second GitHub reviewer. `qa-reliability-engineer` cannot act as GitHub identity.
- **Issue #1187: 10 days old with no owner.**
- **SSH and gateway hardening: 50+ hours on Fortune's desk.**
- **Microsoft Agent 365: 29 days to GA** ($15/$99 pricing).

## Top 3 cross-lane priorities

| # | Priority | Owner | Blocked by |
|---|----------|-------|------------|
| 1 | **PR #1230: resolve merge conflicts** | `cli-sdk-contract-keeper` / Fortune | Conflicts block merge; CI is green |
| 2 | **PR #1219 second reviewer** | Fortune | needs GitHub user identity — 36h stuck |
| 3 | **Route or close issue #1187** | Fortune + project-shepherd | 10 days old, no owner |

## Decision deck for Fortune
1. **Resolve PR #1230 merge conflicts** — conflicts on `sdk/mutx/__init__.py` + workflow files. Once resolved, #1219 and #1229 unblock.
2. **Assign second GitHub reviewer to PR #1219** — `qa-reliability-engineer` cannot review.
3. **SSH `accept-new` call** — closes `provision.yml:10` and `inventory.ini:13` (50h overdue).
4. **Investigate Infrastructure Drift Detection failure** at 06:58 UTC.
5. **Route or close issue #1187** — 10 days stale.
6. **Name next bounded dispatch** — `/dashboard` truth strip with Saviynt/ambient authority framing.

## Blockers / stale / unowned
- **PR #1230**: merge conflicts blocking — no movement in 2h
- **PR #1219**: second reviewer missing — 36h stuck
- **Issue #1187**: 10 days, no owner
- **SSH/gateway**: 50h on Fortune's desk
- **Infrastructure Drift**: failed 06:58 UTC — may be config drift
- **social-media-strategist**: needs screenshots from `/dashboard`
- **9/10 engineering lanes**: idle, no dispatch named
