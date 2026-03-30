# LANDING PAGE MESSAGE STACK - MUTX

## Positioning Anchor
MUTX is the production control plane for AI agents.

Category claim: dashboards observe agent sessions; MUTX controls agent systems.

## Hero Options
1. Deploy agents like services. Operate them like systems.
2. The control plane for AI agents in production.
3. Agents are infrastructure. Run them like it.
4. Stop babysitting agent demos. Start operating agent systems.
5. From prompt workflows to production-grade agent operations.
6. Mission control UX. Real control-plane semantics.
7. Not another agent dashboard. The layer that runs the stack.
8. Build agents once. Govern them for real.

## Subhead Options
1. MUTX gives teams durable deployment records, ownership boundaries, API key governance, webhook contracts, and operator-grade health/readiness flows.
2. Most teams can prototype an agent; few can run one reliably. MUTX provides the operational layer: deploy, observe, govern, and recover.
3. FastAPI control plane + SDK + CLI + operator app shell, all aligned to the same resource model: agents, deployments, runs, traces, keys, and webhooks.
4. Dashboards show what happened. MUTX defines what is allowed, what is running, who owns it, and how to fix it.
5. Open source, infrastructure-aware, and built for real runtime constraints instead of demo theater.
6. Two paths to production: create a new OpenClaw-backed deployment or link an existing workspace under MUTX governance.
7. Agents get deployments, not just sessions. Operations get budgets and policies, not just logs.
8. Deployments, rollbacks, key rotation, readiness checks, and operator workflows in one coherent control layer.

## Section-By-Section Copy Blocks

### 1) Hero (above the fold)
Headline:
Deploy agents like services. Operate them like systems.

Body:
MUTX is the open-source control plane for AI agents. It is built for teams that need deployment semantics, ownership guarantees, and governance workflows - not just a session view.

Primary CTA:
Open the App

Secondary CTA:
Run Local Demo (`npm run demo:validate`)

Tertiary CTA:
Read the Architecture

### 2) Problem (category framing)
Section title:
The Demo Is Not The Product

Body:
Most agent projects do not fail because the model is weak. They fail because the operating layer is weak: unclear ownership, implicit deployments, secret sprawl, and observability that cannot drive action. Agent software breaks after first contact with production reality.

### 3) Thesis (category definition)
Section title:
Control Plane, Not Session Dashboard

Body:
MUTX treats agents as infrastructure. That means explicit resources, durable state, lifecycle controls, and contracts across every surface: API, CLI, SDK, app, and docs. The goal is not prettier monitoring. The goal is operational trust.

### 4) Capability Pillars (technical core)
Section title:
What MUTX Actually Controls

Pillar A - Lifecycle:
Model agents and deployments as first-class resources with status, version, region, replicas, and event history.

Pillar B - Governance:
Use auth, ownership, API key lifecycle (create/rotate/revoke), and webhook contracts as core product behavior.

Pillar C - Operator Execution:
Run through app.mutx.dev, automate through CLI/SDK, and keep health/readiness/debug loops explicit.

### 5) Product Differentiation (vs dashboards)
Section title:
Where Dashboards Stop, MUTX Starts

Body:
Session dashboards answer "what is happening now?" MUTX answers "how is this deployed, governed, and recoverable over time?" The dashboard is one surface. The control plane, API contracts, CLI, and SDK are equally primary.

### 6) OpenClaw Integration (bridge section)
Section title:
OpenClaw Compatibility Without Product Drift

Body:
MUTX supports two operator paths:
- create a new OpenClaw-backed deployment managed by MUTX lifecycle semantics
- link an existing OpenClaw workspace and bring it under MUTX governance

This keeps OpenClaw as a first-class runtime option without collapsing MUTX into a session-only ontology.

### 7) Proof and Trust (credibility strip)
Section title:
Shipped Surface, Not Speculative Slides

Body:
Live control-plane route groups, app-shell auth/data proxies, health/readiness endpoints, and reproducible local bootstrap are already documented and wired. MUTX is explicit about what is live now and what is still being hardened.

### 8) CTA Close (conversion)
Section title:
Operate Your Agents Like Production Systems

Body:
If your agents need to survive beyond a demo, you need a control layer that is explicit, testable, and governed. Start with MUTX.

Primary CTA:
Launch app.mutx.dev

Secondary CTA:
Deploy or Link OpenClaw Runtime

Tertiary CTA:
Read docs.mutx.dev

## Comparison Bullets (MUTX vs Mission Control / Dashboards)
- Mission Control and dashboard-class tools optimize for session visibility; MUTX optimizes for lifecycle control.
- Dashboards center tasks/chat/activity; MUTX centers agents/deployments/runs/traces/governance.
- Dashboards are usually UI-first; MUTX is contract-first (FastAPI + CLI + SDK + app shell).
- Dashboards show logs; MUTX binds logs to owned resources and operational actions.
- Dashboards answer "what happened"; MUTX answers "who owns this, how it is deployed, and how it is recovered."
- Dashboard semantics often stop at observation; MUTX includes key lifecycle operations (rotate/revoke, deploy/restart, readiness checks).
- Mission Control can be harvested for UX shell patterns; MUTX remains deployment-first and governance-first.
- MUTX differentiators called out in product docs: budgets, rollback, webhooks, run traces, and infra-aware multi-tenant direction.

## Proof Points From Docs
- MUTX states explicit category intent: "open-source control plane for AI agents" and "deploy, operate, govern" language in [README.md](/Users/fortune/.openclaw/workspace/README.md).
- Whitepaper identifies concrete live route families: `/auth`, `/agents`, `/deployments`, `/api-keys`, `/webhooks`, `/health`, `/ready` in [whitepaper.md](/Users/fortune/.openclaw/workspace/whitepaper.md).
- Whitepaper documents first-class API key behavior (prefixed keys, hashed storage, create/list/revoke/rotate) in [whitepaper.md](/Users/fortune/.openclaw/workspace/whitepaper.md).
- App surface docs confirm browser proxy routes for auth and dashboard reads in [docs/app-dashboard.md](/Users/fortune/.openclaw/workspace/docs/app-dashboard.md).
- Docs explicitly frame `mutx.dev` vs `docs.mutx.dev` vs `app.mutx.dev` role split in [docs/overview.md](/Users/fortune/.openclaw/workspace/docs/overview.md).
- Recovery packet provides explicit category split against Mission Control and session dashboards in [MUTX-RECOVERY-PACKET.md](/Users/fortune/.openclaw/workspace/MUTX-RECOVERY-PACKET.md).
- Recovery packet and executive plan define OpenClaw dual entry paths (new deployment vs link workspace) in [README.md](/Users/fortune/.openclaw/workspace/README.md) and [MUTX RECOVERY PACKET/01_EXECUTIVE_PLAN.md](/Users/fortune/.openclaw/workspace/MUTX%20RECOVERY%20PACKET/01_EXECUTIVE_PLAN.md).
- Docs and README show reproducible bootstrap and validation path (`./scripts/dev.sh`, `npm run demo:validate`) in [README.md](/Users/fortune/.openclaw/workspace/README.md).
- Status docs expose publicly checkable endpoints (`/health`, `/ready`, app/docs/site URLs) in [docs/changelog-status.md](/Users/fortune/.openclaw/workspace/docs/changelog-status.md).
- Manifesto anchors long-term category: operational trust over demo wrappers in [manifesto.md](/Users/fortune/.openclaw/workspace/manifesto.md).

## Strongest CTA Language
1. Deploy or link your first runtime in under 10 minutes.
2. Launch the operator app and inspect real deployments now.
3. Stop watching sessions. Start governing agent systems.
4. Run the local stack and validate health/readiness in one command.
5. Use the control plane your production agents actually need.
6. Move from demo agent to governed deployment.
7. Create an API key, ship a deployment, and verify readiness today.
8. Adopt the control layer before scale makes drift expensive.

## 10 Killer Lines
1. Agents get deployments, not just sessions.
2. Operational trust is the product.
3. Dashboards observe; control planes decide.
4. The hard part is not the model. It is everything after the demo.
5. MUTX is where agent infrastructure becomes legible.
6. If you cannot answer ownership, lifecycle, and recovery, you do not have a platform.
7. Not a wrapper around model calls - a control layer for runtime systems.
8. The dashboard is one surface. API, CLI, and SDK are first-class.
9. From token generation to governed execution.
10. Deploy agents like services. Operate them like systems.

## Best 5 Lines (Shortlist)
1. Deploy agents like services. Operate them like systems.
2. Dashboards observe; control planes decide.
3. Agents get deployments, not just sessions.
4. Operational trust is the product.
5. The hard part is not the model. It is everything after the demo.

## Page Structure Recommendation
1. Hero + CTA cluster (app/demo/docs)
2. Problem framing: post-demo failure modes
3. Category thesis: control plane vs dashboard
4. Capability pillars: lifecycle, governance, operator execution
5. Comparison strip: MUTX vs Mission Control/dashboards
6. Proof strip: concrete endpoints, surfaces, and bootstrap evidence
7. OpenClaw entry paths: deploy new or link existing
8. Final conversion block with action CTAs
