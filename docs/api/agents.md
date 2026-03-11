# Agents API

The agents routes manage agent records, deployments, logs, and metrics.

## Current Implementation Notes

- Routes are mounted at `/agents`, not `/v1/agents`.
- `POST /agents` currently requires an explicit `user_id` in the request body.
- `config` is currently modeled as a string field, so JSON config should be sent as a string payload.
- Auth dependencies are not currently attached to these route handlers, even though the broader product direction assumes authenticated control-plane access.

## Routes

| Route | Purpose |
|------|---------|
| `POST /agents` | Create an agent record |
| `GET /agents` | List agents |
| `GET /agents/{agent_id}` | Get one agent with deployments |
| `DELETE /agents/{agent_id}` | Delete an agent |
| `POST /agents/{agent_id}/deploy` | Create a deployment record and mark the agent running |
| `POST /agents/{agent_id}/stop` | Stop active deployments for an agent |
| `GET /agents/{agent_id}/logs` | List agent logs |
| `GET /agents/{agent_id}/metrics` | List agent metrics |

## Create an Agent

Use `/auth/me` first if you need a `user_id`.

```bash
BASE_URL=http://localhost:8000

curl -X POST "$BASE_URL/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support Bot",
    "description": "Handles inbound support tasks",
    "config": "{\"model\":\"gpt-4\"}",
    "user_id": "YOUR_USER_ID"
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

## Deploy an Agent

```bash
curl -X POST "$BASE_URL/agents/YOUR_AGENT_ID/deploy"
```

Example response:

```json
{
  "deployment_id": "uuid",
  "status": "deploying"
}
```

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
