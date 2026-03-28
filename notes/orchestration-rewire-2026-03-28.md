# MUTX orchestration rewire — 2026-03-28

## What changed
- Added a shared MUTX business-fleet async roundtable loop:
  - `mutx-agents/_shared/ROUNDTABLE-LOOP.md`
  - `mutx-agents/_shared/CONTEXT-REGISTRY.md`
  - `mutx-agents/reports/roundtable.md`
- Added engineering-fleet context registry:
  - `mutx-engineering-agents/_shared/CONTEXT-REGISTRY.md`
- Patched all promoted MUTX business `BOOTSTRAP.md` files to include the shared context registry + roundtable files.
- Patched all promoted engineering `BOOTSTRAP.md` files to include the engineering context registry + `AGENT-TO-AGENT-LOOP.md`.

## Live OpenClaw cron rewiring
### Business / control / GTM
- Rewrote the live cron prompts for the promoted MUTX fleet to be leaner and more role-specific.
- Reduced redundant file rereads by leaning on `BOOTSTRAP.md` + a small number of shared briefs.
- Removed routine memory-file writes from most specialist lanes; only cross-lane synthesis/reporting lanes still mention durable-memory writes.
- Kept public X execution jobs unchanged to avoid destabilizing a live public-output surface.

### Outside-in fix
- Registered a real OpenClaw agent: `outside-in-intelligence`.
- Rewired `MUTX Outside-In Intelligence v1` off the wrong `social-media-strategist` agent id and onto `outside-in-intelligence`.

### Engineering fleet efficiency changes
- Rewrote engineering cron prompts around a low-idle loop:
  - review first
  - bounded dispatch second
  - fast exit with `NO_REPLY` if idle
- Aligned the core engineering cron schedules with the intended staggered registry cadence:
  - mission-control -> `5,25,45 * * * *`
  - qa -> `12 */2 * * *`
  - cli-sdk -> `18 */2 * * *`
  - control-plane -> `24 */2 * * *`
  - operator-surface -> `30 */2 * * *`
  - auth -> `36 */4 * * *`
  - observability -> `42 */2 * * *`
  - infra -> `48 */4 * * *`
  - runtime -> `54 */2 * * *`
  - docs -> `0 */4 * * *`
- Downshifted PR watcher to `15,45 * * * *`.
- Kept chrome-slot cadence intact but shortened the prompts.

## Validation
### OpenClaw
- Verified cron inventory still shows `39` enabled jobs.
- Verified key rewires:
  - `MUTX Outside-In Intelligence v1` -> `agentId=outside-in-intelligence`
  - `MUTX Eng Mission Control Orchestrator v1` -> `5,25,45 * * * *`
  - `ENG PR Watcher — mission-control-orchestrator` -> `15,45 * * * *`
- Manual runs enqueued cleanly for:
  - `MUTX Project Shepherd v1`
  - `ENG PR Watcher — mission-control-orchestrator`

### Hermes shadow test
- Hermes cron control surface works inside the isolated eval home.
- Created and removed a shadow cron job successfully.
- Hermes cron list reports no jobs after cleanup.
- Hermes gateway is intentionally not running in the eval home, so jobs will not fire automatically there until a real cutover path exists.

## Current shape
This is now a leaner async roundtable architecture:
- outside-in -> signal brief
- specialists -> local bounded briefs
- project shepherd -> shared roundtable synthesis
- report distribution -> executive daily brief
- engineering mission control -> dispatch/review/merge control loop

## What I intentionally did not do
- No live Hermes cutover.
- No Discord/gateway handoff.
- No public X-job rewiring.
- No attempt at “always busy” token burn; the new rule is low-idle truthfulness, not constant motion.
