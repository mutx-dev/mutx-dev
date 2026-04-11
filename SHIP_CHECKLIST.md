# SHIP_CHECKLIST

## Product truth blockers
- [x] Approval gate can be enabled from Pico, not just described
- [x] A sample approval request can be created from Pico and resolved from Pico
- [x] Lesson `add-an-approval-gate` maps cleanly to the live product flow
- [x] Support request counting reflects real submissions, not modal opens
- [ ] Duplicate `lib/pico/autopilot.ts` drift is removed or explicitly justified

## Academy readiness
- [x] Academy dashboard exists
- [x] 7 levels exist in code
- [x] 5 tracks exist in code
- [x] 12 lessons exist in code
- [x] Progress persists locally
- [x] Progress sync path exists for authenticated users
- [ ] Lesson completion feels honest enough for public ship everywhere, not just in the approval flow
- [x] Onboarding CTA targets stay coherent across clean/install-done/first-run-done states
- [x] Completed-track copy avoids restart confusion

## Tutor readiness
- [x] Tutor is grounded in lesson corpus
- [x] Tutor escalates risky topics
- [x] Tutor UI surfaces alternate grounded lesson matches

## Support shell readiness
- [x] Human escalation surface exists
- [x] Office-hours path exists
- [x] Support counting semantics are based on successful submit
- [ ] Interest taxonomy could still be tightened later

## Autopilot readiness
- [x] Run visibility exists
- [x] Budget visibility exists
- [x] Alert visibility exists
- [x] Approval queue visibility exists
- [x] Approve/reject actions exist
- [x] Approval gate bootstrap exists end-to-end
- [x] Approval milestone updates are exercised through the live flow
- [ ] Manual browser pass still needed

## Validation gates
- [x] `git diff --check` on touched files
- [x] `npm run typecheck`
- [x] `npm test -- tests/unit/picoAcademy.test.ts tests/unit/picoTutor.test.ts tests/unit/picoAutopilot.test.ts`
- [x] `npm run build`
- [ ] Manual sanity pass on `/pico/onboarding`, `/pico/academy`, `/pico/tutor`, `/pico/support`, `/pico/autopilot`

## Launch copy checks
- [ ] No placeholder copy on public Pico screens
- [x] No fake supported features in the touched Pico slice
- [x] No vague community fluff pretending to be value in the touched Pico slice
- [x] User now gets clearer next steps across onboarding, tutor, support, and approvals

## Public ship rule
Do not call PicoMUTX shipped until the academy promise and the control promise meet in one honest loop and survive a browser smoke pass.
