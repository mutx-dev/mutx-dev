# PRODUCT_STATE

Status: active build
Last updated: 2026-04-10T23:27:50Z

## What exists
- pico.mutx.dev is a real multilingual landing page with live lead/contact capture.
- MUTX already has usable auth, onboarding state, runtime snapshots, template deployment, runs, monitoring alerts, usage, budgets, and assistant overview APIs.
- Stable browser operator surfaces exist under /dashboard for agents, deployments, runs, monitoring, sessions, budgets, api keys, and templates.

## What is real but not Pico-ready
- Onboarding is operator setup, not academy progression.
- Assistant APIs are deployment/control metadata, not a learning tutor.
- Approvals exist but are in-memory only.
- Budgets are usage reporting, not hard enforcement.
- /control and several dashboard routes are preview/demo shells and cannot be treated as product truth.

## What was missing before this cycle
- No academy domain model.
- No learner progress or XP model.
- No Pico product shell beyond the landing page.
- No tutor grounded in academy content.
- No Pico autopilot page that packages the real MUTX control-plane data honestly.
- No plan gating for Pico.

## In progress
- End-of-cycle docs sync.
- Commit and handoff.

## Blocked
- Billing remains stub-only until credentials and irreversible billing decisions are intentionally handled.
- A true model-backed tutor is not available from existing repo surfaces, so v1 ships with a grounded deterministic tutor.
- Approval persistence is still in-memory, so the approval surface is honest MVP only.

## Ships next
1. Plan flags and usage gating.
2. Cleaner auth-aware deploy path from inside Pico.
3. Stronger tutor escalation and content-gap capture.
4. Optional live run ingestion upgrades beyond the current real control-plane summary.

## Repo assessment
### Reusable now
- app/pico landing and subdomain routing in proxy.ts
- auth pages and auth API proxies
- template deployment path via /v1/templates/personal_assistant/deploy
- onboarding and runtime snapshot persistence via user_settings
- monitoring alerts, runs, assistant overview, budgets, usage

### Broken or misleading
- /control demo surfaces are not product truth.
- desktop-native onboarding is not a web Pico onboarding flow.
- approvals are not durable.
- sessions scan host-local folders and are not a hosted truth source.

### Delete immediately
- Nothing destructive in this cycle. The first move is to stop routing Pico users into fiction, not to mass-delete repo surfaces.

### Ship first
- A narrow Pico loop: auth -> academy -> deploy first agent -> see runs/alerts/budget -> mark progress -> get support.

## Work cycle log
### 2026-04-10T23:27:50Z START
- Completed repo inspection across frontend and backend surfaces.
- Confirmed Pico currently stops at landing-page capture.
- Chose v1 scope: academy plus honest control shell, both backed by existing MUTX primitives where possible.

### 2026-04-11T00:55:00Z END
What changed
- Added mandatory product docs: PRODUCT_STATE.md, EXECUTION_PLAN.md, PRD_PICOMUTX.md, CONTENT_MAP.md, EVENT_MODEL.md, SHIP_CHECKLIST.md, DECISIONS.md.
- Added backend Pico learner state persisted via UserSetting with GET /v1/pico/state and POST /v1/pico/events.
- Added typed Pico schemas and targeted API tests.
- Added Pico academy, lesson, control, support, login, and register routes under app/pico/*.
- Added a 12-tutorial lesson corpus aligned to Levels 0-6 and Tracks A-E.
- Added same-origin Pico API proxies plus an approvals proxy for the control page.
- Added an in-product starter deploy card in Pico control that uses the real personal_assistant template deploy route.
- Added cost-threshold and approval-gate actions inside Pico control, backed by Pico state plus the real approvals API.
- Added soft plan-flag messaging in Pico control so free vs paid scope is visible without faking billing.
- Updated the Pico landing CTA so it opens the product instead of dumping users into waitlist-only behavior.

What was tested
- /Users/fortune/MUTX/.venv/bin/python -m pytest tests/api/test_pico_route.py -q
- npm run typecheck
- npm run lint
- npm run build

What failed
- Initial lint errors in AuthPage and PicoLandingPage. Fixed.
- Initial Pico test expectation drift after XP changes. Fixed.
- Root-level docs created via write_file landed in the main repo first, so they were copied into the worktree explicitly.
- Next build still emits the existing workspace-root warning and next.config NFT warning, but the build completes successfully.

What is next
- Commit this cycle cleanly.
- Improve tutor escalation and content-gap capture.
- Tighten plan gating from soft messaging into simple enforceable limits where the underlying behavior already exists.
