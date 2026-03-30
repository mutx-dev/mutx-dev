# MUTX + OpenClaw Integration

## Overview

**OpenClaw** is Fortune's agent orchestration layer. MUTX integrates with OpenClaw so that OpenClaw-managed agents can:
1. Register with the MUTX control plane
2. Report status, events, and traces
3. Receive work orders and deployment instructions from MUTX
4. Be governed by MUTX's access control and budgeting

In this relationship:
- **MUTX** = the control plane (deployment, lifecycle, observability, governance)
- **OpenClaw** = the agent runtime provider (spawns agents, manages sessions, runs Codex/Code agents)

## How the Integration Works

```
OpenClaw (agent runtime)
    │
    │  1. Agent registers → POST /v1/agents
    │  2. Agent reports status → POST /v1/events
    │  3. Agent sends traces → POST /v1/runs/{id}/traces
    │  4. Agent polls work orders → GET /v1/runs (or webhook push)
    │
    ▼
FastAPI Control Plane (MUTX)
    │
    │  Stores agent state, events, traces
    │  Enforces ownership, budgets, API key quotas
    │
    ▼
PostgreSQL DB
```

### Agent Registration

When an OpenClaw agent starts, it registers itself with MUTX:

```python
# OpenClaw agent registration (pseudocode)
import httpx

async def register_agent(agent_id: str, name: str, runtime: str):
    response = await httpx.AsyncClient().post(
        f"{MUTX_CONTROL_PLANE_URL}/v1/agents",
        json={
            "name": name,
            "runtime": runtime,      # e.g., "anthropic", "openai"
            "metadata": {
                "openclaw_agent_id": agent_id,
                "provider": "openclaw"
            }
        },
        headers={"Authorization": f"Bearer {OPENCLAW_GATEWAY_TOKEN}"}
    )
    return response.json()
```

### Event Reporting

Agents report lifecycle events (start, stop, error, heartbeat):

```python
async def report_event(agent_id: str, event_type: str, payload: dict):
    await httpx.AsyncClient().post(
        f"{MUTX_CONTROL_PLANE_URL}/v1/events",
        json={
            "agent_id": agent_id,
            "event_type": event_type,  # "start", "stop", "error", "heartbeat"
            "payload": payload
        },
        headers={"Authorization": f"Bearer {OPENCLAW_GATEWAY_TOKEN}"}
    )
```

### Trace Submission

After a run completes, agents submit trace data:

```python
async def submit_traces(run_id: str, traces: list[dict]):
    await httpx.AsyncClient().post(
        f"{MUTX_CONTROL_PLANE_URL}/v1/runs/{run_id}/traces",
        json={"traces": traces},
        headers={"Authorization": f"Bearer {OPENCLAW_GATEWAY_TOKEN}"}
    )
```

### Work Order Polling

Agents poll MUTX for assigned work orders:

```python
async def poll_work_orders(agent_id: str) -> list[dict]:
    response = await httpx.AsyncClient().get(
        f"{MUTX_CONTROL_PLANE_URL}/v1/runs",
        params={"agent_id": agent_id, "status": "pending"},
        headers={"Authorization": f"Bearer {OPENCLAW_GATEWAY_TOKEN}"}
    )
    return response.json()["runs"]
```

Alternatively, MUTX can push work orders via webhook to OpenClaw (see Webhooks section).

---

## Control-Plane API Endpoints for OpenClaw Agents

### Authentication

Agents authenticate using an API key or JWT token issued by MUTX:

```bash
# Get a token
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "agent@example.com", "password": "..."}'

# Or use an API key
curl -H "X-API-Key: <api-key>" http://localhost:8000/v1/agents
```

### Agent Management

```
POST   /v1/agents                    — Register a new agent
GET    /v1/agents/{id}                — Get agent details
PATCH  /v1/agents/{id}               — Update agent status
DELETE /v1/agents/{id}               — Deregister agent
```

### Events

```
POST   /v1/events                     — Report an event
GET    /v1/events?agent_id=<id>       — Query agent events
```

Event types:
- `agent.started` — agent has started
- `agent.stopped` — agent has stopped
- `agent.error` — agent encountered an error
- `agent.heartbeat` — periodic heartbeat
- `run.started` — a run has started
- `run.completed` — a run has completed
- `run.failed` — a run has failed

### Runs

```
POST   /v1/runs                       — Create a run (work order)
GET    /v1/runs                       — List runs (filter by agent_id, status)
GET    /v1/runs/{id}                  — Get run details
POST   /v1/runs/{id}/traces          — Submit traces for a run
```

### Monitoring

```
GET    /v1/monitoring/alerts          — Get active alerts
GET    /v1/monitoring/health         — Health check
```

---

## Configuring a New Agent with MUTX

### 1. Register the Agent Type

Before spawning agents, register the agent type in MUTX:

```bash
curl -X POST http://localhost:8000/v1/agents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "codex-coder",
    "runtime": "openai",
    "metadata": {
      "provider": "openclaw",
      "capabilities": ["code-generation", "code-review"],
      "model": "gpt-4o"
    }
  }'
```

### 2. Create an API Key for the Agent

```bash
curl -X POST http://localhost:8000/v1/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "codex-coder-key",
    "scopes": ["agents:read", "agents:write", "runs:write", "events:write"],
    "agent_id": "<agent-id>"
  }'
```

### 3. Configure OpenClaw to Use MUTX

In your OpenClaw agent configuration:

```yaml
# openclaw-agent.yaml
mutx:
  control_plane_url: http://localhost:8000
  api_key: <generated-api-key>

agent:
  name: codex-coder
  runtime: openai
  model: gpt-4o

work_order:
  poll_interval_seconds: 30
  max_concurrent_runs: 3

reporting:
  heartbeat_interval_seconds: 60
  trace_on_completion: true
```

### 4. Environment Variables

On the machine running the OpenClaw agent:

```bash
export MUTX_CONTROL_PLANE_URL=http://localhost:8000
export MUTX_API_KEY=<your-api-key>
export OPENAI_API_KEY=<your-openai-key>
# Optional: OpenClaw gateway
export OPENCLAW_GATEWAY_URL=<gateway-url>
export OPENCLAW_GATEWAY_TOKEN=<gateway-token>
```

### 5. Verify Connectivity

```bash
# From the agent machine
curl -H "X-API-Key: $MUTX_API_KEY" \
     http://localhost:8000/v1/monitoring/health

# Should return: {"status": "ok", ...}
```

---

## OpenClaw → MUTX Webhook Integration

MUTX can push work orders to OpenClaw via webhook instead of agents polling:

```bash
# Register a webhook in MUTX
curl -X POST http://localhost:8000/v1/webhooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-openclaw-gateway.com/webhooks/mutx",
    "events": ["run.created"],
    "secret": "<webhook-secret>"
  }'
```

OpenClaw receives the webhook and dispatches the run to the appropriate agent.

Webhook payload example:

```json
{
  "event": "run.created",
  "timestamp": "2026-03-24T10:00:00Z",
  "data": {
    "run_id": "run_abc123",
    "agent_id": "agent_xyz",
    "input": {"task": "fix issue #117"},
    "priority": "normal"
  }
}
```

---

## OpenClaw Agent Runtime Adapter

MUTX's runtime adapters (`control-plane/src/runtime/adapters/`) handle the actual agent execution:

| Adapter | Provider | Status |
|---------|----------|--------|
| `anthropic.py` | Anthropic (Claude) | Active |
| `openai.py` | OpenAI (GPT-4) | Active |
| `openclauw.py` | OpenClaw gateway | Active |

To add a new runtime adapter:

1. Create `control-plane/src/runtime/adapters/<name>.py`
2. Implement the `AgentRuntime` interface
3. Register in `control-plane/src/runtime/registry.py`

---

## Known Integration Issues

### SDK Async Contract (`#114`)

`MutxAsyncClient` is not fully async — some methods are sync wrappers. Agents using the async client should either:
- Use `MutxClient` (sync) for reliability
- Only `await` methods confirmed truly async (test with `pytest` first)

### Monitoring Wiring (`#39`)

Alert → self-healer wiring is scaffolded but not fully production-wired. Agents should still implement their own heartbeat and self-check logic until `#39` is resolved.

### Bootstrap Scripts (`#115`)

Local bootstrap scripts may reference old root-level Docker Compose path. Use `infrastructure/docker/docker-compose.yml` explicitly.
