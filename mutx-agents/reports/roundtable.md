# MUTX Roundtable

**Updated: 2026-03-30 08:10 Europe/Rome**
**Owner: project-shepherd**

---

## Decisions
- **Queue is CLEAR.** No new PRs opened or merged since PR #1218 (`chore: lint fixes 2026-03-29`) at 21:34 UTC. main is clean at `81d7ef56`.
- Review queue, merge queue, and action queue all empty.
- Market signal: **Gartner's $58B governance-shakeup framing** holds. "Runtime path evaluation" is the confirmed permission model language.
- **Issue #1187** (Cleanup Consolidation Issue) is 7 days old, unassigned, unaddressed — needs owner or close.

---

## Top 3 cross-lane priorities

| # | Priority | Owner | Action needed |
|---|----------|-------|---------------|
| 1 | **SSH hardening call** | Fortune | Pick `accept-new` baseline — closes `provision.yml:10` and `inventory.ini:13` gaps |
| 2 | **Gateway hardening patch decision** | Fortune | Approve or decline `agents.defaults.sandbox.mode="all"`, `tools.fs.workspaceOnly=true`, `tools.exec.security="allowlist"`+ask — 4 passes, no decision |
| 3 | **Route or close issue #1187** | Fortune / project-shepherd | 7 days open, no assignment — if valid, dispatch; if stale, close |

---

## Blockers
- **SSH gap** (`provision.yml:10` = `0.0.0.0/0`, `inventory.ini:13` = `StrictHostKeyChecking=no`) — awaiting Fortune's `accept-new` call.
- **Gateway hardening** — patch on Fortune's desk since 2026-03-29 08:06, unapproved after 4 passes.
- **Issue #1187** — 7 days old, no owner, no activity.
- **Next dispatch slice** — unnamed. All 9 engineering specialist lanes are idle.
- **Social-media-strategist** — needs screenshots from `/dashboard/security`, `/dashboard/monitoring`, `/dashboard/budgets` before proof stack can assemble.

---

## Handoffs
- **Fortune**: two security calls needed now — SSH baseline (`accept-new`) and gateway hardening patch (approve/decline + name operating model if declining).
- **project-shepherd**: route or close issue #1187.
- **product-manager / workflow-architect / technical-writer**: `/dashboard` truth strip tied to `#39` remains the right next product move — unblocked, awaiting direction.
- **social-media-strategist**: needs screenshot assets from `/dashboard` surfaces — blocker is the dashboard, not the lane.

---

## Fleet utility verdicts
- **Strongest lanes:** GTM signal / outside-in (Gartner framing live, evidence specific and fresh), GTM outbound/sales/account (Gartner + runtime path evaluation absorbed), product/frontend/technical-writer (queue clear, bounded dispatch ready).
- **Thin but honest lanes:** workflow-architect (SDK deployment-history parity gap, needs contract decision), developer-advocate (idle, awaiting next dispatch slice).
- **Idle / blocked lanes:** X distribution (manual-only, unchanged), all 9 engineering specialist lanes (idle, awaiting next dispatch).

---

## Keep / downshift / rewire / cut calls
- **Keep:** GTM signal lane — Gartner framing is live and directly usable in enterprise conversations.
- **Keep:** product/runtime truth work — `/dashboard` truth strip is the right bounded dispatch once named.
- **Rewire:** infrastructure-maintainer — hardening patch has been on Fortune's desk for 12+ hours across 4 passes. If operating model is single-operator/local-only, say it explicitly so the lane can lock it down without the patch.
- **Rewire:** developer-advocate — needs next bounded dispatch slice named to move.
- **Cut:** idle dispatcher loop — engineering fleet has nothing to do. Consider stopping the proactive-coder cycles until next dispatch is named.
- **Cut:** reviewer-resolution framing — queue is clear, that is no longer the gate.

---

## Exact evidence
- `engineering/mission-control-orchestrator/reports/latest.md` @ 2026-03-30 04:05 UTC: 0 open PRs, all queues empty, main at `81d7ef56`, issue #1187 (7 days old) the only open artifact.
- `gtm/outside-in-intelligence/reports/signal-brief.md` @ 2026-03-29 18:20 Europe/Rome: Gartner $58B governance-shakeup, runtime path evaluation language confirmed.
- `reporting/report-distribution-agent/reports/daily-brief.md` @ 2026-03-29 20:45 Europe/Rome: SSH gap confirmed in `provision.yml:10` and `inventory.ini:13`; gateway patch unapproved after 4 passes.
- `control/project-shepherd/reports/latest.md` @ 2026-03-29 20:10 Europe/Rome: queue clear, fleet unblocked.

---

## What changed in truth
- Engineering fleet has been **idle since 2026-03-29 21:34 UTC** with no new work dispatched.
- Issue #1187 is **7 days old** with no owner — the oldest unaddressed artifact in the fleet.
- SSH and gateway hardening gaps **have been unaddressed for 12+ hours** — these are the only named security gaps remaining.

---

## What Fortune can do with this today
1. **Make the SSH call** — `accept-new` is the single word that closes `provision.yml` and `inventory.ini`. Security-engineer lane closes it immediately after.
2. **Approve or decline the gateway patch** — if declined, name the operating model (single-operator, local-only) so infrastructure-maintainer can adjust the hardening approach without the patch.
3. **Route or close issue #1187** — one decision: dispatch to a lane or close as stale.
4. **Name the next bounded dispatch** — runtime health truth pass is the most shippable option; product `/dashboard` truth strip is the second.
5. **Pull `/dashboard` screenshots** — unblocks social-media-strategist proof stack assembly.

---

## Freshness
- Source briefs: `mutx-engineering-agents/mission-control-orchestrator/reports/latest.md` @ 2026-03-30 04:05 UTC (06:05 Europe/Rome), `gtm/outside-in-intelligence/reports/signal-brief.md` @ 2026-03-29 18:20 Europe/Rome, `reporting/report-distribution-agent/reports/daily-brief.md` @ 2026-03-29 20:45 Europe/Rome.
- Next refresh: when Fortune makes the SSH/gateway calls or names the next dispatch slice.
