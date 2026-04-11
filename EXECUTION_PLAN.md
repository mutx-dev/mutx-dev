# EXECUTION_PLAN

## Current phase
Phase 7 truth hardening through simplification.

The product already has the necessary surfaces.
The job now is to make them feel inevitable instead of sprawling.

## Priorities
1. Keep the first-time path obvious.
2. Delete duplicate concepts before adding anything else.
3. Keep Pico self-contained and readable.
4. Keep validation green and docs honest.

## Active tasks
- [x] Tighten activation around the first working agent
- [x] Harden trust-critical Autopilot surfaces
- [x] Simplify vocabulary across the active Pico UI
- [x] Collapse support overlap into tutor + human help
- [ ] Browser-smoke simplified tutor and human-help flows
- [ ] Sweep remaining copy for unnecessary product nouns

## Current simplification rules
- Use `track`, never `lane`.
- Use `Start building` / `Start`, not `workspace`, unless the route name itself requires it.
- Use `Tutor` for grounded in-product help.
- Use `Human help` for escalation.
- If a section duplicates another section's job, merge it or kill it.

## Risks
- Broader `/dashboard/*` pages still look like secondary surfaces, not trustworthy Pico drill-downs.
- Dirty tree changes outside the simplification slice can reintroduce complexity by accident.
- Copy drift is still the fastest way to make Pico feel bigger and less clear than it is.

## Acceptance gates for the next simplification commit
- `npm run typecheck`
- `npm test -- tests/unit/picoAcademy.test.ts tests/unit/picoTutor.test.ts`
- `npm run build`

## Definition of success
- A new user can tell where to start in one glance.
- A blocked user can tell the difference between tutor and human help in one glance.
- The product sounds like one system, not five overlapping ones.
