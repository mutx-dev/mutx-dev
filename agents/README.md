---
title: AI Agent Team for Autonomous Shipping
description: How MUTX structures specialized AI coding agents, ownership boundaries, review gates, and handoffs for safe autonomous software delivery.
keywords:
  - AI agent team
  - autonomous software delivery
  - specialized coding agents
  - multi-agent software workflow
  - autonomous shipping
icon: users
---

# AI Agent Team for Autonomous Shipping

This directory defines the specialized agent team MUTX uses for autonomous shipping.

Instead of one general-purpose coding agent owning the entire repo, MUTX splits work across bounded specialist roles. That keeps responsibilities legible, reduces file overlap, and makes review safer when multiple AI agents are working at once.

This page explains:

* which autonomous agent roles exist
* what each role is responsible for
* how handoffs, approvals, and reviews work
* how the team keeps changes small and auditable

## Agent map

<table data-view="cards"><thead><tr><th>Title</th><th data-card-target data-type="content-ref">Target</th></tr></thead><tbody><tr><td>Mission Control Orchestrator</td><td><a href="mission-control-orchestrator/">mission-control-orchestrator</a></td></tr><tr><td>Control Plane Steward</td><td><a href="control-plane-steward/">control-plane-steward</a></td></tr><tr><td>Operator Surface Builder</td><td><a href="operator-surface-builder/">operator-surface-builder</a></td></tr><tr><td>Auth Identity Guardian</td><td><a href="auth-identity-guardian/">auth-identity-guardian</a></td></tr><tr><td>CLI SDK Contract Keeper</td><td><a href="cli-sdk-contract-keeper/">cli-sdk-contract-keeper</a></td></tr><tr><td>Runtime Protocol Engineer</td><td><a href="runtime-protocol-engineer/">runtime-protocol-engineer</a></td></tr><tr><td>QA Reliability Engineer</td><td><a href="qa-reliability-engineer/">qa-reliability-engineer</a></td></tr><tr><td>Infra Delivery Operator</td><td><a href="infra-delivery-operator/">infra-delivery-operator</a></td></tr><tr><td>Observability SRE</td><td><a href="observability-sre/">observability-sre</a></td></tr><tr><td>Docs Drift Curator</td><td><a href="docs-drift-curator/">docs-drift-curator</a></td></tr></tbody></table>

## Why the team is specialized

This operating model exists to solve common multi-agent failure modes:

* overlapping edits in the same files
* route and contract drift across backend, CLI, and SDK surfaces
* autonomous changes that skip review or validation
* docs and marketing claims that get ahead of what the code really does

By assigning ownership boundaries up front, MUTX can run autonomous work with tighter blast-radius control.

## Core Operating Model

* One orchestrator plans and dispatches work.
* Specialists own bounded file areas and do not overlap without an explicit handoff.
* Every code-writing agent opens a branch and pull request instead of pushing to `main`.
* Every PR requires a second agent reviewer plus CI before merge.
* Low-risk lanes can auto-merge after review; risky lanes stop at staging or require human approval.

## How handoffs work

The intended handoff pattern is simple:

1. The orchestrator scopes the task and assigns ownership.
2. A specialist agent works inside its bounded surface.
3. Validation runs for the files and contracts that agent touched.
4. A second agent reviews the change before merge.
5. Risky actions can move through approval or governance gates rather than bypassing them.

If you are mapping this back to product surfaces, [AI Agent Approvals](/ai-agent-approvals) and [AI Agent Cost Management](/ai-agent-cost) are the closest public pages to the control concepts behind this team model.

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

## Role clusters

The ten specialists break down into a few recurring ownership patterns:

* orchestration and coordination: `mission-control-orchestrator`
* control-plane and runtime work: `control-plane-steward`, `runtime-protocol-engineer`
* interface and operator-facing work: `operator-surface-builder`
* security and identity: `auth-identity-guardian`
* contract integrity: `cli-sdk-contract-keeper`
* validation and reliability: `qa-reliability-engineer`, `observability-sre`
* delivery and documentation: `infra-delivery-operator`, `docs-drift-curator`

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

## Related reading

* [Architecture Overview](/docs/architecture/overview)
* [Deployment Quickstart](/docs/deployment/quickstart)
* [AI Agent Approvals](/ai-agent-approvals)
* [AI Agent Cost Management](/ai-agent-cost)
