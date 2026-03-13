---
description: Deployment lifecycle records, events, logs, metrics, and scaling.
icon: rocket
---

# Deployments API

Deployment records are exposed through `/deployments`, and creation is available through both `/deployments` and the agent deploy route.

## Current Implementation Notes

* Every deployment route requires authenticated control-plane access.
* `POST /deployments` creates a deployment when given an owned `agent_id`.
* `POST /agents/{agent_id}/deploy` is still available as the agent-centric create path.
* `POST /deployments/{deployment_id}/scale` only succeeds when the deployment status is `running` or `ready`.
* `POST /deployments/{deployment_id}/restart` currently allows `stopped`, `failed`, and `killed` deployments.

## Routes

| Route                                       | Purpose                                            |
| ------------------------------------------- | -------------------------------------------------- |
| `GET /deployments`                          | List deployments                                   |
| `POST /deployments`                         | Create a deployment for an owned agent             |
| `GET /deployments/{deployment_id}`          | Get one deployment                                 |
| `GET /deployments/{deployment_id}/events`   | Get paginated lifecycle history for one deployment |
| `GET /deployments/{deployment_id}/logs`     | Get deployment logs                                |
| `GET /deployments/{deployment_id}/metrics`  | Get deployment metrics                             |
| `POST /deployments/{deployment_id}/restart` | Restart a stopped, failed, or killed deployment    |
| `POST /deployments/{deployment_id}/scale`   | Change replica count                               |
| `DELETE /deployments/{deployment_id}`       | Mark deployment as killed                          |

## Create a Deployment

```bash
BASE_URL=http://localhost:8000

curl -X POST "$BASE_URL/agents/YOUR_AGENT_ID/deploy" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

That returns a deployment id you can use with the routes below.

Direct deployment creation is also available:

```bash
curl -X POST "$BASE_URL/deployments" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "YOUR_AGENT_ID", "replicas": 1}'
```

## List Deployments

```bash
curl "$BASE_URL/deployments" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/deployments?status=running&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/deployments?agent_id=YOUR_AGENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Supported query parameters:

* `skip`
* `limit`
* `agent_id`
* `status`

## Get a Deployment

```bash
curl "$BASE_URL/deployments/YOUR_DEPLOYMENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
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
curl "$BASE_URL/deployments/YOUR_DEPLOYMENT_ID/events" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/deployments/YOUR_DEPLOYMENT_ID/events?event_type=scale" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/deployments/YOUR_DEPLOYMENT_ID/events?status=failed&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Supported query parameters:

* `skip`
* `limit`
* `event_type`
* `status`

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

This route returns newest-first lifecycle history and lets operators page through deployment state transitions over time.

## Scale a Deployment

```bash
curl -X POST "$BASE_URL/deployments/YOUR_DEPLOYMENT_ID/scale" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"replicas": 3}'
```

If the deployment is not `running` or `ready`, the API returns `400` with `Can only scale running deployments`.

## Restart a Deployment

```bash
curl -X POST "$BASE_URL/deployments/YOUR_DEPLOYMENT_ID/restart" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Deployment Logs

```bash
curl "$BASE_URL/deployments/YOUR_DEPLOYMENT_ID/logs?limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Deployment Metrics

```bash
curl "$BASE_URL/deployments/YOUR_DEPLOYMENT_ID/metrics?limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Delete a Deployment

```bash
curl -X DELETE "$BASE_URL/deployments/YOUR_DEPLOYMENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Current implementation note: delete marks the deployment as `killed`, sets `ended_at`, and updates the parent agent to `stopped` when found.

## Status Values Seen in the Codebase

Deployments may show statuses such as:

* `pending`
* `deploying`
* `running`
* `ready`
* `stopped`
* `failed`
* `killed`
