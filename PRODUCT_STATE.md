# PRODUCT_STATE

Status: active build
Last updated: 2026-04-11T00:51:05Z

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

## Guardrails now locked
- Canonical entry remains `/pico/onboarding`; `/pico/app` and `/pico/workspace` stay redirects only.
- No new state schemas.
- No new API routes unless extending an existing Pico route.
- No new entry routes.
- Tutor response shape stays frozen.
- Extend the canonical Pico system, never fork it.

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

### 2026-04-11T00:11:28Z START
- Executive order received: continue until PicoMUTX is functionally finished, not just sketched.
- Coordinating three parallel Hermes workstreams: onboarding/public-path cleanup, plan-gating+tutor progression, and QA/test hardening.

### 2026-04-11T00:32:00Z END
What changed
- Added a real Pico onboarding entry route at /pico/start with a first-run checklist across auth, academy, starter deploy, and control review.
- Hardened plan-aware tutor usage and progression state with visible tutor limits, richer XP runway, badges, milestones, and track progress.
- Added unit coverage for Pico academy, support, control helpers, and frontend state normalization.
- Fixed Pico frontend state parsing so backend lesson_completed events and lesson_id payloads are recognized correctly.
- Kept the starter deploy, threshold, and approval flows wired to real existing APIs instead of fake shell state.

What was tested
- npm run typecheck
- npm run lint
- npm run build
- /Users/fortune/MUTX/.venv/bin/python -m pytest tests/api/test_pico_route.py -q
- npx jest --runInBand tests/unit/picoState.test.ts tests/unit/picoAcademyPage.test.tsx tests/unit/picoSupportPage.test.tsx tests/unit/picoControlPage.test.ts

What failed
- No blocking failures remain.
- Existing non-blocking warnings still appear from Next workspace-root/NFT tracing and OpenTelemetry exporter shutdown noise after pytest.

What is next
- Merge this coordinated finish-pass.
- If we keep pushing, the next real gains are billing integration or deeper live run/alert authoring, not more shell paint.

### 2026-04-11T00:47:28Z START
- Canonical Pico order received. Reconciling all shadow implementations into one Pico truth.

### 2026-04-11T00:47:28Z END
What changed
- Merged lib/pico/course.ts and lib/pico/progression.ts into the canonical lib/pico/academy.ts.
- Moved grounded tutor matching into the canonical lib/pico/tutor.ts instead of keeping it embedded inside PicoSupportPage.
- Renamed backend persistence from src/api/services/pico_state.py to the canonical src/api/services/pico_progress.py.
- Updated all app/pico/*, components/pico/*, tests, and docs to import the canonical academy/tutor/progress modules.

What was deleted
- lib/pico/course.ts
- lib/pico/progression.ts
- src/api/services/pico_state.py

Why
- Parallel Pico files were already starting to drift into shadow architecture. Leaving them around would guarantee contradictory product logic and duplicate maintenance.

What was tested
- npm run typecheck
- npm run lint
- npx jest --runInBand tests/unit/picoState.test.ts tests/unit/picoAcademyPage.test.tsx tests/unit/picoSupportPage.test.tsx tests/unit/picoControlPage.test.ts
- /Users/fortune/MUTX/.venv/bin/python -m pytest tests/api/test_pico_route.py -q
- npm run build

What failed
- No blocking failures. Existing Next workspace-root/NFT warnings and pytest OpenTelemetry shutdown noise remain non-blocking.

What is next
- From here on, any Pico change should land only in the canonical academy/tutor/progress files and the app/pico/components/pico surfaces that consume them.

### 2026-04-11 02:51:05 CEST — guardrails locked
What changed
- Locked the user guardrails into the canonical Pico docs and execution plan.
- Froze Pico against new state schemas, new entry routes, route forks, and tutor envelope drift.
- Corrected the route-truth note so `/pico/onboarding` is the canonical entry and the legacy paths stay redirects only.

What was tested
- `git diff -- PRODUCT_STATE.md PRD_PICOMUTX.md EXECUTION_PLAN.md DECISIONS.md`
- Source audit of `app/pico/onboarding/page.tsx`, `app/pico/app/page.tsx`, and `app/pico/workspace/page.tsx`

What failed
- Nothing. This was a constraint lock and doc correction pass.

What is next
- Keep all future Pico work inside the existing canonical files and contracts.

### 2026-04-11 03:19:11 CEST — Pico UI coherence upgrade
What changed
- Shifted from rebuild talk to a focused UI upgrade pass across Start, Lesson, Support, Control, and the shared Pico shell.
- Added shared Pico UI class helpers so cards, buttons, fields, and section labels stop drifting page by page.
- Made Start respect auth in the hero actions and visually feature the next incomplete step instead of treating every step equally.
- Made Lesson pages show prerequisites earlier, stop baiting logged-out completion clicks, and turn completion into a clearer next-step receipt.
- Reworked Support so local lesson matches preview immediately, tutor usage is only recorded when relevant, and human escalation can open with context instead of a blank wall.
- Simplified Control starter deploy into a one-click default path with advanced settings collapsed, hardened refresh against partial fetch failure, and stopped threshold saves from pretending success on failed writes.

What was tested
- `npm run typecheck`
- `npm run lint`
- `npm run build`

What failed
- No blocking Pico failures remain in this slice.
- Existing repo-level Next/Turbopack warnings remain non-blocking.

What is next
- Keep tightening Academy hierarchy so the lesson list and next recommended action dominate over secondary progress chrome.
- Add a cleaner auth wrapper for Pico login/register so trust does not dip at the account boundary.

### 2026-04-11 03:23:12 CEST — Academy hierarchy cleanup
What changed
- Rebuilt the Academy page hierarchy around one dominant next action instead of opening with a wall of secondary progress chrome.
- Moved the lesson list up so the user sees the actual work immediately after the recommended next lesson.
- Promoted the next lesson into a strong action card with deliverable, why-it-matters, and prerequisites.
- Demoted tracks, badges, and recent activity into lower supporting sections so the page reads like a path, not an analytics dashboard.
- Tightened lesson cards so recommended vs completed vs queued states are visually obvious in one scan.

What was tested
- `npm run typecheck`
- `npm run lint`
- `npm run build`

What failed
- No blocking Pico failures remain in this slice.
- Existing repo-level Next/Turbopack warnings remain non-blocking.

What is next
- Wrap Pico login/register in the same shell so the auth boundary stops feeling like a different product.
- Keep tightening Control and Academy receipts where real progress happens.

### 2026-04-11 03:31:00 CEST — Pico auth shell unified
What changed
- Wrapped Pico login and register in the same Pico product shell instead of dropping users into the generic marketing auth surface.
- Kept the existing hosted auth logic and redirects, but made the auth boundary feel like the same product the user was already in.
- Reused the shared Pico UI primitives for fields, buttons, and support cards so auth no longer looks outsourced.
- Added clearer Pico-specific next-step context inside auth so users know they are returning to Start, Academy, and Support rather than a random dashboard.

What was tested
- `npm run typecheck`
- `npm run lint`
- `npm run build`

What failed
- No blocking Pico failures remain in this slice.
- Existing repo-level Next/Turbopack warnings remain non-blocking.

What is next
- Tighten Pico control receipts further so starter deploy, threshold save, and approval creation all feel equally explicit.
- Sweep any remaining copy drift between Pico route copy and the underlying authenticated destinations.

### 2026-04-11 03:34:11 CEST — Control receipts hardened
What changed
- Added a real operator-receipts strip to Pico Control so deploy, threshold, and approval actions leave explicit visible proof instead of vanishing into the page.
- Upgraded starter deploy feedback from a generic success line into a receipt with assistant/deployment context and a direct next review link.
- Upgraded threshold saves into a receipt tied to the saved value and the next budget review step.
- Upgraded approval creation into a receipt that points straight at the pending approvals panel instead of just saying "something happened below".
- Kept refresh resilient under partial fetch failure and preserved the existing live control-plane bridge.

What was tested
- `npm run typecheck`
- `npm run lint`
- `npm run build`

What failed
- No blocking Pico failures remain in this slice.
- Existing repo-level Next/Turbopack warnings remain non-blocking.

What is next
- Tighten the lower live-data cards so Assistant, Budget, and Approvals scan faster under pressure.
- Sweep any remaining copy that still sounds like framework plumbing instead of operator product language.

