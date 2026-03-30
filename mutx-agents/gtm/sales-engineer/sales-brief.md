# MUTX Sales Brief - Operator-Trust POC

## Lead
Do not sell MUTX as "how to build an agent."
Sell it as how a team runs agents - plural - without losing control.

## One-line position
Agent frameworks help teams build agents.
MUTX is the control plane: the agent proposes, MUTX decides.

## Positioning for multi-agent buyers
"One agent is a workflow. Five agents are an organization."
The jump from single-agent to multi-agent is not a tooling problem - it is a governance problem.
Who resolves state conflicts between agents? What is the escalation path when two agents reach incompatible outputs?
MUTX provides the arbitration layer: durable runtime records, decision logs, and enforcement across all agents in the fleet - not per-agent, not ad hoc.

## Best-fit buyer
- already has agent code, pilots, or an internal prototype
- feels pain around deployment ownership, secrets, tracing, approvals, or surface drift
- wants an operator layer, not another prompt builder

## What we can prove now
### Supported operator lane
- `app.mutx.dev/dashboard` is the supported browser shell for stable routes, backed by live same-origin dashboard proxies
- the CLI is real and covers setup, auth, assistants, agents, deployments, runtime inspection, and governance
- governance approval flows are CLI-first today; do not imply a dashboard approval UI
- the macOS app is a supported operator surface for local operators

### Proof matrix
| Buyer question | Proof surface | What we should show |
| --- | --- | --- |
| Can this run an agent like production infra? | `/dashboard`, CLI, docs | deployment records, runs/traces, sessions, budgets, monitoring |
| Can we operate it without lying about gaps? | `/dashboard` + CLI | supported vs preview boundaries, CLI fallbacks where UI is thin, no fake dashboard parity |
| Can we govern risky work? | `mutx governance status`, `mutx governance decisions --limit 50`, `mutx governance pending`, `mutx governance metrics` | runtime path evaluation (not tool whitelisting), permit / deny / defer decisions, pending approvals, Prometheus metrics, CLI-first approval path |
| Can we keep the runtime honest? | `mutx runtime inspect openclaw` | durable runtime tracking instead of ad hoc local state |
| Is the SDK story truthful? | `sdk/README.md` | `MutxAsyncClient` is deprecated and limited; use `MutxClient` for production code |
| Why does this gap matter at scale? | Cisco/RSAC 2026 data | 85% pilot → 5% production. The bottleneck is governance readiness, not AI capability. Buyers who feel this gap will nod immediately |

### Durable control-plane primitives
- auth
- agents and deployments
- runs and traces
- sessions
- budgets and monitoring
- API keys
- webhooks
- health and readiness

### Governance story
- Faramesh-backed governance is real today - it evaluates whether an action is safe given the prior execution path, not just whether a tool can be called (runtime path evaluation, not tool whitelisting)
- Gartner (March 2026): 50% of AI agent deployments will fail due to insufficient governance platforms, causing a $58B enterprise software shakeup - governance failure is the #1 deployment risk
- Cisco/RSAC 2026 data: 85% of AI agents reach pilot stage; only 5% reach production. The bottleneck is not AI capability or enthusiasm - it is governance and security readiness. MUTX closes that gap by making the runtime accountable before production
- MergeShield ($70M raise): per-agent trust scoring and risk-proportional rules are the emerging mechanism language for enterprise governance
- policy decisions are permit / deny / defer
- operators can inspect decisions, pending approvals, and metrics from the CLI
- approval workflows remain CLI-first; the dashboard should not be positioned as the approval surface yet

## 20-minute demo spine
1. **Open with the truth boundary**
   - state that `/dashboard` is supported and `/control/*` is preview
   - say some workflows stay CLI/API-first by design
2. **Setup the operator lane**
   - `mutx setup hosted` or `mutx setup local`
   - `mutx doctor`
   - `mutx assistant overview`
3. **Show runtime tracking**
   - `mutx runtime inspect openclaw`
   - explain the durable runtime record
4. **Show the stable browser surface**
   - use `app.mutx.dev/dashboard` for overview, agents, deployments, runs, traces, sessions, budgets, monitoring, API keys, and webhooks
5. **Show governance - single-agent first, then escalate**
   - `mutx governance status`
   - `mutx governance decisions --limit 50`
   - `mutx governance pending`
   - `mutx governance metrics`
   - frame it: "This is what it looks like when the agent proposes and the control plane decides. The agent cannot skip this layer."
6. **Close on the buyer's actual problem**
   - if single-agent: deployment control, observability, or secrets - map to proof matrix above
   - if multi-agent: state conflict, escalation paths, fleet-wide audit - frame MUTX as the arbitration layer
   - ask which problem they are solving today

## POC success criteria
A good POC ends with the buyer able to say:
- we can onboard an operator and deploy an assistant without hand-wavy setup
- we can inspect agent state from both dashboard and CLI
- we can trace runs, sessions, budgets, and monitoring data as operator artifacts
- we understand which surfaces are supported and which are still preview
- if governance matters, we can see a real decision path instead of a policy slide

## What not to promise
- full dashboard coverage for every backend capability
- dashboard-only operation for every workflow
- production-ready scheduler or RAG proof
- full async SDK parity
- governance approval UX in the dashboard
- credential broker UI

## Objection handling
### "We already use LangChain / OpenClaw / n8n."
Good. MUTX does not need to replace the framework.
The value is the control plane around the agent: deployment records, runtime inspection, observability, governance, API keys, webhooks, and operator surfaces.

### "Is this just a demo?"
No. `/dashboard` is the supported operator lane. `/control/*` is the preview demo lane.
That distinction is a trust signal, not a weakness.

### "Can my team stay entirely in the UI?"
Not for every workflow yet.
Stable dashboard routes are real, but some operator tasks are still better in CLI or direct API.

### "Can you govern risky actions?"
Yes. Governance failure is the #1 AI agent deployment risk (Gartner: 50% of deployments will fail due to insufficient governance platforms, $58B shakeup by 2027). Cisco/RSAC 2026 data confirms the bottleneck: 85% of agents reach pilot but only 5% reach production — the gap is governance readiness, not AI capability. MUTX evaluates whether an action is safe given the prior execution path — not just whether a tool can be called. The agent proposes. MUTX decides. Approval workflow is still CLI-first today; be precise on that.

### "We run multiple agents - is this the same problem at scale?"
Single-agent governance and multi-agent governance are different problems. Single-agent: can this tool be called safely? Multi-agent: who arbitrates when two agents reach incompatible outputs? Who defines the escalation path?
MUTX provides fleet-wide decision logs and enforcement - not just per-agent controls.

### "How is this different from IntentBound / IBA?"
IntentBound is a named competitor with patent GB2603013.0 and institutional positioning. MUTX differentiation: open governance hooks, CLI-first evidence path, and operator-first UX rather than procurement-layer positioning. If a buyer mentions IBA specifically, flag it as a competitive signal internally.

### "We already looked at Baton / Palantir Foundry."
Baton solves agent team coordination through phase gates (planning → execution → review → approval). MUTX evaluates whether an action is safe given the prior execution path - not just which phase the team is in. Faramesh's runtime path evaluation is deterministic policy enforcement, not workflow routing.
Palantir Foundry requires the Foundry stack. MUTX is agent-framework-agnostic and operator-first. If a buyer is already Palantir-committed, MUTX may not displace that - but for teams that want agent governance without the enterprise platform lock-in, MUTX is the accessible alternative.

### "Palantir is already in our stack - why add another agent governance tool?"
MUTX is not a replacement for Palantir. It is agent-framework-agnostic and CLI-first - designed to layer on top of any agent stack without requiring the Foundry platform. If the buyer's agents run outside Foundry or if they need a lighter operator surface, MUTX fills that gap without displacing existing investments.

## Competitive landscape (live)
| Player | What they claim | MUTX differentiation |
|---|---|---|
| **IntentBound (IBA)** | Patent GB2603013.0, NIST/NCCoE filings, sub-5ms validation - "The Authorization Layer for High-Stakes AI" | Open governance hooks, CLI-first evidence path, operator-first UX - not procurement-layer positioning |
| **Baton** | Control plane for AI agent teams with clean baton passes between planning/execution/review/approval; works with Claude Code, Codex, Gemini | MUTX's enforcement is runtime-path-based, not phase-gate-based; Faramesh provides deterministic evaluation not just workflow routing |
| **Palantir Foundry (now GA)** | Enterprise incumbent shipping agent governance and observability as platform feature | MUTX is agent-framework-agnostic and operator-first; Palantir requires the Foundry stack; MUTX is the accessible alternative for non-Pantair shops |

## Best current call-to-action
If you already have an agent that kind of works, MUTX is the lane to prove it can be operated, observed, and governed without lying about the gaps.

## Source anchors
- `mutx-md-corpus/docs/overview.md`
- `mutx-md-corpus/docs/app-dashboard.md`
- `mutx-md-corpus/docs/surfaces.md`
- `mutx-md-corpus/docs/project-status.md`
- `mutx-md-corpus/docs/cli.md`
- `mutx-md-corpus/docs/deployment/quickstart.md`
- `mutx-md-corpus/docs/governance.md`
- `mutx-md-corpus/docs/releases/v1.3.md`
- `mutx-md-corpus/docs/adr/006-agent-runtime-architecture.md`
- `mutx-md-corpus/whitepaper.md`
