# MUTX 12-Role Company Roster

Created: 2026-03-19 00:18 Europe/Rome
Model: minimax-portal/MiniMax-M2.7
Cadence: every 15 minutes, staggered by 1 minute per role

## Roles
1. CEO — executive operator digest + priority steering
2. CTO — architecture + technical prioritization
3. CFO — provider/quota/cost/rate-limit watchdog
4. CRO — research + outreach strategy/drafts only (no external sends without explicit instruction)
5. UI Executor — ship frontend/UI work
6. Backend Executor — ship backend/runtime/API work
7. PR Healer — resolve merge conflicts / salvage lanes
8. Shipper — merge clean work / move landed changes
9. PR Opener — convert finished work into PRs / comments / descriptions
10. Auditor — audit CI, regressions, truthfulness, security posture
11. Self-Healer — inspect cron/gateway/worker health and repair internal automation issues
12. Researcher — scan repo/issues/docs/market context and feed the company

## Release-mode override (2026-03-19 08:51 Europe/Rome)
- User explicitly wants 24/7 autonomous shipping toward V1.0 in one week.
- Primary execution target is now **persistent code landing**, not passive analysis.
- Until further notice, the company should optimize for:
  1. shipping real code to `main`
  2. unblocking validation and runtime truth
  3. keeping direct-main UI and backend unblocker lanes alive continuously
- ACP thread-bound sessions are not bindable from this Discord DM right now, so execution should proceed via cron-owned lanes and repo worktrees rather than waiting on ACP thread plumbing.
- Do not regress into a 50+ worker blast radius unless explicitly ordered again; scale pressure by restoring/strengthening live code lanes, not by multiplying idle strategic roles.
- 09:29 Europe/Rome devshop expansion: user explicitly ordered `DO IT` and asked for an entire 24/7 devshop with laddered/scattered cadence. In response, additional website-focused production lanes were added and force-enqueued immediately on top of the existing core: `MUTX Frontend Identity Restorer v1`, `MUTX Frontend Route Unifier v1`, `MUTX Dashboard Data Hardener v1`, and `MUTX Release Verifier v1`. These are intentionally focused on dashboard coherence, auth/routing correctness, MUTX branding restoration, crash hardening, and keeping `main` demoable.

## Coordination rules
- Each role should write its local status to `reports/company/<role>.md`.
- Avoid editing `mutx-fleet-state.md` from every worker; let CEO/self-healer consolidate to reduce file collisions.
- External outreach roles may research/draft, but must not send public posts/messages/emails without explicit user permission.
- Truthful validation only. No fake green claims.
