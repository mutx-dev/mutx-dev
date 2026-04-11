# PRODUCT_STATE

## Current product truth

PicoMUTX is now being rebuilt as a narrow, honest product loop:
- Academy: shipped as a browser-persistent workspace with 7 levels, 5 tracks, and 12 outcome-based tutorials.
- Tutor: shipped as a grounded lesson-aware support layer with escalation guardrails.
- Autopilot: shipped as a manual-first control layer with event timeline, cost threshold, alerts, approval gate, and audit export.
- Community/support: shipped as lightweight office-hours, project-share, and human escalation lanes.
- Billing: internal plan flags exist; billing is not wired.
- Live runtime connector: not shipped yet. Current autopilot uses manual run check-ins by design.

## Brutally honest repo assessment

### Reusable
- Pico subdomain routing in `proxy.ts`
- `app/pico/*` shell and `components/site/pico/*`
- Existing Next.js public surface, docs shell, and shared UI primitives
- Dashboard API proxies for onboarding, observability, alerts, usage, and runtime when auth-backed sync is added later
- Backend control-plane surfaces worth reusing later: onboarding, observability runs, usage events, monitoring alerts, webhooks

### Broken
- `app/pico/page.tsx` canonical/SEO previously pointed at a blocked `mutx.dev/pico` path
- `SUMMARY.md` docs nav is broken and currently fails docs drift tests
- Backend approvals/policies are fragmented and partly in-memory
- Assistant overview/live health surfaces are partly placeholder-backed

### Misleading
- `/onboarding` is desktop/operator setup, not Pico onboarding
- Parts of `/dashboard/*` and `/control/*` are shell/demo surfaces, not product truth
- Existing Pico landing promised guided support/product depth that did not exist yet
- The mutx.dev sitemap previously advertised `/pico` even though the host routing blocked it

### Missing before this cycle
- Academy content model
- Progress state model
- Tutor grounding layer
- Honest autopilot surface for first users
- Mandatory Pico product docs and ship checklist

### Delete immediately
- Nothing yet. Repo has bigger drift than dead code. Kill confusion first, then delete with intent.

### Ship first
- Pico workspace on `pico.mutx.dev/workspace`
- Internal state files and canonical PRD
- Lesson corpus and progress engine
- Manual-first autopilot with clear beta framing

## In progress
- Validation across typecheck and targeted tests
- End-of-cycle state update and commit

## Blocked
- Live runtime connector to control-plane observability and alerts still needs authenticated sync design
- Billing is intentionally stubbed behind plan flags only
- Docs nav drift remains outside the Pico v1 scope for this cycle

## Ships next
1. Auth-backed sync from Pico workspace into existing dashboard/onboarding/observability APIs
2. Live tutor backed by content retrieval + model inference when credentials are present
3. Public-facing copy rewrite so the landing mirrors the shipped beta instead of the old waitlist thesis
4. Replace manual telemetry with real run ingestion

## Work cycle log

### 2026-04-10 23:24:08Z — cycle start
- Pulled a brutal repo audit across frontend, backend, and docs/content surfaces.
- Chosen direction: stop pretending Pico is already a guided product and ship the narrow honest loop first.
- Highest-leverage path selected: create the state/docs spine, build the academy+tutor+manual-autopilot workspace, and fix Pico SEO truth on the way.

### 2026-04-10 23:44:22Z — cycle end
What changed
- Shipped `pico.mutx.dev/workspace` as a new beta workspace route.
- Added academy content, state, and tutor models under `lib/pico/`.
- Added the new Pico workspace UI with onboarding, tracks, lessons, tutor, autopilot, support, and audit export.
- Added mandatory product docs: PRODUCT_STATE, EXECUTION_PLAN, PRD_PICOMUTX, CONTENT_MAP, EVENT_MODEL, SHIP_CHECKLIST, DECISIONS.
- Fixed Pico canonical truth to the pico subdomain, removed the bogus `/pico` sitemap entry, and added a landing-page link into the workspace.

What was tested
- `npm run typecheck`
- `npx jest --runInBand tests/unit/picoState.test.ts tests/unit/picoTutor.test.ts`
- `npm run build`

What failed
- Nothing in the staged Pico workspace slice.
- Repo still contains concurrent/untracked Pico backend and dashboard scaffolding outside this commit scope.
- Docs nav drift in `SUMMARY.md` remains unresolved outside this cycle.

What is next
- Add optional auth-backed sync into existing onboarding/observability/usage routes.
- Replace manual telemetry with live agent ingestion.
- Tighten landing copy so the public story matches the shipped beta exactly.

### 2026-04-11 01:55:02 CEST — cycle start
- Executive order received: do not stop until PicoMUTX is actually finished.
- Began reconciliation of shadow Pico work left by the other active Hermes sessions.
- Current coordination target: merge the useful parts, kill duplicates, and end with one Pico truth.

### 2026-04-11 01:54:00 CEST — cycle end
What changed
- Added a new Pico academy shell under `app/pico/academy`, `app/pico/onboarding`, `app/pico/tutor`, `app/pico/autopilot`, and `app/pico/support`.
- Added typed lesson, level, track, XP, badge, plan, and release-note data under `lib/pico/academy.ts`.
- Added browser-local progress with authenticated sync via `/api/pico/progress` and backend `/v1/pico/progress` backed by `user_settings`.
- Added a grounded tutor route that returns lesson-matched next actions and compatibility payloads for the older Pico beta surfaces.
- Added approval proxy routes and wired the autopilot page to live runs, alerts, budgets, and approvals.
- Redirected the older workspace beta path to the new onboarding entry.

What was tested
- `npm run typecheck`
- `npm run build`
- `npm test -- tests/unit/picoAcademy.test.ts tests/unit/picoTutor.test.ts`
- `python3 -m compileall src/api`
- `./.venv/bin/python -m pytest tests/api/test_pico_progress_route.py -q`

What failed
- No product-blocking failures remained after the final pass.
- Existing unrelated test suites still emit their usual console noise, but the build and targeted validations are green.

What is next
- Decide whether to absorb or delete the older untracked Pico beta artifacts instead of leaving parallel shadows around.
- Move the landing CTA and copy fully onto the new shell so the product entrance is obvious.
- Add an admin/content-ops lane only if editing lessons in source files becomes a bottleneck.

### 2026-04-11 00:02:05 UTC — cycle end
What changed
- Added `/pico/app` as a new authenticated workspace and shipped lesson detail pages under `/pico/app/lessons/[slug]`.
- Added `/api/pico/state` plus backend `/v1/pico/state` on top of `user_settings` so the new workspace has persistent progress, thresholds, and approval-gate config.
- Kept old `/v1/pico/progress` working by adding compatibility transforms instead of breaking the earlier Pico shell.
- Rewrote tutor compatibility so both the new workspace and the older Pico tutor surfaces stay functional.
- Redirected `/pico/workspace` to `/pico/app` so the product has one cleaner entry.

What was tested
- `./.venv/bin/python -m pytest tests/api/test_pico_route.py tests/api/test_pico_progress_route.py tests/api/test_app_factory.py -q`
- `npm test -- --runInBand picoTutor picoAcademy`
- `npm run build`

What failed
- First pass broke `/v1/pico/progress` compatibility and the legacy tutor exports. Fixed in the same cycle.
- Remaining warnings are existing repo noise: OpenTelemetry shutdown log spam in pytest and Turbopack NFT warnings in build.

What is next
- Collapse the duplicate Pico shells into one canonical flow instead of carrying both the old academy/tutor pages and the new `/pico/app` workspace forever.
- Connect a real approval-request action path so the approval gate protects something concrete, not just a saved setting.
- Decide which of the shadow/untracked Pico files are worth keeping and delete the rest with intent.
