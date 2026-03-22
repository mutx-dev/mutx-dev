# Deployments

Deployments track the lifecycle of user-owned agent deployments.

The canonical create path is `POST /v1/deployments`.

## Routes

| Route | Purpose |
| --- | --- |
| `GET /v1/deployments` | List deployments for the current user |
| `POST /v1/deployments` | Create a deployment for an owned agent |
| `GET /v1/deployments/{deployment_id}` | Fetch one deployment |
| `GET /v1/deployments/{deployment_id}/events` | Fetch paginated deployment events |
| `POST /v1/deployments/{deployment_id}/scale` | Update replica count |
| `POST /v1/deployments/{deployment_id}/restart` | Restart stopped, failed, or killed deployments |
| `GET /v1/deployments/{deployment_id}/logs` | Fetch logs |
| `GET /v1/deployments/{deployment_id}/metrics` | Fetch metrics |
| `GET /v1/deployments/{deployment_id}/versions` | Fetch version history |
| `POST /v1/deployments/{deployment_id}/rollback` | Roll back to a prior version |
| `DELETE /v1/deployments/{deployment_id}` | Mark the deployment as killed |

## Current Lifecycle Rules

- creation requires an owned `agent_id`
- scaling only succeeds for deployments in `running` or `ready`
- restart only succeeds for deployments in `stopped`, `failed`, or `killed`
- delete does not hard-remove the record; it marks the deployment `killed`

## Create A Deployment

```bash
BASE_URL=http://localhost:8000

curl -X POST "$BASE_URL/v1/deployments" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "YOUR_AGENT_ID",
    "replicas": 1
  }'
```

Example response:

```json
{
  "id": "uuid",
  "agent_id": "uuid",
  "status": "pending",
  "version": null,
  "replicas": 1,
  "node_id": null,
  "started_at": "2026-03-22T12:00:00Z",
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
      "created_at": "2026-03-22T12:00:00Z"
    }
  ]
}
```

## Legacy Agent-Scoped Create

`POST /v1/agents/{agent_id}/deploy` is still mounted and returns a lightweight payload:

```json
{
  "deployment_id": "uuid",
  "status": "deploying"
}
```

Use `POST /v1/deployments` for the canonical full deployment record.

## List And Inspect Deployments

```bash
curl "$BASE_URL/v1/deployments?skip=0&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/v1/deployments?status=running&agent_id=YOUR_AGENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Event History

```bash
curl "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/events?limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/events?event_type=scale&status=running" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

The paginated response includes:

- `deployment_id`
- `deployment_status`
- `items`
- `total`
- `skip`
- `limit`
- optional echoed `event_type` and `status` filters

## Scale, Restart, And Kill

```bash
curl -X POST "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/scale" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"replicas":2}'

curl -X POST "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/restart" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl -X DELETE "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Logs And Metrics

```bash
curl "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/logs?limit=100&level=info" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/metrics?limit=100" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Deployment log and metric reads currently proxy through the deployment's agent record.

## Versions And Rollback

```bash
curl "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/versions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl -X POST "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/rollback" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"version":1}'
```

Rollback restores the stored deployment snapshot for the selected version and records a deployment event.
