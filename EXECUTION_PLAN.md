# EXECUTION_PLAN

Current phase: Pico progression integrity and feedback
Updated: 2026-04-11T03:29:44Z

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
- Real onboarding/start route tying auth, academy, starter deploy, and control review together.
- In-product starter deploy flow via the real personal_assistant template route.
- Soft plan-flag messaging plus practical tutor gating in Pico control/support.
- Pico-specific unit test coverage for academy, support, control helpers, and state normalization.

## Active tasks
- [completed] Remove remaining shipped Pico waitlist/early-access trust leaks and make the shared shell auth-aware.
- [completed] Unify the shared Pico UI primitives used by the active product shell.
- [completed] Reduce early churn on Start, Lesson, Support, and Control surfaces.
- [completed] Tighten Academy hierarchy so the next lesson dominates the page.
- [completed] Wrap Pico auth routes in the same visual language as the rest of the product.
- [completed] Add explicit control receipts for deploy, threshold, and approval actions.
- [completed] Lock XP to real outcomes only and block obvious repeat farming or payload inflation.
- [completed] Surface level-up moments, unlock receipts, and the next missing milestone across Academy, Lesson, and Control.

## Architecture direction
- Keep Pico on pico.mutx.dev and build only inside the existing app/pico/* route family.
- Reuse existing auth, templates, onboarding, runtime, runs, monitoring, budgets, assistant, and Pico progress routes.
- Persist learner state on the existing UserSetting-backed Pico progress model instead of new tables, migrations, or schemas.
- Do not add new API routes, new entry routes, or a new tutor response shape; extend the canonical contracts only.
- Keep community/admin/billing lightweight and honest; do not fabricate social systems or payment flows.

## Risks
- Existing approvals are in-memory only; treat them as local MVP capability, not durable hosted governance.
- Existing sessions and parts of assistant control are host-local placeholders; avoid building Pico promises on top of them.
- There is no existing tutor API, so grounded support remains deterministic until a real inference path is wired.

## Acceptance for next loop
- Progress only rewards real outcomes.
- Academy and Control both show one obvious next move.
- Progress receipts stay truthful on zero-XP repeat actions.
- Docs remain current after the next implementation pass.
