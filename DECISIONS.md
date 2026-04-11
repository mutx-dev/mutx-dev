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

## 2026-04-11 02:51:43 CEST
Decision: `/pico/onboarding` is the canonical Pico workspace entry. `/pico/app` and `/pico/workspace` are compatibility redirects only.
Why:
- The product promise starts with onboarding, not a vague app shell.
- One visible entry route beats split-route confusion.
