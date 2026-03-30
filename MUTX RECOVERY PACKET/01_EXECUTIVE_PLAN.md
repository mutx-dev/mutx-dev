# Executive Plan — MUTX as Brain, Mission Control as Skin

## Thesis

Mission Control is already a credible, fast-moving open-source operator dashboard.
MUTX still makes sense when it is treated as the deeper control plane for production AI agents.

So the move is not:
- clone Mission Control feature-for-feature
- or abandon MUTX backend depth

The move is:
- **harvest the operator cockpit**
- **bind it to MUTX's FastAPI/control-plane contracts**
- **surface the things Mission Control does not own well**

## Product split

### Mission Control is strongest at
- app shell / panelized operator cockpit
- first-run UX
- live activity / monitoring feel
- single-pane operational ergonomics
- local-first / self-hosted friendliness

### MUTX is strongest at
- FastAPI control-plane architecture
- explicit resource model: agents, deployments, runs, traces, API keys, webhooks, usage, swarms
- heavier infra story: PostgreSQL/Redis/pgvector, Terraform/Ansible, tenant VPCs, Tailscale, Vault/BYOK
- governance and automation surfaces
- CLI/SDK + backend parity as a real moat if contract drift is fixed

## What to preserve

Do **not** bend MUTX into a task/session ontology.

MUTX stays:
- deployment-first
- run/trace-first
- governance-first
- infra-aware

Mission Control gets harvested for:
- shell
- panel system
- onboarding/doctor patterns
- realtime operator ergonomics
- installation/hardening ideas

## 3-part strategy

### Part 1 — Stabilize what already exists
- prove current dashboard entrypoints and API routes
- eliminate dead/duplicate dashboard artifacts
- tighten empty states, homepage positioning, and readiness flows
- close contract drift between backend, CLI, SDK, and docs

### Part 2 — Fork the cockpit
- port Mission Control shell/panel UX into a dedicated MUTX operator branch
- keep a compatibility adapter layer between UI and FastAPI
- do not port SQLite/Next API/backend assumptions into MUTX core

### Part 3 — Differentiate hard
- deployments and rollback
- runs and traces
- API-key lifecycle and governance
- tenant/network controls
- webhooks and automation
- budgets and usage policy
- OpenClaw integration as a managed runtime option, not accidental coupling

## First 14 days

### Days 1–3
- audit actual shipped dashboard entrypoints
- heal PR queue enough to reduce branch chaos
- freeze new backend route families
- define adapter contracts for UI → FastAPI

### Days 4–7
- fork Mission Control shell
- wire overview, navigation, health/status, and onboarding flows
- map auth/session expectations
- create “new OpenClaw deployment” and “link existing OpenClaw workspace” entry flows

### Days 8–14
- wire deployments/runs/traces/API-keys/webhooks into the new shell
- add doctor/readiness workflow
- produce one clean end-to-end demo path
- publish a release note that reframes MUTX clearly

## Definition of success

A new operator should be able to:
1. open `/app`
2. understand what MUTX is in under 30 seconds
3. create or connect an OpenClaw-backed runtime
4. see agents/deployments/health immediately
5. inspect runs, traces, keys, and webhooks
6. trust that MUTX is the control plane, not just a dashboard
