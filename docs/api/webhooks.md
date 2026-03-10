# Webhook Ingestion API

The current `/webhooks` routes are ingestion endpoints for runtime and deployment callbacks.

They are not a user-facing webhook registration system yet.

## Routes

| Route | Purpose |
|------|---------|
| `POST /webhooks/agent-status` | Update an agent status and append logs |
| `POST /webhooks/deployment` | Update deployment state and related agent state |
| `POST /webhooks/metrics` | Record agent metrics |

## Current Implementation Notes

- These handlers are designed for internal callbacks or deployed agent infrastructure.
- There are no `GET /webhooks`, `POST /webhooks`, `PUT /webhooks/{id}`, or `DELETE /webhooks/{id}` routes in the current server.
- The current route handlers do not attach auth dependencies.

## Agent Status Update

```bash
BASE_URL=http://localhost:8000

curl -X POST "$BASE_URL/webhooks/agent-status" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "YOUR_AGENT_ID",
    "status": "running",
    "node_id": "node-123",
    "error_message": null
  }'
```

Payload fields:

| Field | Type | Required |
|------|------|----------|
| `agent_id` | UUID | yes |
| `status` | enum | yes |
| `node_id` | string | no |
| `error_message` | string | no |

## Deployment Event

```bash
curl -X POST "$BASE_URL/webhooks/deployment" \
  -H "Content-Type: application/json" \
  -d '{
    "deployment_id": "YOUR_DEPLOYMENT_ID",
    "event": "healthy",
    "status": "running",
    "node_id": "node-123",
    "error_message": null
  }'
```

Payload fields:

| Field | Type | Required |
|------|------|----------|
| `deployment_id` | UUID | yes |
| `event` | string | yes |
| `status` | string | no |
| `node_id` | string | no |
| `error_message` | string | no |

## Metrics Report

```bash
curl -X POST "$BASE_URL/webhooks/metrics" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "YOUR_AGENT_ID",
    "cpu_usage": 42.5,
    "memory_usage": 68.1
  }'
```

Payload fields:

| Field | Type | Required |
|------|------|----------|
| `agent_id` | UUID | yes |
| `cpu_usage` | float | yes |
| `memory_usage` | float | yes |

## Response Shape

All three routes currently return a small confirmation body such as:

```json
{"status": "updated"}
```

or:

```json
{"status": "processed"}
```

or:

```json
{"status": "recorded"}
```
