# Deployments

Deployments manage the runtime lifecycle of agents in production.

## Base Path

All routes below are mounted under `/v1`.

## Response Shape

Deployment routes return raw JSON resources, not `{"data": ...}` envelopes.

## Endpoints

### List deployments

```http
GET /v1/deployments?skip=0&limit=50&agent_id=<uuid>&status=running
```

Returns a JSON array of deployment objects ordered newest-first.

Example item:

```json
{
  "id": "3dd9b2df-58b6-4cc0-a595-5c30f17c1a4a",
  "agent_id": "f145d31b-c0b2-4559-bca7-4e0d4c546f8c",
  "status": "running",
  "version": "v1.0.0",
  "replicas": 2,
  "node_id": "node-1",
  "started_at": "2026-03-12T09:05:00Z",
  "ended_at": null,
  "error_message": null,
  "events": []
}
```

### Create deployment

```http
POST /v1/deployments
Content-Type: application/json

{
  "agent_id": "f145d31b-c0b2-4559-bca7-4e0d4c546f8c",
  "replicas": 3
}
```

Creates a new pending deployment and returns the full deployment resource.

### Get deployment

```http
GET /v1/deployments/{deployment_id}
```

Returns the deployment resource with nested lifecycle events.

### Scale deployment

```http
POST /v1/deployments/{deployment_id}/scale
Content-Type: application/json

{
  "replicas": 5
}
```

Allowed when the deployment status is `running` or `ready`.

### Restart deployment

```http
POST /v1/deployments/{deployment_id}/restart
```

Allowed when the deployment status is `stopped`, `failed`, or `killed`.
Returns the updated deployment resource.

### Delete deployment

```http
DELETE /v1/deployments/{deployment_id}
```

Marks the deployment as killed and returns `204 No Content`.

### Deployment events

```http
GET /v1/deployments/{deployment_id}/events?skip=0&limit=100&event_type=restart&status=failed
```

Returns paginated lifecycle history:

```json
{
  "deployment_id": "3dd9b2df-58b6-4cc0-a595-5c30f17c1a4a",
  "deployment_status": "failed",
  "items": [
    {
      "id": "119db9f1-5c83-450e-b563-f770c5074f6d",
      "deployment_id": "3dd9b2df-58b6-4cc0-a595-5c30f17c1a4a",
      "event_type": "restart",
      "status": "failed",
      "node_id": "node-1",
      "error_message": null,
      "created_at": "2026-03-12T10:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 100,
  "event_type": "restart",
  "status": "failed"
}
```

### Deployment logs

```http
GET /v1/deployments/{deployment_id}/logs?skip=0&limit=100&level=ERROR
```

Returns a JSON array of deployment log rows for the deployment's agent.

### Deployment metrics

```http
GET /v1/deployments/{deployment_id}/metrics?skip=0&limit=100
```

Returns a JSON array of metric points for the deployment's agent.

### Deployment versions

```http
GET /v1/deployments/{deployment_id}/versions
```

Returns version history:

```json
{
  "deployment_id": "3dd9b2df-58b6-4cc0-a595-5c30f17c1a4a",
  "items": [
    {
      "id": "1d9f2e38-78c9-4c95-b9fc-20e9897d0b76",
      "deployment_id": "3dd9b2df-58b6-4cc0-a595-5c30f17c1a4a",
      "version": 2,
      "config_snapshot": "{\"replicas\": 3, \"version\": \"v1.1.0\"}",
      "status": "current",
      "created_at": "2026-03-12T11:00:00Z",
      "rolled_back_at": null
    }
  ],
  "total": 1
}
```

### Roll back deployment

```http
POST /v1/deployments/{deployment_id}/rollback
Content-Type: application/json

{
  "version": 2
}
```

Restores the selected deployment version snapshot and returns the updated deployment resource.
