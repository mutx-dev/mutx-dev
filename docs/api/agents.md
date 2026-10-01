# Agents

The `/v1/agents*` surface covers control-plane CRUD for user-owned agents and runtime-compatible endpoints for agent registration, heartbeats, metrics, logs, commands, status, and version history.

## Routes

| Route | Purpose |
| --- | --- |
| `POST /v1/agents` | Create an agent owned by the authenticated user |
| `GET /v1/agents` | List owned agents |
| `GET /v1/agents/{agent_id}` | Get agent detail including deployments |
| `GET /v1/agents/{agent_id}/config` | Read normalized config and config version |
| `PATCH /v1/agents/{agent_id}/config` | Validate and update config, then bump version |
| `DELETE /v1/agents/{agent_id}` | Delete an owned agent |
| `POST /v1/agents/{agent_id}/deploy` | Agent-scoped deployment intent |
| `POST /v1/agents/{agent_id}/stop` | Record an agent-wide stop intent and target fence |
| `GET /v1/agents/{agent_id}/logs` | List logs for the agent |
| `GET /v1/agents/{agent_id}/metrics` | List metrics for the agent |
| `POST /v1/agents/{agent_id}/resource-usage` | Record token and cost usage |
| `GET /v1/agents/{agent_id}/resource-usage` | List recorded resource usage |
| `GET /v1/agents/{agent_id}/versions` | List agent config versions |
| `POST /v1/agents/{agent_id}/rollback` | Roll back to a prior agent version |
| `POST /v1/agents/register` | Runtime-style agent registration + API key issuance |
| `POST /v1/agents/heartbeat` | Report agent liveness or revision-bound runtime state |
| `POST /v1/agents/metrics` | Report metrics |
| `POST /v1/agents/logs` | Send runtime logs |
| `GET /v1/agents/commands` | Poll pending commands for the authenticated agent |
| `POST /v1/agents/commands/acknowledge` | Acknowledge command completion |
| `GET /v1/agents/{agent_id}/status` | Return runtime status for the authenticated agent |

## Create An Agent

Ownership comes from the authenticated user principal. Do not send `user_id` in
the request body. User JWTs and managed API keys are accepted through Bearer
authentication; managed keys may also use `X-API-Key`.
Creation, config changes, deployment shortcuts, stop, resource writes, rollback,
and deletion require `DEVELOPER` (or `ADMIN`). Owned reads accept `VIEWER` or
`DEVELOPER` (and `ADMIN`).

`config` can be a JSON object or a JSON string. The backend validates it against the selected `type`.

```bash
BASE_URL=http://localhost:8000

curl -X POST "$BASE_URL/v1/agents" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Personal Assistant",
    "description": "Default assistant deployment",
    "type": "openclaw",
    "config": {
      "runtime": "personal_assistant",
      "template": "personal_assistant",
      "workspace": "default",
      "model": "openai/gpt-5",
      "safety_mode": "pairing"
    }
  }'
```

Example response:

```json
{
  "id": "uuid",
  "name": "Personal Assistant",
  "description": "Default assistant deployment",
  "type": "openclaw",
  "status": "creating",
  "desired_action": "create",
  "desired_state": "registered",
  "observed_state": null,
  "target_revision": 1,
  "observed_revision": null,
  "observed_at": null,
  "config": {
    "name": "Personal Assistant",
    "runtime": "personal_assistant",
    "template": "personal_assistant",
    "workspace": "default",
    "model": "openai/gpt-5",
    "safety_mode": "pairing",
    "version": 1
  },
  "config_version": 1,
  "created_at": "2026-03-22T12:00:00Z",
  "updated_at": "2026-03-22T12:00:00Z",
  "user_id": "uuid"
}
```

## Config Validation

Current typed config families:

- `openai`
- `anthropic`
- `langchain`
- `custom`
- `openclaw`

Unknown keys are rejected for typed configs. Successful config patches increment `config_version`.

## Config Response

`GET /v1/agents/{agent_id}/config` returns the agent's normalized config with its current version. The `config` shape matches the agent's `type`:

```json
{
  "agent_id": "uuid",
  "type": "openclaw",
  "config": {
    "runtime": "personal_assistant",
    "template": "personal_assistant",
    "assistant_id": null,
    "workspace": "default",
    "model": "openai/gpt-5",
    "safety_mode": "pairing",
    "version": 1
  },
  "config_version": 1,
  "updated_at": "2026-03-22T12:00:00Z"
}
```

The config shape matches the agent's `type`. An `openclaw` config always includes `runtime`, `template`, `assistant_id`, `workspace`, `model`, and `safety_mode`.

## List And Inspect Agents

```bash
curl "$BASE_URL/v1/agents?skip=0&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/v1/agents/YOUR_AGENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/v1/agents/YOUR_AGENT_ID/config" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Update Config

```bash
curl -X PATCH "$BASE_URL/v1/agents/YOUR_AGENT_ID/config" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "runtime": "personal_assistant",
      "template": "personal_assistant",
      "workspace": "default",
      "model": "openai/gpt-5",
      "safety_mode": "pairing",
      "channels": {
        "terminal": {
          "label": "Terminal",
          "enabled": true,
          "mode": "pairing"
        }
      }
    }
  }'
```

## Deploy, Stop, And Delete

`POST /v1/agents/{agent_id}/deploy` is still mounted, and records a deployment
intent through the same lifecycle owner as [`POST /v1/deployments`](./deployments.md).
Both return a pending deployment; neither response means an executor has started it.

```bash
curl -X POST "$BASE_URL/v1/agents/YOUR_AGENT_ID/deploy" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl -X POST "$BASE_URL/v1/agents/YOUR_AGENT_ID/stop" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl -X DELETE "$BASE_URL/v1/agents/YOUR_AGENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Logs, Metrics, And Resource Usage

```bash
curl "$BASE_URL/v1/agents/YOUR_AGENT_ID/logs?limit=100&level=info" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/v1/agents/YOUR_AGENT_ID/metrics?limit=100" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/v1/agents/YOUR_AGENT_ID/resource-usage?limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Resource usage records accept:

- `prompt_tokens`
- `completion_tokens`
- `total_tokens`
- `api_calls`
- `cost_usd`
- `model`
- `extra_metadata`
- `period_start`
- `period_end`

## Versions And Rollback

```bash
curl "$BASE_URL/v1/agents/YOUR_AGENT_ID/versions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl -X POST "$BASE_URL/v1/agents/YOUR_AGENT_ID/rollback" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"version":1}'
```

## Runtime Registration Notes

`POST /v1/agents/register` is the runtime-facing registration entrypoint.

It returns a runtime payload containing:

- `agent_id`
- `api_key`
- `status`
- `message`
- `desired_action`
- `desired_state`
- `observed_state`
- `target_revision`

Use the OpenAPI snapshot for the exact runtime request and response shapes if you are integrating at that layer.

The returned `mutx_agent_...` key is a Bearer credential for heartbeat, metrics,
logs, command polling/acknowledgement, and runtime status. Those six
agent-authenticated operations do not accept the managed-user `X-API-Key`
header.

The Python runtime client exposes the registration lifecycle fields on its
registered-agent value and `get_status()` returns the agent-key status view.
Heartbeat helpers pass `component`, `deployment_id`, `target_revision`, and
`node_id` only when the caller supplies them; they never fetch a newer revision
and apply it to work they did not perform.

## Lifecycle Evidence

Agent and deployment responses keep the existing `status` vocabulary and add
`desired_action`, `desired_state`, `observed_state`, `target_revision`,
`observed_revision`, and `observed_at`. A request changes desired state and
increments its revision. It does not set a successful runtime status, node ID,
or execution timestamp. Historical rows keep their status and receive no
invented observed state during migration.

An authenticated heartbeat without `deployment_id` refreshes Agent liveness.
It cannot promote an unrelated or newer deployment. To report deployment
evidence, send the exact deployment ID and current target revision:

```json
{
  "agent_id": "agent-uuid",
  "component": "agent_runtime",
  "status": "running",
  "timestamp": "2026-10-01T12:00:00Z",
  "deployment_id": "deployment-uuid",
  "target_revision": 4,
  "node_id": "runtime-node-1"
}
```

`target_revision` without `deployment_id` is Agent-scoped evidence. A standalone
agent can use its current Agent revision to confirm a stop. Agent-scoped evidence
does not confirm any deployment. `component` accepts `agent_runtime` and
`command_listener`; a command-listener heartbeat refreshes liveness only, even
when deployment fields are present. `GET /v1/agents/{agent_id}/status` reports
`uptime_seconds: null` until a runtime uptime measurement is available.

`POST /v1/agents/{agent_id}/stop` responds with `status: "pending"` and the
desired stop revision. It fences active, pending, and ready deployment targets.
The Agent stop completes only after every fenced target reports `stopped` at its
current revision. A target-level action does not clear that fence; an explicit
later deployment create/deploy intent supersedes it.

The `/v1/ingest/agent-status`, `/v1/ingest/deployment`, and `/v1/ingest/metrics`
routes retain submitted data as reported history. Their statuses, node IDs,
errors, and metrics do not refresh the authenticated runtime heartbeat or alter
observed lifecycle state.
