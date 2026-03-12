# Deployments API

Deployment records are exposed through `/deployments`, but creation currently happens through the agent deploy route.

## Current Implementation Notes

- There is no `POST /deployments` route in the current FastAPI app.
- Create deployments with `POST /agents/{agent_id}/deploy`.
- There are no deployment restart, logs, or metrics routes today.
- `POST /deployments/{deployment_id}/scale` only succeeds when the deployment status is `running` or `ready`.

## Routes

| Route | Purpose |
|------|---------|
| `GET /deployments` | List deployments |
| `GET /deployments/{deployment_id}` | Get one deployment |
| `GET /deployments/{deployment_id}/events` | Get paginated lifecycle history for one deployment |
| `POST /deployments/{deployment_id}/scale` | Change replica count |
| `DELETE /deployments/{deployment_id}` | Mark deployment as killed |

## Create a Deployment

```bash
BASE_URL=http://localhost:8000

curl -X POST "$BASE_URL/agents/YOUR_AGENT_ID/deploy"
```

That returns a deployment id you can use with the routes below.

## List Deployments

```bash
curl "$BASE_URL/deployments"
curl "$BASE_URL/deployments?status=running&limit=10"
curl "$BASE_URL/deployments?agent_id=YOUR_AGENT_ID"
```

Supported query parameters:

- `skip`
- `limit`
- `agent_id`
- `status`

## Get a Deployment

```bash
curl "$BASE_URL/deployments/YOUR_DEPLOYMENT_ID"
```

Example response:

```json
{
  "id": "uuid",
  "agent_id": "uuid",
  "status": "deploying",
  "replicas": 1,
  "node_id": null,
  "started_at": "2026-03-08T10:00:00Z",
  "ended_at": null,
  "error_message": null
}
```

## Deployment Event History

```bash
curl "$BASE_URL/deployments/YOUR_DEPLOYMENT_ID/events"
curl "$BASE_URL/deployments/YOUR_DEPLOYMENT_ID/events?event_type=scale"
curl "$BASE_URL/deployments/YOUR_DEPLOYMENT_ID/events?status=failed&limit=20"
```

Supported query parameters:

- `skip`
- `limit`
- `event_type`
- `status`

Example response:

```json
{
  "deployment_id": "uuid",
  "deployment_status": "failed",
  "items": [
    {
      "id": "uuid",
      "deployment_id": "uuid",
      "event_type": "deploy.failed",
      "status": "failed",
      "node_id": "node-123",
      "error_message": "image pull failed",
      "created_at": "2026-03-12T09:15:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 20,
  "event_type": null,
  "status": "failed"
}
```

This route returns newest-first lifecycle history and makes it possible to page through deployment state transitions over time. The top-level `deployment_id` and `deployment_status` fields let operators render history context without making a second deployment-detail request.

## Scale a Deployment

```bash
curl -X POST "$BASE_URL/deployments/YOUR_DEPLOYMENT_ID/scale" \
  -H "Content-Type: application/json" \
  -d '{"replicas": 3}'
```

If the deployment is not `running` or `ready`, the API returns `400` with `Can only scale running deployments`.

## Delete a Deployment

```bash
curl -X DELETE "$BASE_URL/deployments/YOUR_DEPLOYMENT_ID"
```

Current implementation note: delete marks the deployment as `killed`, sets `ended_at`, and updates the parent agent to `stopped` when found.

## Status Values Seen in the Codebase

Deployments may show statuses such as:

- `deploying`
- `running`
- `ready`
- `stopped`
- `failed`
- `killed`
