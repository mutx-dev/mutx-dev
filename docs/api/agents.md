# Agents API

The agents routes manage agent records, deployments, logs, and metrics.

Runtime-facing agent endpoints such as heartbeat, command polling, log submission, and `GET /agents/{agent_id}/status` use the agent API key as a bearer token. Control-plane users should use the standard `GET /agents/{agent_id}` route instead.

## Current Implementation Notes

- Routes are mounted at `/agents`, not `/v1/agents`.
- `POST /agents` derives ownership from the authenticated user instead of accepting `user_id` in the request body.
- `config` is currently modeled as a string field, so JSON config should be sent as a string payload.
- Auth dependencies are attached to these route handlers, so agent operations require authenticated control-plane access.

## Routes

| Route | Purpose |
|------|---------|
| `POST /agents` | Create an agent record |
| `GET /agents` | List agents |
| `GET /agents/{agent_id}` | Get one agent with deployments |
| `GET /agents/{agent_id}/status` | Get runtime status for the authenticated agent |
| `DELETE /agents/{agent_id}` | Delete an agent |
| `POST /agents/{agent_id}/deploy` | Create a deployment record and mark the agent running (legacy agent-centric path) |
| `POST /agents/{agent_id}/stop` | Stop active deployments for an agent |
| `GET /agents/{agent_id}/logs` | List agent logs |
| `GET /agents/{agent_id}/metrics` | List agent metrics |

## Create an Agent

Authenticate first, then create the agent without sending a `user_id`.

```bash
BASE_URL=http://localhost:8000

curl -X POST "$BASE_URL/agents" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support Bot",
    "description": "Handles inbound support tasks",
    "config": "{\"model\":\"gpt-4\"}"
  }'
```

Example response:

```json
{
  "id": "uuid",
  "name": "Support Bot",
  "description": "Handles inbound support tasks",
  "status": "creating",
  "config": "{\"model\":\"gpt-4\"}",
  "created_at": "2026-03-08T10:00:00Z",
  "updated_at": "2026-03-08T10:00:00Z",
  "user_id": "uuid"
}
```

## List Agents

```bash
curl "$BASE_URL/agents?limit=10&skip=0"
```

Optional filters:

- `skip`
- `limit`
- `user_id`

## Get an Agent

```bash
curl "$BASE_URL/agents/YOUR_AGENT_ID"
```

The detail response includes a `deployments` array.

## Get Runtime Status

This runtime endpoint is only for the authenticated agent itself.

```bash
curl "$BASE_URL/agents/YOUR_AGENT_ID/status" \
  -H "Authorization: Bearer YOUR_AGENT_API_KEY"
```

If the bearer token belongs to a different agent, the API returns `403 Agent ID mismatch`.

## Deploy an Agent

Use the canonical deployments surface for new control-plane integrations:

```bash
curl -X POST "$BASE_URL/deployments"   -H "Content-Type: application/json"   -d '{"agent_id": "YOUR_AGENT_ID", "replicas": 1}'
```

Example response:

```json
{
  "id": "uuid",
  "agent_id": "uuid",
  "status": "pending",
  "replicas": 1,
  "node_id": null,
  "started_at": "2026-03-08T10:00:00Z",
  "ended_at": null,
  "error_message": null,
  "events": [
    {
      "id": "uuid",
      "deployment_id": "uuid",
      "event_type": "create",
      "status": "pending",
      "node_id": null,
      "error_message": null,
      "created_at": "2026-03-08T10:00:00Z"
    }
  ]
}
```

The legacy agent-centric route remains available for live/demo parity:

```bash
curl -X POST "$BASE_URL/agents/YOUR_AGENT_ID/deploy"
```

That route returns a lightweight payload with `deployment_id` and `status`.

## Stop an Agent

```bash
curl -X POST "$BASE_URL/agents/YOUR_AGENT_ID/stop"
```

## Agent Logs

```bash
curl "$BASE_URL/agents/YOUR_AGENT_ID/logs?limit=50&skip=0"
curl "$BASE_URL/agents/YOUR_AGENT_ID/logs?limit=50&level=error"
```

## Agent Metrics

```bash
curl "$BASE_URL/agents/YOUR_AGENT_ID/metrics?limit=50&skip=0"
```

## Delete an Agent

```bash
curl -X DELETE "$BASE_URL/agents/YOUR_AGENT_ID"
```

Successful deletion returns `204 No Content`.

## Status Values

Current agent status enum values from `src/api/models/models.py`:

- `creating`
- `running`
- `stopped`
- `failed`
- `deleting`
