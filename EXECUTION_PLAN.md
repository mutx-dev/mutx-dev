# EXECUTION_PLAN

Current phase: Phase 3 -> Academy shell with foundation in place
Updated: 2026-04-11T00:55:00Z

## Goal
Ship the narrowest honest PicoMUTX product loop that gets a user from signup to first agent launch to visible control.

## Priority order
1. Foundation data and state
2. Academy shell and lesson content
3. Progress and XP
4. Tutor grounding
5. Autopilot shell over real MUTX data
6. Plan gating
7. Polish and ship

## Completed in this cycle
- Mandatory state/docs spine.
- Pico progress persistence backed by user_settings.
- Pico academy dashboard and lesson pages.
- Pico control page backed by assistant, runs, alerts, budget, runtime, and approvals data.
- Grounded tutor/support page tied to the lesson corpus.
- Pico auth entry routes for login/register.
- In-product starter deploy flow via the real personal_assistant template route.
- Soft plan-flag messaging in Pico control.

## Active tasks
- [in_progress] Commit and handoff this foundation slice.
- [pending] Turn soft plan messaging into stronger enforceable limits where the underlying behavior already exists.
- [pending] Add admin/content-ops capture for tutor content gaps.
- [pending] Expand the control page from summary to richer run drill-down where the data is already real.

## Architecture direction
- Keep Pico on pico.mutx.dev and build product routes under app/pico/*.
- Reuse existing auth, templates, onboarding, runtime, runs, monitoring, budgets, and assistant routes.
- Persist Pico-specific learner state in UserSetting records instead of new tables or migrations.
- Keep community/admin/billing lightweight and honest; do not fabricate social systems or payment flows.

## Risks
- Existing approvals are in-memory only; treat them as local MVP capability, not durable hosted governance.
- Existing sessions and parts of assistant control are host-local placeholders; avoid building Pico promises on top of them.
- There is no existing tutor API, so grounded support remains deterministic until a real inference path is wired.

## Acceptance for next loop
- New files committed.
- One deploy path added inside Pico.
- Soft plan gating visible in product.
- Docs remain current after the next implementation pass.
