# DECISIONS

## 2026-04-10 23:24:08Z
Decision: PicoMUTX v1 will ship as a narrow browser-persistent workspace under `pico.mutx.dev/workspace` instead of trying to reuse the existing desktop/operator onboarding stack.
Why:
- `/onboarding` is not Pico onboarding. It is desktop/operator setup.
- Shipping a truthful web-native loop now beats pretending the desktop path is a customer product.

Decision: Start with local persistence instead of blocking on auth-backed sync.
Why:
- A beta product that users can actually enter is worth more than an elegant auth plan with no shipped loop.
- Existing dashboard APIs require auth and are better used later for optional sync.

Decision: Tutor will be deterministic and lesson-grounded first.
Why:
- No model credentials are present in the environment right now.
- A grounded rules/retrieval tutor is more honest than an ungrounded model wrapper.

Decision: Autopilot v1 will be manual-first.
Why:
- The current backend control-plane has reusable observability pieces, but approvals/policies are fragmented and not trustworthy enough to anchor the first Pico UX.
- Manual run logging, budget thresholds, alerts, approvals, and audit export are enough to teach the control loop without faking live telemetry.

Decision: Keep plan flags internal and default the beta workspace to Starter.
Why:
- Starter is the smallest tier that makes the manual autopilot useful.
- Billing is not worth wiring before the academy/control loop earns the right to exist.

Decision: Remove `/pico` from the mutx.dev sitemap and fix Pico canonical truth to the pico subdomain.
Why:
- The old sitemap and canonical pointed to a marketing-host path that the router actively blocked. That was sloppy and wrong.
