# Agents API

The agents routes manage agent records, deployments, logs, and metrics.

Runtime-facing endpoints such as heartbeat, command polling, log submission, and `GET /agents/{agent_id}/status` use agent identity auth. Control-plane users should use the standard user-authenticated agent routes.

## Current Implementation Notes

- Routes are mounted at `/agents`, not `/v1/agents`.
- `POST /agents` derives ownership from the authenticated user instead of accepting `user_id` in the request body.
- `config` is currently modeled as a string field, so JSON config should be sent as a string payload.
- Control-plane routes enforce user ownership; runtime status enforces agent identity match.

## Routes

| Route | Purpose |
|------|---------|
| `POST /agents` | Create an agent record |
| `GET /agents` | List agents |
| `GET /agents/{agent_id}` | Get one agent with deployments |
| `GET /agents/{agent_id}/status` | Get runtime status for the authenticated agent |
| `DELETE /agents/{agent_id}` | Delete an agent |
| `POST /agents/{agent_id}/deploy` | Create a deployment record and mark the agent running |
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
curl "$BASE_URL/agents?limit=10&skip=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Optional filters:

- `skip`
- `limit`
- `user_id`

## Get an Agent

```bash
curl "$BASE_URL/agents/YOUR_AGENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
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

```bash
curl -X POST "$BASE_URL/agents/YOUR_AGENT_ID/deploy" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
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
curl -X POST "$BASE_URL/agents/YOUR_AGENT_ID/stop" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Agent Logs

```bash
curl "$BASE_URL/agents/YOUR_AGENT_ID/logs?limit=50&skip=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/agents/YOUR_AGENT_ID/logs?limit=50&level=error" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Agent Metrics

```bash
curl "$BASE_URL/agents/YOUR_AGENT_ID/metrics?limit=50&skip=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Delete an Agent

```bash
curl -X DELETE "$BASE_URL/agents/YOUR_AGENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Successful deletion returns `204 No Content`.

## Status Values

Current agent status enum values from `src/api/models/models.py`:

- `creating`
- `running`
- `stopped`
- `failed`
- `deleting`
