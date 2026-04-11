# PRODUCT_STATE

## Current truth
- Timestamp: 2026-04-11T02:31:09Z
- Product: PicoMUTX
- Mission: get a user from zero to one production agent they trust.
- Current emphasis: activation-first academy plus honest control.

## What exists
- Public Pico landing at `app/pico/page.tsx`.
- Onboarding at `app/pico/onboarding/page.tsx`.
- Academy at `app/pico/academy/*` backed by `lib/pico/academy.ts`.
- Tutor at `app/pico/tutor/page.tsx` grounded by `lib/pico/tutor.ts`.
- Human help at `app/pico/support/page.tsx`.
- Autopilot at `app/pico/autopilot/page.tsx` backed by live MUTX signals.
- Progress persistence through:
  - `components/pico/usePicoProgress.ts`
  - `app/api/pico/progress/route.ts`
  - `src/api/routes/pico.py`
  - `src/api/services/pico_progress.py`
- Approval proxy path through:
  - `app/api/pico/approvals/*`
  - `src/api/routes/approvals.py`

## What changed in this cycle
- Created the mandatory Pico operating docs and reset them to source truth.
- Wired an honest approval-gate bootstrap path into Autopilot.
- Added a sample approval-request creator using the existing Pico approvals API.
- Persisted approval gate state and tracked request ids through Pico progress.
- Auto-complete path now exists for lesson `add-an-approval-gate` when a tracked request is resolved.
- Approval lesson now deep-links into the live Autopilot approvals setup.
- Onboarding and academy CTA drift got cleaned up.
- Tutor now surfaces alternate grounded lesson matches instead of hiding them.
- Support requests now count on successful form submit, not modal open.

## What is now true
- Approval gate is no longer just described in lesson copy. Pico can enable it locally, create a sample request, and resolve it through the queue.
- The activation path is more coherent across onboarding and academy completion states.
- Tutor and human-help roles are cleaner.

## What is still messy
- `lib/pico/autopilot.ts` remains a candidate delete because live helper truth sits in `components/pico/picoAutopilot.ts`.
- Manual browser smoke still has not been run on the updated Pico surfaces.
- Some repo-wide warning noise still appears in unrelated Jest/build output.

## Ship-now assessment
- Honest status: Pico now has a credible first full loop.
- Biggest improvement this cycle: the approval lesson and the control surface finally meet in one real path.
- Remaining risk: browser-level UX regressions can still hide behind green unit/build checks.

## Ship next
1. Browser-smoke `/pico/onboarding`, `/pico/academy`, `/pico/tutor`, `/pico/support`, `/pico/autopilot`.
2. Delete or justify `lib/pico/autopilot.ts`.
3. Keep tightening lesson-completion honesty where it still feels too click-to-complete.

## Cycle log
### 2026-04-11T02:03:18Z START
- Inspected Pico routes, progress sync, tutor grounding, support shell, Autopilot helpers, and approvals APIs.
- Confirmed mandatory Pico operating docs needed to be reset to source truth.
- Picked approval-gate bootstrap as the highest-leverage slice.

### 2026-04-11T02:31:09Z END
- Implemented approval-gate bootstrap inside Pico Autopilot.
- Fixed onboarding/academy/tutor/support truth gaps in the same pass.
- Validated with `git diff --check`, `npm run typecheck`, `npm test -- tests/unit/picoAcademy.test.ts tests/unit/picoTutor.test.ts tests/unit/picoAutopilot.test.ts`, and `npm run build`.
- Next: browser smoke and remaining drift cleanup.
