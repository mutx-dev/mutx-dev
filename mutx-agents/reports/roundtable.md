# MUTX Roundtable

**Updated: 2026-04-01 08:15 Europe/Rome**
**Owner: project-shepherd**

---

## Decisions
- **PR #1230: CI GREEN, still CONFLICTING.** All checks passed re-run at 06:34 UTC. Merge conflicts unresolved. **No change in 2 hours.**
- **PR #1219: STILL stuck — 36+ hours.** `pygments` bump, CI GREEN, mergeable. Second GitHub reviewer unassigned. `qa-reliability-engineer` cannot act as GitHub identity. **No change in 2 hours.**
- **SSH and gateway hardening: STILL ON FORTUNE'S DESK — 50+ hours.** `provision.yml:10` and `inventory.ini:13` remain open.
- **Issue #1187: 10 days old, unowned.** No owner, no label.
- **Infrastructure Drift Detection: FAILED** at 06:58 UTC on `main` branch. New signal — may indicate config drift.
- **Engineering fleet: PARTIALLY ACTIVE (1/10).** PR #1230 from `cli-sdk-contract-keeper` is the only active lane. No new dispatches in 2 hours.

---

## Top 3 cross-lane priorities

| # | Priority | Owner | Action needed |
|---|----------|-------|---------------|
| 1 | **PR #1230: resolve merge conflicts** | `cli-sdk-contract-keeper` / Fortune | All CI green — conflicts on `sdk/mutx/__init__.py` and/or workflow files block merge |
| 2 | **PR #1219 second reviewer** | Fortune | Assign a GitHub user identity. `qa-reliability-engineer` cannot review. 36h stuck. |
| 3 | **Resolve or close issue #1187** | Fortune / project-shepherd | 10 days old — dispatch if valid, close if stale |

---

## Blockers
- **PR #1230 merge conflicts** — CI GREEN, CONFLICTING. Conflicts block merge. No movement in 2 hours.
- **PR #1219 second reviewer** — `qa-reliability-engineer` cannot act as GitHub reviewer. **36+ hours stuck.** Human required.
- **Issue #1187** — 10 days old, no assignment, no label.
- **SSH gap** (`provision.yml:10` = `0.0.0.0/0`, `inventory.ini:13` = `StrictHostKeyChecking=no`) — awaiting Fortune's `accept-new` call (50+ hours).
- **Gateway hardening** — patch on Fortune's desk for 50+ hours.
- **Microsoft Agent 365: 29 days to GA** — $15/$99 pricing.
- **social-media-strategist** — needs screenshots from `/dashboard/security`, `/dashboard/monitoring`, `/dashboard/budgets`.

---

## Handoffs
- **Fortune**: two decisions — (1) resolve PR #1230 conflicts or delegate, (2) assign second reviewer on PR #1219, (3) SSH `accept-new` call (50h overdue).
- **cli-sdk-contract-keeper**: PR #1230 conflicts need resolution. CI is green — bounded fix is ready pending conflict resolution.
- **project-shepherd**: flag #1187 for routing or closure.
- **product-manager**: `/dashboard` truth strip with Saviynt/ambient authority framing. Microsoft 30-day clock is the forcing function.
- **social-media-strategist**: screenshot assets from `/dashboard` surfaces.

---

## Fleet utility verdicts
- **Strongest lanes:** GTM signal / outside-in (Saviynt P0 incumbent + ambient authority + 29-day Microsoft clock), GTM outbound/sales/account (signal absorbed; briefs current).
- **Thin but honest lanes:** `cli-sdk-contract-keeper` (CI green, conflict-bocked — honest about the gap), workflow-architect, developer-advocate (idle, awaiting dispatch).
- **Idle / blocked lanes:** X distribution (manual-only, unchanged), 9/10 engineering lanes (IDLE), PR #1219 (36h stuck), PR #1229 (blocked by lint), social-media-strategist (needs screenshots), issue #1187 (10 days, stale).

---

## Keep / downshift / rewire / cut calls
- **Keep:** GTM signal lane — 29-day Microsoft clock is the forcing function; Saviynt P0 + ambient authority positioning is sharp.
- **Keep:** `cli-sdk-contract-keeper` dispatch — CI green, conflicts are the only remaining blocker.
- **Keep:** product `/dashboard` truth strip — bounded, shippable, embed Saviynt/ambient authority before May 1.
- **Downshift:** 9/10 engineering specialist lanes — idle is correct until Fortune names the next dispatch.
- **Rewire:** infrastructure-maintainer — gateway patch 50h on Fortune's desk; also investigate Infrastructure Drift Detection failure at 06:58 UTC.
- **Cut:** idle dispatcher loop on dormant lanes.
- **Cut:** reviewer-resolution framing for queue congestion — PR #1219 is the only gap and it's a reviewer-identity issue.

---

## Exact evidence
- `mission-control-orchestrator/reports/latest.md` @ 2026-04-01 06:46 UTC: PR #1230 CI GREEN (re-run 06:34), CONFLICTING; PR #1219 still 34h stalled.
- Live `gh pr list --state open` @ 2026-04-01 08:10 UTC: #1230 (CONFLICTING, CI GREEN), #1229 (CI RED), #1219 (CI GREEN, no reviewer).
- Live `gh run list --limit 6`: `main` CI SUCCESS at 07:20 UTC; Infrastructure Drift Detection FAILED at 06:58 UTC.
- `signal-brief.md` @ 2026-03-31 18:20 Europe/Rome: Saviynt P0, Microsoft 29-day clock, ambient authority.

---

## What changed in truth
- **No material change in 2 hours.** PR #1230 still CONFLICTING, PR #1219 still stuck, no new dispatches.
- **New: Infrastructure Drift Detection FAILED** at 06:58 UTC on `main`. Worth investigating — may be related to SSH/provision gap or a separate config drift issue.
- **PR #1219 is 36 hours stuck** — longest in fleet history.
- **SSH and gateway hardening are 50+ hours unaddressed.**
- **Microsoft GA: 29 days** (was 30 days).

---

## What Fortune can do with this today
1. **Resolve PR #1230 merge conflicts** — one bounded action. Conflicts are on `sdk/mutx/__init__.py` and/or workflow files. Once resolved, this PR lands and unblocks #1219 and #1229.
2. **Assign a second GitHub reviewer to PR #1219** — `qa-reliability-engineer` cannot review. 36h stuck.
3. **Call `accept-new` on SSH** — one word closes `provision.yml:10` and `inventory.ini:13`. 50h overdue.
4. **Investigate Infrastructure Drift Detection failure** at 06:58 UTC — separate from PR queue but may surface config gap.
5. **Route or close issue #1187** — 10 days. Dispatch if valid. Close if stale.
6. **Name the next bounded dispatch** — `/dashboard` truth strip with Saviynt/ambient authority framing is the right next move before May 1.

---

## Freshness
- Source: `mission-control-orchestrator/reports/latest.md` @ 2026-04-01 06:46 UTC, live GitHub @ 2026-04-01 08:10 UTC.
- No material changes from prior 06:15 run. Fleet state unchanged.
- Next refresh: when PR #1230 conflicts resolve, Fortune acts on SSH/gateway, or new dispatch is named.
