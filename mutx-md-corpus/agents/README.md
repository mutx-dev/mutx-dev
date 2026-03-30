---
description: Specialist roles, ownership boundaries, and review-safe autonomous shipping.
icon: users
---

# Autonomous Agent Team

This directory defines the specialized agent team for 24/7 MUTX shipping.

<table data-view="cards"><thead><tr><th>Title</th><th data-card-target data-type="content-ref">Target</th></tr></thead><tbody><tr><td>Mission Control Orchestrator</td><td><a href="mission-control-orchestrator/">mission-control-orchestrator</a></td></tr><tr><td>Control Plane Steward</td><td><a href="control-plane-steward/">control-plane-steward</a></td></tr><tr><td>Operator Surface Builder</td><td><a href="operator-surface-builder/">operator-surface-builder</a></td></tr><tr><td>Auth Identity Guardian</td><td><a href="auth-identity-guardian/">auth-identity-guardian</a></td></tr><tr><td>CLI SDK Contract Keeper</td><td><a href="cli-sdk-contract-keeper/">cli-sdk-contract-keeper</a></td></tr><tr><td>Runtime Protocol Engineer</td><td><a href="runtime-protocol-engineer/">runtime-protocol-engineer</a></td></tr><tr><td>QA Reliability Engineer</td><td><a href="qa-reliability-engineer/">qa-reliability-engineer</a></td></tr><tr><td>Infra Delivery Operator</td><td><a href="infra-delivery-operator/">infra-delivery-operator</a></td></tr><tr><td>Observability SRE</td><td><a href="observability-sre/">observability-sre</a></td></tr><tr><td>Docs Drift Curator</td><td><a href="docs-drift-curator/">docs-drift-curator</a></td></tr></tbody></table>

## Core Operating Model

* One orchestrator plans and dispatches work.
* Specialists own bounded file areas and do not overlap without an explicit handoff.
* Every code-writing agent opens a branch and pull request instead of pushing to `main`.
* Every PR requires a second agent reviewer plus CI before merge.
* Low-risk lanes can auto-merge after review; risky lanes stop at staging or require human approval.

## Team Members

* `mission-control-orchestrator`
* `control-plane-steward`
* `operator-surface-builder`
* `auth-identity-guardian`
* `cli-sdk-contract-keeper`
* `runtime-protocol-engineer`
* `qa-reliability-engineer`
* `infra-delivery-operator`
* `observability-sre`
* `docs-drift-curator`

## Launch Order

1. `mission-control-orchestrator`
2. `qa-reliability-engineer`
3. `cli-sdk-contract-keeper`
4. `control-plane-steward`
5. `operator-surface-builder`
6. `auth-identity-guardian`
7. `observability-sre`
8. `infra-delivery-operator`
9. `runtime-protocol-engineer`
10. `docs-drift-curator`

## Shared Rules

* Trust code over docs when they disagree.
* Prefer the smallest correct change.
* Treat route drift as a bug.
* Do not use `npm run lint` as a required gate until the ESLint setup is repaired.
* Use `npm run build`, Python checks, targeted pytest, and targeted Playwright or infra validation as the real gates.
* If API contracts change, update dependent surfaces in the same workstream or open linked tasks immediately.
