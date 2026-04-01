# MUTX Roundtable

**Updated: 2026-04-01 06:15 Europe/Rome**
**Owner: project-shepherd**

---

## Decisions
- **PR #1230 open — lint fix in progress.** `cli-sdk-contract-keeper` opened `fix/sdk-init-regexports` at 06:11 UTC. CI running. Mergeable: CONFLICTING (may clear after CI + rebase).
- **PR #1219: STILL stuck — 34+ hours.** `pygments` bump, CI GREEN, mergeable. Second GitHub reviewer unassigned. `qa-reliability-engineer` cannot act as GitHub identity. **No change from prior run.**
- **SSH and gateway hardening: STILL ON FORTUNE'S DESK — 48+ hours.** `provision.yml:10` and `inventory.ini:13` remain open.
- **Issue #1187: 10 days old, unowned.** Still no owner, still unlabeled.
- **Engineering fleet: PARTIALLY ACTIVE.** PR #1230 dispatched by `cli-sdk-contract-keeper`. All other 9 lanes idle/downshifted.

---

## Top 3 cross-lane priorities

| # | Priority | Owner | Action needed |
|---|----------|-------|---------------|
| 1 | **PR #1230: resolve conflicts + land** | `cli-sdk-contract-keeper` / Fortune | Fix merge conflicts; once landed, PR #1219 + #1229 unblock |
| 2 | **PR #1219 second reviewer** | Fortune | Assign a GitHub user identity. `qa-reliability-engineer` cannot review. 34h stuck. |
| 3 | **Resolve or close issue #1187** | Fortune / project-shepherd | 10 days old — dispatch if valid, close if stale |

---

## Blockers
- **PR #1230 merge conflicts** — CI in progress but CONFLICTING mergeable state. May need rebase or conflict resolution.
- **PR #1219 second reviewer** — `qa-reliability-engineer` cannot act as GitHub reviewer. **34+ hours stuck.** Human required.
- **Issue #1187** — 10 days old, no assignment, no label.
- **SSH gap** (`provision.yml:10` = `0.0.0.0/0`, `inventory.ini:13` = `StrictHostKeyChecking=no`) — awaiting Fortune's `accept-new` call (48+ hours).
- **Gateway hardening** — patch on Fortune's desk for 48+ hours.
- **Microsoft Agent 365: 30 days to GA** — competitive clock is running.
- **social-media-strategist** — needs screenshots from `/dashboard/security`, `/dashboard/monitoring`, `/dashboard/budgets`.

---

## Handoffs
- **Fortune**: two decisions — (1) assign second reviewer on PR #1219, (2) SSH `accept-new` call.
- **cli-sdk-contract-keeper**: PR #1230 conflicts need resolution once CI finishes.
- **project-shepherd**: flag #1187 for routing or closure.
- **product-manager / workflow-architect / technical-writer**: `/dashboard` truth strip tied to `#39` — memory ownership framing from Saviynt/ambient authority signal should be embedded before next enterprise conversation.
- **social-media-strategist**: screenshot assets from `/dashboard` surfaces — blocker is the dashboard, not the lane.

---

## Fleet utility verdicts
- **Strongest lanes:** GTM signal / outside-in (Saviynt P0 competitive entry + 30-day Microsoft clock; ambient authority framing sharpest MUTX position; Meta $57B governance angle for CMO buyers), GTM outbound/sales/account (signal absorbed; briefs current).
- **Thin but honest lanes:** `cli-sdk-contract-keeper` (actively fixing lint — bounded, on target), workflow-architect (SDK deployment-history parity gap), developer-advocate (idle, awaiting dispatch).
- **Idle / blocked lanes:** X distribution (manual-only, unchanged), 9/10 engineering specialist lanes (IDLE), PR #1219 (34h stuck, reviewer-identity gap), social-media-strategist (needs screenshots), PR #1229 (blocked by lint on main).

---

## Keep / downshift / rewire / cut calls
- **Keep:** GTM signal lane — Saviynt is a new P0 competitive entry with named enterprise design partners; ambient authority positioning is confirmed and sharpened; Microsoft 30-day clock is a forcing function.
- **Keep:** product `/dashboard` truth strip — bounded, shippable, Saviynt/ambient authority framing should be embedded now.
- **Keep:** `cli-sdk-contract-keeper` dispatch — PR #1230 is the right bounded fix, in progress.
- **Downshift:** 9/10 idle engineering specialist lanes — downshifted, no new dispatch named.
- **Rewire:** infrastructure-maintainer — gateway patch has been on Fortune's desk for 48+ hours. If the operating model is single-operator/local-only, say it explicitly so the lane can adjust and close.
- **Cut:** idle dispatcher loop on dormant lanes.
- **Cut:** reviewer-resolution framing for queue congestion — queue is clear. The only reviewer gap is PR #1219's missing second reviewer.

---

## Exact evidence
- `engineering/mission-control-orchestrator/reports/latest.md` @ 2026-04-01 04:06 UTC: PR #1230 (lint fix, CI RED on main), PR #1219 (22h stuck), PR #1229 (blocked by lint), fleet DOWNSHIFT.
- Live `gh pr list --repo mutx-dev/mutx-dev --state open`: #1230 (lint fix, CONFLICTING, CI in progress), #1229 (xmldom bump, CI RED), #1219 (pygments bump, CI GREEN, no reviewer).
- Live `gh run list --limit 6`: `main` branch CI SUCCESS at 05:54 UTC today; PR #1230 CI in progress.
- `gtm/outside-in-intelligence/reports/signal-brief.md` @ 2026-03-31 18:20 Europe/Rome: Saviynt (new P0 incumbent), Microsoft Agent 365 GA May 1 (30 days), ambient authority, Meta $57B.
- `reporting/report-distribution-agent/reports/daily-brief.md` @ 2026-03-29 20:45 Europe/Rome: SSH gap in `provision.yml:10` + `inventory.ini:13`; gateway patch unapproved.

---

## What changed in truth
- **PR #1230 is the new critical path** — lint fix dispatched by `cli-sdk-contract-keeper`. CI in progress. Once landed, PR #1219 and #1229 both unblock. Merge conflicts may need resolution.
- **`main` branch CI now SUCCESS** — confirmed at 05:54 UTC today. The lint breakage may have been intermittent or the `main` branch has advanced since the failed run at 23:36 UTC on 2026-03-31.
- **PR #1219 is now 34 hours stuck** — no movement. This is the longest any PR has sat unaddressed.
- **Saviynt is a new P0 competitive entrant** — IAM incumbent with enterprise design partners (The Auto Club, Hertz, UKG). Every named design partner is an existing Saviynt relationship being extended into agent governance.
- **Microsoft Agent 365: 30 days to GA** — $15/$99 pricing. 30-day clock creates urgency for MUTX positioning and proof stack.
- **SSH and gateway hardening are 48+ hours unaddressed** — operator exposure compounding.

---

## What Fortune can do with this today
1. **Assign a second GitHub reviewer to PR #1219** — one action. `qa-reliability-engineer` cannot review. This is the only open PR that is genuinely ready to merge.
2. **Call `accept-new` on SSH** — one word closes `provision.yml:10` and `inventory.ini:13`. 48 hours overdue.
3. **Approve or decline the gateway patch** — if declining, name the operating model so infrastructure-maintainer can close the lane.
4. **Route or close issue #1187** — 10 days. Dispatch if valid. Close if stale.
5. **Name the next bounded dispatch after PR #1230 lands** — runtime health truth pass or `/dashboard` truth strip with Saviynt/ambient authority framing embedded.
6. **Pull `/dashboard` screenshots** — unblock social-media proof stack and enable Saviynt competitive response materials.
7. **30-day Microsoft clock** — product and GTM lanes need to have MUTX proof stack positioned before Agent 365 GA on May 1.

---

## Freshness
- Source briefs: `mission-control-orchestrator/reports/latest.md` @ 2026-04-01 04:06 UTC, live GitHub data @ 2026-04-01 06:11 UTC, `signal-brief.md` @ 2026-03-31 18:20 Europe/Rome.
- Next refresh: when PR #1230 CI resolves, Fortune makes SSH/gateway calls, or PR #1219 gets a reviewer.
