# Chrome Jobs — Canonical Engineering Fleet

## Principle
Every engineering agent has an assigned Chrome job.

Mission Control owns browser orchestration.
The goal is low-idle verification and dispatch-driven UI/browser work, not random overlap or idle thrash.

## Rules
- Every engineering agent has a staggered browser slot.
- Slots must not overlap.
- Mission Control may activate or suppress a slot based on current dispatches.
- If a lane has no browser-worthy work, the slot should exit quickly with no changes.
- Browser work must stay inside the agent's owned lane.
- Prefer repo/API/file truth first; use Chrome only where it adds signal.

## Slot schedules (Europe/Rome)
- mission-control-orchestrator — `5 8,12,16,20 * * *`
- qa-reliability-engineer — `20 8,12,16,20 * * *`
- cli-sdk-contract-keeper — `35 8,12,16,20 * * *`
- control-plane-steward — `50 8,12,16,20 * * *`
- operator-surface-builder — `5 9,13,17,21 * * *`
- auth-identity-guardian — `20 9,13,17,21 * * *`
- observability-sre — `35 9,13,17,21 * * *`
- infra-delivery-operator — `50 9,13,17,21 * * *`
- runtime-protocol-engineer — `5 10,14,18,22 * * *`
- docs-drift-curator — `20 10,14,18,22 * * *`

## Mission Control responsibility
Mission Control must:
- assign or suppress browser work
- prevent overlap
- cancel stale browser work
- treat browser capacity as scarce and valuable

## Readiness truth
This model is documented and the browser cron layer is now being created. Mission Control still owns actual dispatch-level enforcement.
