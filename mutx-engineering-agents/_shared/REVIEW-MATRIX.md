# Review Matrix

## Reviewer defaults
- control-plane-steward -> qa-reliability-engineer
- operator-surface-builder -> qa-reliability-engineer
- auth-identity-guardian -> qa-reliability-engineer
- cli-sdk-contract-keeper -> docs-drift-curator
- runtime-protocol-engineer -> cli-sdk-contract-keeper
- observability-sre -> infra-delivery-operator
- infra-delivery-operator -> observability-sre
- docs-drift-curator -> qa-reliability-engineer
- qa-reliability-engineer -> mission-control-orchestrator

## Rules
- No self-review.
- Reviewer should leave approval or bounded change request.
- CI must be green before merge.
