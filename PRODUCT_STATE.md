# PRODUCT_STATE

## Current product truth

PicoMUTX now has one canonical product system.
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
- autopilot page using real MUTX runs, alerts, budgets, and approvals
- simple plan gating without pretending billing is finished

It is not a fake community clone, not a no-code builder, and not a dashboard full of pretend telemetry.

## Canonical rules in force

1. No alternate Pico surfaces.
2. No reintroduction of legacy workspace shells as product truth.
3. No duplicate state models.
4. No duplicate tutor systems.
5. If a Pico concern already exists in the canonical files, changes go there or nowhere.

## Reconciliation status

### Merged into the canonical system
- Route-prefix navigation behavior from the shadow sessions was preserved so links work both on `pico.mutx.dev/*` and local `/pico/*` paths.
- Approval request validation helpers were kept under `app/api/pico/approvals/_validation.ts` because they strengthen the canonical approvals bridge without creating a parallel Pico model.
- Better tutor response handling was folded into `components/pico/PicoTutorPageClient.tsx` and `lib/pico/tutor.ts`.
- Pico now has one product entry route: `/pico/onboarding`. Alternate `/pico/app`, `/pico/app/lessons/[slug]`, and `/pico/workspace` routes were removed instead of preserved as aliases.
- Tutor responses now flow through one canonical reply shape from `lib/pico/tutor.ts` to `/api/pico/tutor` and the Pico tutor UI.

### Deleted shadow implementations
Deleted because they duplicated the Pico product, state, or tutor model instead of extending the canonical system:
- `app/api/pico/state/route.ts`
- `lib/pico/catalog.ts`
- `lib/pico/content.ts`
- `lib/pico/state.ts`
- `tests/api/test_pico_route.py`
- `tests/unit/picoState.test.ts`
- `components/site/pico/PicoPreRegForm.tsx`
- `app/pico/app/page.tsx`
- `app/pico/app/lessons/[slug]/page.tsx`
- `app/pico/workspace/page.tsx`
- the legacy dual-shape tutor path (`answerPicoTutorQuestion` export plus `legacy` API envelope)

### Why they were deleted
- They defined competing lesson ids, track ids, or state shapes.
- They split Pico persistence across `/state` and `/progress` contracts.
- They pulled the tutor against a different lesson corpus than the product actually ships.
- They created the exact kind of forked reality that makes a product rot.
- Route aliases kept teaching the repo that Pico had more than one product entry.
- The tutor had one logic core but two public response contracts, which is how UI drift sneaks back in.

## Current open realities

### Honest limitations
- Billing is still flag-driven, not wired to checkout.
- Approval persistence is still backed by the shared in-memory approvals service, now tightened for visibility but not yet durable across restarts.
- Non-English Pico landing keys now fall back to English on the active truth-critical CTA/contact surfaces. Full localization still needs a proper sweep.
- Build still emits the existing repo-wide Turbopack NFT warning around `next.config.js`; not a Pico blocker.

### Not blocked
- PicoMUTX v1 is coherent and shippable.
- Repo-native validation for the canonical Pico surface is green.

## Validation snapshot

Latest validated commands:
- `npm run typecheck`
- `npx jest --runInBand tests/unit/picoAcademy.test.ts tests/unit/picoTutor.test.ts`
- `./.venv/bin/python -m pytest tests/api/test_pico_progress_route.py tests/api/test_app_factory.py -q`
- `npm run build`

## Work cycle log

### 2026-04-11 02:41:00 CEST — canonical Pico reconciliation complete
What changed
- Reconciled all remaining shadow Pico implementations into one canonical system.
- Removed the duplicate `/state` persistence lane and its tests.
- Rebased Pico tutor behavior onto `lib/pico/academy.ts` so lesson matching, ids, and links come from the same shipped lesson corpus as the UI.
- Repointed every active entry back to the canonical onboarding and academy flow.
- Moved the public landing composition under `components/pico/*` ownership via `components/pico/PicoLandingSurface.tsx`.

What was merged
- Useful route-prefix navigation behavior.
- Approval payload validation helpers.
- Stronger tutor response envelopes and support escalation behavior.

What was deleted
- Shadow state files, shadow route tests, and the unused prereg surface listed above.

Why
- One Pico truth beats three almost-right ones.
- Duplicate lesson/state models are how products start lying to themselves.

What was tested
- `rm -rf .next && npm run typecheck`
- `npm run build`
- `npm test -- tests/unit/picoAcademy.test.ts tests/unit/picoTutor.test.ts`
- `./.venv/bin/python -m pytest tests/api/test_pico_progress_route.py tests/api/test_app_factory.py -q`
- curl smoke checks on `/pico/onboarding`, `/pico/app`, and `/pico/workspace`

What failed
- No Pico-specific blockers remain.
- Only existing repo-wide warning noise remains.

What is next
- Keep shipping inside the canonical Pico files only.
- If another session produces Pico changes outside that order, absorb the useful parts and delete the shadow immediately.

### 2026-04-11 00:57:03 UTC — canonical order enforcement
What changed
- Re-audited the repo against the explicit canonical Pico order.
- Confirmed the canonical route truth remains:
  - `/pico/onboarding` = the only product entry
  - `/pico/app`, `/pico/app/lessons/[slug]`, and `/pico/workspace` = deleted
- Absorbed the remaining Pico frontend shadow system by moving the last Pico-owned site components under `components/pico/*` and removing `components/site/pico/*` from the product truth.
- Updated `docs/surfaces.md` so it stops advertising `components/site/pico/` as a Pico source of truth.
- Rejected the in-flight non-English message churn from parallel sessions because it was not part of the canonical reconciliation and would have reintroduced copy drift.

What was merged
- `PicoLandingPage`, `PicoFooter`, `PicoContactForm`, `PicoLangSwitcher`, and their CSS now belong to the canonical Pico component system.

What was deleted or deprecated
- `components/site/pico/*` as an active Pico product surface.
- Shadow translation churn in `messages/*.json` was discarded instead of merged.

Why
- The canonical frontend system is `components/pico/*`, not two Pico UI trees.
- A second Pico component directory is how the product starts lying about where truth lives.
- Bad translation churn is worse than no translation churn.

What was tested
- `npm run build`
- `npm test -- --runInBand picoTutor picoAcademy`
- `./.venv/bin/python -m pytest tests/api/test_pico_progress_route.py tests/api/test_app_factory.py -q`
- `./.venv/bin/python -m pytest tests/api/test_approvals.py -q`
- Production-style smoke against `/pico`, `/pico/app`, `/pico/onboarding`, and `/pico/tutor`

What failed
- No Pico-specific blocker surfaced.
- Existing repo-wide noise remains: Next/Turbopack NFT warning and pytest OpenTelemetry shutdown spam.

What is next
- `/pico/app`, `/pico/app/lessons/[slug]`, and `/pico/workspace` are removed. Do not bring them back.
- Continue from the canonical files only: `app/pico/*`, `components/pico/*`, `lib/pico/academy.ts`, `lib/pico/tutor.ts`, `src/api/routes/pico.py`, `src/api/services/pico_progress.py`.

### 2026-04-11 02:58:00 CEST — finish pass
What changed
- Added Pico-specific metadata for academy, tutor, autopilot, support, workspace, and lesson pages.
- Fixed academy next-step behavior so `Start lesson` actually opens the lesson instead of just toggling local state.
- Made selected tracks influence the next recommended lesson once the prerequisites are unlocked.
- Hardened support escalation so the contact form resets its default interest correctly and tags support vs office-hours sources honestly.
- Added drill-down links from autopilot live signals into the real MUTX dashboard surfaces.
- Tightened approvals visibility so generic approval requests are no longer listed cross-user by default.
- Fixed tutor link resolution so lesson and support links no longer double-prefix under `/pico`.
- Hardened local/remote progress merge so an empty authenticated account does not wipe meaningful local progress on first sync.

What was tested
- `rm -rf .next && npm run typecheck`
- `npx jest --runInBand tests/unit/picoAcademy.test.ts tests/unit/picoTutor.test.ts`
- `./.venv/bin/python -m pytest tests/api/test_pico_progress_route.py tests/api/test_app_factory.py -q`
- `npm run build`
- Browser smoke on `/pico`, `/pico/app`, `/pico/academy`, `/pico/tutor`, and `/pico/autopilot`
- Interactive tutor smoke for the keepalive question with working lesson/support links

What failed
- No Pico product blocker remains.
- Only existing repo-wide warning noise remains.

What is next
- PicoMUTX v1 is finished enough to ship.
- Future work is post-v1 hardening: durable approvals, real billing, and deeper runtime ingestion.

### 2026-04-11 02:59:52 CEST — truth-alignment validation pass
What changed
- Tightened the product docs so Pico's remaining localization reality is described honestly instead of pretending every locale is fully cleaned up.
- Marked the live landing paths as truthful in `SHIP_CHECKLIST.md` and narrowed the remaining gap to proper full localization.
- Updated `docs/surfaces.md` so `pico.mutx.dev` is listed as a real MUTX surface and removed the stale `components/site/pico/*` source-of-truth claim.

What was tested
- `npm run typecheck`
- `npm test -- tests/unit/picoAcademy.test.ts tests/unit/picoTutor.test.ts`
- `./.venv/bin/python -m pytest tests/api/test_pico_progress_route.py tests/api/test_app_factory.py -q`
- `npm run build:docs-search`
- `npm run build`

What failed
- No Pico-specific blocker failed validation.
- Existing repo-wide warnings remain: Next/Turbopack NFT tracing noise and the OpenTelemetry closed-stream logging noise after pytest shutdown.

What is next
- Commit this truth-alignment slice.
- If we want multilingual polish instead of English fallbacks on the live CTA/contact paths, do a deliberate locale sweep rather than sneaking in half-translated sludge.


### 2026-04-11 03:14:45 CEST — Pico canon enforcement pass
What changed
- Deleted the alternate Pico product routes at `/pico/app`, `/pico/app/lessons/[slug]`, and `/pico/workspace`.
- Collapsed the tutor back to one public contract: `lib/pico/tutor.ts` now exports one canonical reply shape, `/api/pico/tutor` returns that shape directly, and `components/pico/PicoTutorPageClient.tsx` consumes only that shape.
- Updated `DECISIONS.md` and this file so the repo now states the same truth the code enforces.

What was removed
- `app/pico/app/page.tsx`
- `app/pico/app/lessons/[slug]/page.tsx`
- `app/pico/workspace/page.tsx`
- the legacy tutor response lane (`answerPicoTutorQuestion` + `legacy` envelope in `/api/pico/tutor`)

Why
- Redirect shims were still alternate product routes. They kept teaching the repo that Pico had multiple valid entries.
- The tutor had one corpus but two public response contracts. That is architectural drift in a nicer shirt.
- Canonical Pico now means one entry route, one academy/state model, one tutor contract, and one backend progress lane.

What was tested
- `npm run typecheck`
- `npx jest --runInBand tests/unit/picoAcademy.test.ts tests/unit/picoTutor.test.ts`
- `./.venv/bin/python -m pytest tests/api/test_pico_progress_route.py tests/api/test_app_factory.py -q`
- `npm run build`

What failed
- No Pico-specific blocker failed validation.
- Existing repo-wide warning noise remains during build and pytest shutdown.

What is next
- Keep extending Pico only inside `app/pico/*`, `components/pico/*`, `lib/pico/academy.ts`, `lib/pico/tutor.ts`, `src/api/routes/pico.py`, and `src/api/services/pico_progress.py`.
- If another alias, shadow state file, or second tutor contract shows up, delete it instead of negotiating with it.
