# DECISIONS

## 2026-04-10 23:24:08Z
Decision: PicoMUTX v1 ships inside the canonical Pico surface under `pico.mutx.dev`, not the desktop/operator onboarding stack.
Why:
- Shipping a truthful web-native loop beats pretending the desktop path is a customer product.
- Pico gets one product shell and one route family.

Decision: Pico progress is local-first but syncs through the existing Pico progress route when a MUTX session exists.
Why:
- A beta product still needs zero-friction entry.
- Auth-backed sync is useful, but only as an extension of the shipped progress model, not a fork.

Decision: Tutor will be deterministic and lesson-grounded first.
Why:
- No model credentials are present in the environment right now.
- A grounded rules/retrieval tutor is more honest than an ungrounded model wrapper.

Decision: Autopilot v1 reuses live MUTX runs, budgets, alerts, and approvals when authenticated, and says so when the session is missing.
Why:
- Real signals beat manual theatre.
- If live data is unavailable, the product should surface that gap instead of faking a dashboard.

Decision: Keep plan flags internal and default the beta workspace to Starter.
Why:
- Starter is the smallest tier that makes the live autopilot bridge useful.
- Billing is not worth wiring before the academy/control loop earns the right to exist.

Decision: Remove `/pico` from the mutx.dev sitemap and fix Pico canonical truth to the pico subdomain.
Why:
- The old sitemap and canonical pointed to a marketing-host path that the router actively blocked. That was sloppy and wrong.

## 2026-04-11 03:17:32 CEST
Decision: Pico Autopilot stays brutally literal: only live MUTX runs, traces, alerts, budgets, usage, approvals, and timeline events belong on the trust surface.
Why:
- A control layer stops being useful the second it starts decorating the truth with fake counters or sandbox theater.
- If a signal is missing, the surface should say it is missing instead of manufacturing comfort.

## 2026-04-11 03:45:10 CEST
Decision: Pico Autopilot no longer links trust-critical users into broken or untrusted secondary dashboard pages.
Why:
- A dead drill-down link instantly makes the whole surface feel like demo bait.
- A smaller self-contained truth surface beats a bigger broken one.

Decision: Approval requests now persist on the existing `user_settings` table instead of only living in process memory.
Why:
- An approval queue that disappears on restart is fake governance.
- Durable approval history is table stakes if we want users to trust the gate.

Decision: Budget attribution prefers `event_metadata.agent_id` over raw `resource_id` when usage events came from runs.
Why:
- Showing run UUIDs as if they were agents is garbage accounting.
- Cost tracking must map to the thing the user thinks they are paying for.

Decision: Pico activation defaults to the `first-agent` lane until the first real run is done.
Why:
- Asking users to choose among multiple lanes before the first win is fake optionality.
- The shortest honest path is install -> first prompt -> visible answer.

Decision: Opening the first two lesson pages should auto-start the lesson and speak in concrete success language.
Why:
- A separate `Start lesson` click before reading instructions is useless friction.
- `Holy shit, it works` is clearer than abstract completion theater when the product is trying to earn trust fast.

## 2026-04-11 02:51:43 CEST
Decision: `/pico/onboarding` is the canonical Pico workspace entry.
Why:
- The product promise starts with onboarding, not a vague app shell.
- One visible entry route beats split-route confusion.

## 2026-04-11 03:05:40 CEST
Decision: delete the last legacy Pico route aliases instead of carrying redirect theater.
Why:
- `/pico/app`, `/pico/workspace`, and `/pico/app/lessons/[slug]` kept a second route family alive for no current user value.
- The canonical Pico truth is simpler when the repo only ships one workspace entry and one lesson family.
- No active Pico UI paths depend on those aliases anymore.

Decision: collapse the Pico tutor API to one reply envelope.
Why:
- Returning both legacy and reply shapes kept a duplicate tutor contract alive.
- The tutor should speak one product language from `lib/pico/tutor.ts` through the UI.

## 2026-04-11 01:01:56 UTC
Decision: `components/pico/*` is the only Pico frontend system. `components/site/pico/*` is absorbed and dead.
Why:
- A second Pico component tree is how the product starts lying about where truth lives.
- Public landing, contact, footer, and locale switching are still Pico product concerns, so they belong under the canonical Pico component system.

Decision: Reject parallel locale churn unless it is validated and intentionally merged.
Why:
- Bad translation churn creates a second public truth.
- English-first truth is better than multilingual nonsense.
