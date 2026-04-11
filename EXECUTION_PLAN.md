# EXECUTION_PLAN

## Current phase
Phase 3 moving into Phase 4/5.
- Phase 1 complete enough for action: repo inspected, reuse/dead/drift mapped.
- Phase 2 complete enough for v1: academy, progress, event, and plan-gating models defined.
- Current implementation focus: academy shell, tutor grounding, and autopilot beta.

## Priorities
1. Keep Pico workspace coherent and truthful.
2. Validate the new academy/progress/tutor/autopilot surfaces.
3. Commit the current product slice.
4. Wire live sync into existing MUTX APIs next.

## Active tasks
- [x] Inspect repo and current Pico surfaces
- [x] Create mandatory PicoMUTX docs
- [x] Define academy levels, tracks, and lessons
- [x] Implement persistent browser workspace state
- [x] Implement XP, badges, milestones, and unlock logic
- [x] Implement grounded tutor with escalation guardrails
- [x] Implement manual-first autopilot timeline, alerts, approvals, and export
- [ ] Validate with typecheck and targeted unit tests
- [ ] Commit current slice
- [ ] Start auth-backed sync design

## Architecture direction
- Frontend: keep Pico isolated under `app/pico/*` and do not route through desktop/operator onboarding.
- State: local browser persistence first, because authless onboarding ships sooner than a half-wired account system.
- Tutor: deterministic lesson-grounded answers first; model-backed tutor later.
- Autopilot: manual telemetry first; live control-plane sync later.
- Billing: internal plan flags only until pricing and payment rails are worth wiring.

## Risks
- Browser-local persistence is single-device only. Honest for beta, not enough for GA.
- Manual telemetry is real but not automatic. Must stay clearly labeled until live ingestion lands.
- Existing dashboard/backend surfaces can confuse future implementation if preview/shell routes are treated like shipped product.
- Docs drift remains a repo-wide tax and will bite again if left alone too long.

## Next execution wave
1. Commit the converged multipage Pico slice.
2. Run a fresh production-style smoke pass on the committed Pico routes.
3. Add auth-aware sync from Pico flows into existing dashboard/onboarding/observability routes.
4. Replace manual event entry with live connector ingestion.
5. Cut more stale waitlist/copy residue across non-English locales once the core flow stops moving.
