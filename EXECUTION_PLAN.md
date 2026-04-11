# EXECUTION_PLAN

## Current phase
Phase 7 truth hardening.

The product already has the needed surfaces.
The job now is to keep the Pico loop honest, obvious, and tight.

## What just landed
- Approval gate bootstrap inside Autopilot
- Direct lesson-to-control linkage for `add-an-approval-gate`
- Better onboarding and academy CTA coherence
- Better tutor alternate-match surfacing
- Support submit counting fixed to real success instead of modal opens

## Current priorities
1. Browser-smoke the updated Pico loop
2. Remove duplicate helper drift (`lib/pico/autopilot.ts`) if truly unused
3. Tighten lesson completion honesty where validation is still too implicit
4. Keep docs synced with code truth

## Active tasks
- [x] Create/update mandatory Pico operating docs
- [x] Wire approval gate bootstrap into Autopilot
- [x] Tie lesson `add-an-approval-gate` to the live product path
- [x] Fix support submit counting semantics
- [x] Fix onboarding/academy/tutor truth gaps touched in this slice
- [ ] Browser-smoke updated Pico surfaces
- [ ] Remove or justify duplicate legacy helper `lib/pico/autopilot.ts`

## Acceptance gates for next commit
- `git diff --check`
- `npm run typecheck`
- `npm test -- tests/unit/picoAcademy.test.ts tests/unit/picoTutor.test.ts tests/unit/picoAutopilot.test.ts`
- `npm run build`
- Manual pass on `/pico/onboarding`, `/pico/academy`, `/pico/tutor`, `/pico/support`, `/pico/autopilot`

## Risks
- Green unit/build checks can still miss browser-level copy or navigation regressions.
- Duplicate helper surfaces are still a drift risk until `lib/pico/autopilot.ts` is settled.
- Lesson completion remains somewhat trust-based in places outside the approval flow.

## Definition of success for the next cycle
- Browser-smoke confirms the updated Pico loop is coherent.
- Duplicate helper drift is reduced.
- No docs claim anything the product cannot now do.
