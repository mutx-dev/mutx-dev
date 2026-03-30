# MUTX Architecture

## System Overview

MUTX is structured as a layered control plane for AI agent orchestration:

```
┌─────────────────────────────────────────────────────┐
│                  Operator (You)                      │
│         CLI / SDK / Dashboard / OpenClaw            │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/JWT
┌──────────────────────▼──────────────────────────────┐
│              FastAPI Control Plane                     │
│         (control-plane/)  — /v1/* routes             │
│  Auth │ Agents │ Deployments │ Runs │ Monitoring       │
└───────┬──────────┬──────────┬─────────┬──────────────┘
        │          │          │         │
┌───────▼──┐  ┌────▼────┐ ┌───▼────┐ ┌──▼────────┐
│ PostgreSQL│  │Runtime  │ │Webhook │ │ Event/    │
│    DB     │  │Adapters │ │Notifier│ │ Trace     │
└───────────┘  │(Anthropic│ └────────┘ │ Store     │
               │ OpenAI) │            └───────────┘
               └─────────┘
```

## How the Layers Fit Together

### Control Plane (`control-plane/`)

The FastAPI server is the core of MUTX. It exposes the `/v1/*` public API and enforces:
- **JWT authentication** on all protected routes
- **Ownership filtering** — agents are scoped to the authenticated user
- **Deployment lifecycle** — create, restart, pause, resume agents
- **Run orchestration** — execute agent runs with tracing
- **Observability** — events, traces, monitoring alerts, metrics

**Entry point:** `control-plane/src/main.py` (or `control-plane/` as a package).

**Run locally:**
```bash
make dev          # Full stack (includes API server)
# or
cd control-plane && uvicorn src.main:app --reload --port 8000
```

### CLI (`cli/`)

The operator CLI is installed with `pip install -e cli/`. It wraps the Python SDK and provides:

- `mutx agents list` — list agents
- `mutx deploy create` — create a deployment
- `mutx runs start` — start a run
- `mutx doctor` — verify local setup

The CLI is a thin client over the `/v1/*` API. It does not run agents itself.

**Note:** The CLI surface lags the backend API. See `#117` (deployment surface parity drift).

### SDK (`sdk/`)

The Python SDK (`mutx` package) exposes typed Python wrappers around the API:

```python
from mutx import MutxClient, MutxAsyncClient

# Sync client
client = MutxClient(base_url="http://localhost:8000", token="...")

# Async client (partially async — some methods are sync wrappers)
async_client = MutxAsyncClient(base_url="http://localhost:8000", token="...")
```

**Known issue:** `MutxAsyncClient` is not fully async — some methods call sync `httpx` methods without awaiting. See `#114`.

### Frontend (`app/`)

The Next.js frontend provides the operator dashboard at `/dashboard/*`:

- `/dashboard` — canonical operator landing
- `/dashboard/agents` — agent management
- `/dashboard/deployments` — deployment lifecycle
- `/dashboard/monitoring` — live alerts and runtime health
- `/dashboard/runs` — run history and traces
- `/dashboard/webhooks` — webhook management
- `/dashboard/api-keys` — API key management

The frontend proxies API calls through Next.js API routes (`app/api/`) to avoid CORS and attach auth.

**Legacy routing:** `/app/*` routes redirect to `/dashboard/*` via `middleware.ts`. Use canonical `/dashboard/*` routes.

### Agents (`agents/`)

Agent templates and runtime adapters. Runtimes (Anthropic, OpenAI, etc.) live in `control-plane/src/runtime/adapters/`.

### Infrastructure (`infrastructure/`)

- `infrastructure/docker/docker-compose.yml` — local dev stack (PostgreSQL, API server, optional frontend)
- `infrastructure/terraform/` — cloud deployment (VPS, cloud)
- `infrastructure/helm/` — Kubernetes deployment (in progress)

---

## OpenClaw as Agent Runtime Provider

OpenClaw is the runtime provider that MUTX integrates with. When OpenClaw agents need to register, report status, or receive work orders, they call MUTX's control-plane API.

See `references/openclaw-integration.md` for the full integration contract.

---

## Key API Routes

### Authentication

```
POST /v1/auth/register   — Register a new user
POST /v1/auth/login     — Login, receive JWT token
POST /v1/auth/refresh    — Refresh an expired token
```

JWT tokens are signed with HS256. Pass as `Authorization: Bearer <token>` on all protected routes.

### Agents

```
GET    /v1/agents              — List agents (ownership-filtered)
POST   /v1/agents              — Create an agent
GET    /v1/agents/{id}         — Get agent details
PATCH  /v1/agents/{id}         — Update an agent
DELETE /v1/agents/{id}         — Delete an agent
```

### Deployments

```
GET    /v1/deployments                      — List deployments
POST   /v1/deployments                       — Create a deployment
GET    /v1/deployments/{id}                  — Get deployment details
POST   /v1/deployments/{id}/restart          — Restart a deployment
POST   /v1/deployments/{id}/pause            — Pause a deployment
POST   /v1/deployments/{id}/resume           — Resume a deployment
GET    /v1/deployments/{id}/logs             — Get deployment logs
GET    /v1/deployments/{id}/metrics          — Get deployment metrics
GET    /v1/deployments/{id}/events           — Get deployment events
```

### Runs

```
GET    /v1/runs               — List runs
POST   /v1/runs               — Create a run
GET    /v1/runs/{id}          — Get run details
GET    /v1/runs/{id}/traces   — Get run traces
```

### Monitoring

```
GET    /v1/monitoring/alerts          — Get active alerts
GET    /v1/monitoring/health         — Control plane health check
GET    /v1/events                     — Event stream
```

### Webhooks & API Keys

```
GET/POST   /v1/webhooks    — List/create webhooks
GET/DELETE /v1/webhooks/{id}
GET/POST   /v1/api-keys    — List/create API keys
DELETE     /v1/api-keys/{id}
```

---

## Auth System

MUTX uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login** → receive access token + refresh token
2. **Access token** — short-lived, used for API calls (15 min default)
3. **Refresh token** — longer-lived, used to get new access tokens

```python
# SDK usage
client = MutxClient(base_url="http://localhost:8000", token="eyJ...")

# Direct API
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/v1/agents
```

Ownership is enforced at the API layer — agents are filtered by the `user_id` claim in the JWT.

**Test auth token:**
```bash
make test-auth   # Prints a test user JWT
```

---

## Observability Stack

- **Events** — structured event log at `GET /v1/events`
- **Traces** — per-run trace data at `GET /v1/runs/{id}/traces`
- **Alerts** — active alert list at `GET /v1/monitoring/alerts`
- **Logs** — deployment logs at `GET /v1/deployments/{id}/logs`
- **Metrics** — deployment metrics at `GET /v1/deployments/{id}/metrics`

The monitoring dashboard (`/dashboard/monitoring`) surfaces these. Runtime-to-alert wiring is still being completed — see `#39`.
