# TODAY.md — Project Shepherd

**Refreshed: 2026-04-01 06:15 Europe/Rome**

## Current operating truth
- **PR #1230: lint fix IN PROGRESS.** `cli-sdk-contract-keeper` opened `fix/sdk-init-regexports` at 06:11 UTC. CI running. Mergeable: CONFLICTING — may need rebase/conflict resolution once CI finishes. **This is the critical path.**
- **`main` branch CI: SUCCESS** — confirmed at 05:54 UTC today.
- **PR #1219: 34 hours stuck.** `pygments` bump, CI GREEN, mergeable, no second GitHub reviewer. `qa-reliability-engineer` cannot act as GitHub identity.
- **Issue #1187: 10 days old with no owner.**
- **SSH and gateway hardening: 48+ hours on Fortune's desk.**
- **New competitive reality:** Saviynt is P0 incumbent (IAM → agent governance). Microsoft Agent 365 GA in 30 days ($15/$99 pricing).

## Top 3 cross-lane priorities

| # | Priority | Owner | Blocked by |
|---|----------|-------|------------|
| 1 | **PR #1230: resolve merge conflicts + land** | `cli-sdk-contract-keeper` + Fortune if conflicts are real | CI in progress; merge conflicts may clear post-CI |
| 2 | **PR #1219 second reviewer** | Fortune | needs GitHub user identity assigned — 34h stuck |
| 3 | **Route or close issue #1187** | Fortune + project-shepherd | 10 days old, no owner |

## Decision deck for Fortune
- **PR #1219**: assign second GitHub reviewer — `qa-reliability-engineer` cannot review
- **SSH `accept-new` call**: closes `provision.yml:10` and `inventory.ini:13` (48h overdue)
- **Gateway patch**: approve/decline + name operating model if declining
- **Issue #1187**: dispatch or close — 10 days stale

## Next bounded dispatch (after PR #1230 lands)
- **A. Runtime health truth pass** — bounded, shippable, `ai-engineer` can run now
- **B. `/dashboard` truth strip + Saviynt/ambient authority framing** — product-manager, embeds new GTM signal before 30-day Microsoft clock hits

## Blockers / stale / unowned
- **PR #1230**: merge conflicts may need resolution (CLI in progress)
- **PR #1219**: second reviewer missing — 34h stuck
- **Issue #1187**: 10 days, no owner, unlabeled
- **SSH/gateway**: 48h on Fortune's desk
- **social-media-strategist**: needs screenshots from `/dashboard`
- **9/10 engineering lanes**: idle/downshifted, no dispatch named

## Owner pushes for this window
- **Fortune**: assign second reviewer to PR #1219, make SSH call, decide gateway patch, route/close #1187
- **cli-sdk-contract-keeper**: PR #1230 — monitor CI, resolve any merge conflicts
- **product-manager**: `/dashboard` truth strip with Saviynt/ambient authority positioning embedded before May 1 Microsoft GA
- **social-media-strategist**: screenshot assets from `/dashboard`
