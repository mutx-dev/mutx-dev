# Webhooks and Ingestion API

MUTX provides two distinct sets of webhook-related interfaces:
1. **Ingestion API**: Endpoints for agents and deployments to report status, events, and metrics.
2. **Webhook Registration API**: A system for users to register endpoints that receive notifications from MUTX when certain events occur.

## Ingestion API

These endpoints are used by the MUTX runtime or deployed agents to report state changes back to the control plane.

### Routes

| Route | Purpose |
|------|---------|
| `POST /ingest/agent-status` | Update an agent status and append logs |
| `POST /ingest/deployment` | Update deployment state and related agent state |
| `POST /ingest/metrics` | Record agent metrics |

### Authentication

Ingest endpoints require authentication via:
- **JWT Bearer Token**: Provide in the `Authorization: Bearer <token>` header.
- **API Key**: Provide in the `X-API-Key` header.

### Agent Status Update

```bash
curl -X POST "https://api.mutx.dev/ingest/agent-status" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "YOUR_AGENT_ID",
    "status": "running",
    "node_id": "node-123"
  }'
```

## Webhook Registration API (User Facing)

Register your own endpoints to receive real-time notifications from MUTX.

### Supported Events

- `agent.*`: All agent-related events
- `deployment.*`: All deployment-related events
- `metrics.*`: Periodic metrics reports
- `alert.*`: System alerts and thresholds
- `*`: All events

### Registration

```bash
curl -X POST "https://api.mutx.dev/webhooks/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/mutx",
    "events": ["agent.status_changed", "deployment.failed"],
    "secret": "optional-hmac-secret"
  }'
```

### Management Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/webhooks/` | List all registered webhooks |
| `GET` | `/webhooks/{id}` | Get a specific webhook |
| `GET` | `/webhooks/{id}/deliveries` | List delivery attempts for one webhook |
| `PATCH` | `/webhooks/{id}` | Update a webhook (URL, events, active status) |
| `DELETE` | `/webhooks/{id}` | Remove a webhook |
| `POST` | `/webhooks/{id}/test` | Send a test event to verify delivery |

### Delivery History

Delivery attempts are persisted and can be queried directly:

```bash
curl "https://api.mutx.dev/webhooks/YOUR_WEBHOOK_ID/deliveries?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

curl "https://api.mutx.dev/webhooks/YOUR_WEBHOOK_ID/deliveries?event=agent.status&success=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Supported query parameters:

- `skip`
- `limit`
- `event`
- `success`

Example response item:

```json
{
  "id": "uuid",
  "webhook_id": "uuid",
  "event": "agent.status",
  "payload": "{\"new_status\":\"failed\"}",
  "status_code": 502,
  "success": false,
  "error_message": "upstream timeout",
  "attempts": 2,
  "created_at": "2026-03-12T09:15:00Z",
  "delivered_at": null
}
```

## Delivery and Security

- **Retries**: MUTX will retry failed deliveries up to 5 times with exponential backoff.
- **Signatures**: If a `secret` is provided during registration, MUTX will include an `X-MUTX-Signature` header (HMAC-SHA256) for payload verification.
