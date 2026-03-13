# Webhooks and Ingestion API

MUTX has two webhook-related surfaces:

1. **Ingestion API** (`/ingest/*`): runtime updates sent into the control plane.
2. **Webhook Registration API** (`/webhooks/*`): user-managed outbound webhooks sent from MUTX to your endpoint.

## Ingestion API

These endpoints are used by the MUTX runtime or deployed agents to report state changes back to the control plane.

### Routes

| Route | Purpose |
|------|---------|
| `POST /ingest/agent-status` | Update an agent status and append logs |
| `POST /ingest/deployment` | Update deployment state and related agent state |
| `POST /ingest/metrics` | Record agent metrics |

### Authentication

Ingest endpoints accept either:

- `Authorization: Bearer <token>`
- `X-API-Key: <key>`

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

Register your own endpoint(s) to receive notifications from MUTX.

### Supported Events

Exact event values from `src/api/services/webhook_handler.py` include:

- `agent.status_update`
- `agent.heartbeat`
- `agent.error`
- `agent.started`
- `agent.stopped`
- `agent.crashed`
- `deployment.created`
- `deployment.updated`
- `deployment.failed`
- `deployment.rolled_back`
- `metrics.report`

Wildcard subscriptions currently accepted by route validation:

- `agent.*`
- `deployment.*`
- `metrics.*`
- `*`

### Registration

```bash
curl -X POST "https://api.mutx.dev/webhooks/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/mutx",
    "events": ["agent.*", "deployment.*"],
    "secret": "optional-hmac-secret"
  }'
```

### Management Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/webhooks/` | List all registered webhooks |
| `GET` | `/webhooks/{webhook_id}` | Get a specific webhook |
| `GET` | `/webhooks/{webhook_id}/deliveries` | List delivery attempts for one webhook |
| `PATCH` | `/webhooks/{webhook_id}` | Update a webhook (URL, events, active status) |
| `DELETE` | `/webhooks/{webhook_id}` | Remove a webhook |
| `POST` | `/webhooks/{webhook_id}/test` | Send a test event to verify delivery |

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

- Retries: MUTX retries failed deliveries up to 3 attempts (`MAX_RETRIES = 3`).
- Timeout: each delivery attempt uses a 30 second timeout.
- Signatures: if a `secret` is configured, delivery requests include `X-Webhook-Signature: sha256=...`.
