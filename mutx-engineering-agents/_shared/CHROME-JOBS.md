# Chrome Jobs — Canonical Engineering Fleet

## Principle
Browser/Chrome work is a **shared constrained resource**, not a free-for-all.

Mission Control owns browser orchestration.
Specialists may use browser lanes only when:
- the task genuinely needs browser verification or UI interaction
- the task is inside their owned lane
- the slot is assigned in advance or explicitly dispatched

## Rules
- No overlapping Chrome jobs across engineering agents.
- One browser slot = one active engineering lane at a time.
- Browser jobs should be staggered.
- Browser work should be brief, goal-driven, and tied to a dispatch.
- Do not keep Chrome alive just to simulate activity.
- Prefer file/repo/API truth first; use browser only when it adds signal.

## Browser-capable engineering agents
- mission-control-orchestrator
- qa-reliability-engineer
- control-plane-steward
- operator-surface-builder
- auth-identity-guardian
- observability-sre
- infra-delivery-operator
- docs-drift-curator

## Default non-browser lanes unless dispatched
- cli-sdk-contract-keeper
- runtime-protocol-engineer

## Slot schedule (Europe/Rome)
These are engineering browser windows, not guaranteed always-on jobs.

1. 08:05 — mission-control-orchestrator
2. 08:20 — qa-reliability-engineer
3. 08:35 — cli-sdk-contract-keeper
4. 08:50 — control-plane-steward
5. 09:05 — operator-surface-builder
6. 09:20 — auth-identity-guardian
7. 09:35 — observability-sre
8. 09:50 — infra-delivery-operator
9. 10:05 — runtime-protocol-engineer
10. 10:20 — docs-drift-curator

Repeat the same stagger pattern every 4 hours during active windows if needed.

## Mission Control responsibility
Mission Control must:
- assign or suppress browser work
- prevent overlap
- keep browser jobs tied to current dispatches
- cancel stale browser work
- treat browser capacity as scarce and valuable

## Readiness truth
As of 2026-03-28, this model is now documented, but not yet fully enforced by a central browser-slot scheduler.
That means the orchestration logic is defined, but not fully automated yet.
