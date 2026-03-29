# MUTX Sales Brief — Operator-Trust POC

## Lead
Do not sell MUTX as "how to build an agent."
Sell it as how a team runs an agent without losing control.

## One-line position
Agent frameworks help teams build agents.
MUTX helps teams deploy, operate, observe, and govern them like production infrastructure.

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
- Faramesh-backed governance is real today — it evaluates whether an action is safe given the prior execution path, not just whether a tool can be called (runtime path evaluation, not tool whitelisting)
- Gartner (March 2026): 50% of AI agent deployments will fail due to insufficient governance platforms, causing a $58B enterprise software shakeup — governance failure is the #1 deployment risk
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
5. **Show governance**
   - `mutx governance status`
   - `mutx governance decisions --limit 50`
   - `mutx governance pending`
   - `mutx governance metrics`
6. **Close on the buyer’s gap**
   - ask whether the real pain is deployment control, observability, governance, or API surface drift
   - map that pain to the proof matrix above

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
Yes. Governance failure is the #1 AI agent deployment risk (Gartner: 50% of deployments will fail due to insufficient governance platforms, $58B shakeup by 2027). MUTX evaluates whether an action is safe given the prior execution path — not just whether a tool can be called. Approval workflow is still CLI-first today; be precise on that.

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
