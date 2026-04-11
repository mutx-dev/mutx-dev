# PRODUCT_STATE

## Current product truth

PicoMUTX has one canonical product system.
This file is the authoritative reconciliation log for that order.

Canonical product surface:
- `app/pico/*`

Canonical frontend system:
- `components/pico/*`

Canonical academy/state model:
- `lib/pico/academy.ts`
- `lib/pico/tutor.ts`

Canonical backend persistence:
- `src/api/routes/pico.py`
- `src/api/services/pico_progress.py`

Canonical product docs:
- `PRODUCT_STATE.md`
- `EXECUTION_PLAN.md`
- `PRD_PICOMUTX.md`
- `CONTENT_MAP.md`
- `EVENT_MODEL.md`
- `SHIP_CHECKLIST.md`
- `DECISIONS.md`

## What PicoMUTX is right now

PicoMUTX is the narrow honest loop:
- academy with 7 levels, 5 tracks, and 12 real lessons
- persistent progress with XP, badges, unlocks, and local-plus-auth sync
- grounded tutor using the shipped lesson corpus
- support shell with real human escalation
- autopilot using real MUTX runs, alerts, budgets, and approvals
- simple plan gating without pretending billing is finished

It is not a fake community clone, not a no-code builder, and not a dashboard full of pretend telemetry.

## Canonical rules in force

1. No alternate Pico surfaces.
2. No legacy workspace shells as product truth.
3. No duplicate state models.
4. No duplicate tutor systems.
5. If a Pico concern already exists in the canonical files, changes go there or nowhere.

## Reconciliation status

### Merged into the canonical system
- Route-prefix navigation behavior was kept so canonical Pico links work both on `pico.mutx.dev/*` and local `/pico/*` paths.
- Approval validation helpers stayed under `app/api/pico/approvals/_validation.ts` because they strengthen the canonical approvals bridge without creating a second Pico model.
- Tutor grounding improvements were absorbed into `lib/pico/tutor.ts`, `app/api/pico/tutor/route.ts`, and `components/pico/PicoTutorPageClient.tsx`.
- The useful autopilot formatting and timeline helpers were absorbed into `components/pico/picoAutopilot.ts`, inside the canonical Pico frontend system.
- Root docs were realigned to the canonical lesson corpus and backend persistence model.

### Deleted shadow implementations
Deleted because they duplicated the Pico product, route family, state, or tutor model instead of extending the canonical system:
- `app/pico/app/page.tsx`
- `app/pico/workspace/page.tsx`
- `app/pico/app/lessons/[slug]/page.tsx`
- `app/api/pico/state/route.ts`
- `lib/pico/catalog.ts`
- `lib/pico/content.ts`
- `lib/pico/state.ts`
- `tests/api/test_pico_route.py`
- `tests/unit/picoState.test.ts`
- `components/site/pico/PicoPreRegForm.tsx`

### Why they were deleted
- They kept duplicate route families or duplicate state contracts alive.
- They split Pico persistence across incompatible shapes.
- They let docs drift away from the lesson slugs and XP model the product actually ships.
- They created forked Pico truth. That is how products rot.

## Current open realities

### Honest limitations
- Billing is still flag-driven, not wired to checkout.
- Approval persistence is still backed by the shared in-memory approvals service. Visible and usable, not durable across restarts.
- Non-English Pico landing locales still carry stale prereg copy and need a cleanup sweep.
- Build still emits the existing repo-wide Turbopack NFT warning around `next.config.js`; not a Pico blocker.

### Not blocked
- PicoMUTX v1 is coherent and shippable.
- Repo-native validation for the canonical Pico surface is green once the current cleanup slice passes.

## Validation snapshot

Latest validated commands for the current canonical slice:
- `rm -rf .next && npm run typecheck`
- `npx jest --runInBand tests/unit/picoAcademy.test.ts tests/unit/picoTutor.test.ts tests/unit/picoAutopilot.test.ts`
- `./.venv/bin/python -m pytest tests/api/test_pico_progress_route.py tests/api/test_app_factory.py -q`
- `npm run build`

## Work cycle log

### 2026-04-11 03:05:40 CEST - canonical Pico cleanup started
What changed
- Started a strict cleanup pass to remove the last shadow Pico routes and stale Pico truth from docs.
- Audited the repo against the canonical Pico order before touching architecture.

What was tested
- Audit only.

What failed
- Found remaining legacy redirect routes and stale root-doc references still describing them as active compatibility lanes.

What is next
- Delete the leftover `/pico/app`, `/pico/workspace`, and `/pico/app/lessons/[slug]` shims.
- Collapse stale Pico docs onto the canonical lesson slugs and persistence model.
- Re-run Pico validation and commit the cleanup slice.

### 2026-04-11 03:15:38 CEST - canonical Pico cleanup shipped
What changed
- Deleted the last legacy Pico route aliases: `/pico/app`, `/pico/workspace`, and `/pico/app/lessons/[slug]`.
- Collapsed the Pico tutor bridge to one reply envelope from `lib/pico/tutor.ts` through `app/api/pico/tutor/route.ts` and the tutor page client.
- Absorbed the useful autopilot helper layer into `components/pico/picoAutopilot.ts` so live autopilot logic stays inside the canonical Pico frontend system.
- Rewrote `CONTENT_MAP.md` and `EVENT_MODEL.md` to match the actual lesson slugs, XP table, and backend persistence contract.
- Updated `DECISIONS.md` and this file so the repo now states one Pico truth instead of documenting compatibility theater.

What was tested
- `rm -rf .next && npm run typecheck`
- `npx jest --runInBand tests/unit/picoAcademy.test.ts tests/unit/picoTutor.test.ts tests/unit/picoAutopilot.test.ts`
- `./.venv/bin/python -m pytest tests/api/test_pico_progress_route.py tests/api/test_app_factory.py -q`
- `npm run build`

What failed
- Initial build failed after deleting an untracked shadow helper because `PicoAutopilotPageClient.tsx` still depended on it.
- Fixed by moving the useful helper code into `components/pico/picoAutopilot.ts` and repointing imports there.
- Only existing repo-wide warning noise remains after the fix.

What is next
- Keep all future Pico changes inside the canonical files only.
- Post-v1 hardening is still durable approvals, real billing, and deeper runtime ingestion.
