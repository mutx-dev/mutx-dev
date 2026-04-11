# EXECUTION_PLAN

## Current phase
Phase 8 loop closure.
- Phases 1-5 are shipped enough for Pico v1: academy, progress, tutor, support, and the live autopilot bridge all exist.
- Phase 8 closes the product loop inside Pico itself: start lesson, deploy starter agent, inspect live state, and control it without bouncing out to dashboard chrome.

## Priorities
1. Keep Pico workspace coherent and truthful.
2. Keep the canonical onboarding entry and live autopilot bridge obvious.
3. Keep validation green and docs honest.
4. Hardening next: localized copy cleanup and durable approvals persistence.

## Active tasks
- [x] Inspect repo and current Pico surfaces
- [x] Create mandatory PicoMUTX docs
- [x] Define academy levels, tracks, and lessons
- [x] Implement local-first progress with auth-backed sync on the existing Pico progress route
- [x] Implement XP, badges, milestones, and unlock logic
- [x] Implement grounded tutor with escalation guardrails
- [x] Implement live autopilot bridge for runs, budgets, alerts, and approvals on existing MUTX surfaces
- [x] Close the in-Pico starter deploy and control loop on top of existing MUTX routes
- [ ] Exercise the authenticated deploy path against a real MUTX session
- [ ] Sweep non-English Pico landing copy so localized surfaces stop lying

## Architecture direction
- Frontend: keep Pico isolated under `app/pico/*` and do not route through desktop/operator onboarding.
- State: local-first browser persistence plus auth-backed sync through the existing `/api/pico/progress` -> `/v1/pico/progress` lane.
- Tutor: deterministic lesson-grounded answers first; model-backed tutor later.
- Autopilot: reuse live MUTX runs, budgets, alerts, and approvals when authenticated; say "offline" when that data is unavailable.
- Billing: internal plan flags only until pricing and payment rails are worth wiring.

## Risks
- Active non-English Pico landing truth now falls back to English on the key CTA/contact surfaces, but proper localization is still incomplete.
- Approval persistence is still backed by the shared in-memory approvals service.
- Existing dashboard/backend surfaces can confuse future implementation if preview/shell routes are treated like shipped product.
- Docs drift remains a repo-wide tax and will bite again if left alone too long.

## Next execution wave
1. Commit the route-truth and public-copy cleanup.
2. Sweep non-English Pico landing copy so every live locale matches the shipped product.
3. Replace the shared in-memory approvals backing with durable persistence.
4. Deepen runtime drill-down and richer control-plane ingestion without adding parallel Pico routes.
5. Wire real billing only after the control loop is durable enough to charge for.
