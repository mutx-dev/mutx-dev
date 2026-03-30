# Implementation Roadmap — Fast Shipping Version

## Guiding rules

- Reuse before rewriting
- One adapter layer between harvested UI and MUTX APIs
- No backend rewrites
- No ontology drift from `agent/deployment/run/trace` into `task/session` as MUTX's primary product model
- Every copied component must end up in one of: `wired`, `adapted`, `removed`

---

## Phase 0 — Stabilize and freeze drift (1–2 days)

### 0.1 Freeze speculative backend expansion
Stop adding:
- new route families
- new orchestration nouns
- new infra abstractions

Until these are clean:
- `/api/dashboard/*`
- `/api/api-keys`
- deployments
- runs/traces
- webhooks
- CLI/SDK contract parity

### 0.2 Create a source-of-truth matrix
Build a simple table:

| Surface | Current Source of Truth | Notes |
|---|---|---|
| Agents | FastAPI route + dashboard client | verify payloads |
| Deployments | FastAPI route + dashboard client | verify restart/scale/rollback semantics |
| API keys | FastAPI route + app client | verify rotate/revoke |
| Webhooks | FastAPI route | verify delivery history |
| Runs | FastAPI route | verify detail page existence |
| Traces | FastAPI route | verify explorer/detail path |
| Monitoring | FastAPI route | verify health + readiness + logs/metrics |
| OpenClaw link flow | define if missing | make first-class |

### 0.3 Fix contract drift
Audit and patch:
- `/v1` drift
- stale user_id assumptions
- CLI flags that don’t match backend behavior
- SDK sync/async mismatches
- docs that describe obsolete routes

Ship this before more UI ambition.

---

## Phase 1 — Establish the adapter seam (1–2 days)

Create a dedicated adapter layer.

## Directory proposal

```text
app/
components/
lib/
  mc-adapters/
    types.ts
    auth.ts
    overview.ts
    agents.ts
    deployments.ts
    runs.ts
    traces.ts
    apiKeys.ts
    webhooks.ts
    monitoring.ts
```

## Adapter responsibilities

Each adapter should:
- call existing MUTX route(s)
- normalize shape for harvested Mission Control components
- keep names neutral where possible
- avoid leaking Mission Control backend assumptions into FastAPI

### Example pattern

```ts
// lib/mc-adapters/overview.ts
export async function getOperatorOverview(): Promise<OperatorOverview> {
  const [health, agents, deployments, keys] = await Promise.all([
    fetchJson('/api/dashboard/health'),
    fetchJson('/api/dashboard/agents'),
    fetchJson('/api/dashboard/deployments'),
    fetchJson('/api/api-keys'),
  ])

  return {
    agentCount: agents.length,
    runningAgents: agents.filter(a => a.status === 'running').length,
    deploymentCount: deployments.length,
    healthyDeployments: deployments.filter(d => ['running', 'healthy'].includes(d.status)).length,
    activeApiKeys: keys.filter(k => k.is_active).length,
    healthStatus: health.status,
  }
}
```

### Why this matters
This lets you adopt their shell without contorting your backend.

---

## Phase 2 — Harvest the operator shell (3–5 days)

## Copy first

Prioritize these directories/files from Mission Control:

### Highest-value shell
- `src/app` route shell ideas
- `src/components/layout`
- `src/components/dashboard`
- `src/components/onboarding`
- `src/components/ui`
- `src/store/index.ts` as a reference for state topology, not a drop-in source of truth

### Realtime/operator plumbing
- websocket/event helpers
- smart polling hooks
- event bus patterns
- browser-security/CSP helpers
- loading/error/empty-state patterns

## Do not import wholesale
Do **not** adopt as core:
- SQLite/db bindings
- schema.sql
- Next API route internals as source of truth
- OpenClaw-coupled backend runtime files as MUTX backend

## Concrete port sequence

### 2.1 Navigation + shell
Ship:
- sidebar
- top bar
- panel container
- breadcrumbs
- empty/loading/error primitives

### 2.2 Overview page
Map overview cards to:
- `/api/dashboard/health`
- `/api/dashboard/agents`
- `/api/dashboard/deployments`
- `/api/api-keys`

### 2.3 Onboarding/doctor
Create a MUTX-native first-run flow:
- login/register
- backend reachable?
- auth works?
- agents exist?
- deployments exist?
- API key exists?
- OpenClaw runtime linked or creatable?

### 2.4 Operator flows
Bring over:
- health indicators
- action banners
- alerts/notifications patterns
- status badges and detail panels

---

## Phase 3 — OpenClaw-first runtime integration (2–4 days)

OpenClaw should be first-class, but explicit.

## Required entry paths

### Path A — New OpenClaw-backed deployment
User can:
- choose a template/runtime
- create deployment
- see created agent/deployment resources
- view health + logs + runs

### Path B — Link existing local OpenClaw workspace
User can:
- point MUTX at an existing workspace/runtime
- register/link it
- discover agents/sessions/workspace metadata
- manage it under MUTX control-plane semantics

## Needed implementation pieces

- `OpenClawIntegrationCard` on first-run / dashboard
- `LinkWorkspaceModal`
- `CreateOpenClawDeploymentModal`
- runtime adapter service in backend if not already cleanly exposed
- explicit labels:
  - New OpenClaw deployment
  - Link existing OpenClaw workspace
  - MUTX-managed lifecycle / governance

---

## Phase 4 — Differentiate the real MUTX moat (4–7 days)

Once shell credibility exists, surface the deeper layer.

## 4.1 Deployments
Ship clearly:
- deployment list
- deployment detail
- restart / scale / rollback
- version history
- event timeline

## 4.2 Runs and traces
This is where MUTX stops looking like “just a dashboard”.
Ship:
- run history
- run inspector
- trace explorer
- trace detail
- link from deployment/agent → run → trace

## 4.3 API-key governance
Turn this into a visible advantage:
- named keys
- scopes/products
- rotate/revoke
- one-time reveal
- expiry handling
- audit surface if available

## 4.4 Webhooks and automation
Ship:
- webhook list
- delivery history
- retry flow
- signing details
- example payload docs

## 4.5 Budgets/usage
Only if backend semantics are real enough now:
- budget list/detail
- usage thresholds
- alert states
- per-agent/deployment views

---

## Phase 5 — Release and proof (2 days)

## Release target
One release that proves:
- shell feels real
- dashboard reads live data
- OpenClaw onboarding exists
- deployments/runs/traces/API keys/webhooks are visible
- homepage/readme clearly frame MUTX

## Demo script
Make one operator journey work end-to-end:
1. login
2. create or link OpenClaw runtime
3. see agents/deployments
4. inspect health
5. create/rotate API key
6. inspect run
7. inspect trace
8. show webhook status

## Shipping best practices
- one PR per vertical slice
- screenshots/video in every PR
- no “UI only” PR without route binding status
- changelog entry for user-visible change
- freeze main during cut-over merge window
