# Webhooks

Webhooks let MUTX push agent and deployment events to your endpoint in near real time.

## Canonical base path

All webhook routes live under:

```http
/v1/webhooks
```

Authentication supports either:
- `Authorization: Bearer <token>`
- `X-API-Key: <api-key>`

Responses are returned as raw JSON resources/arrays rather than `{ "data": ... }` envelopes.

## Resource shape

Webhook objects currently look like:

```json
{
  "id": "9db63131-8e22-4698-991d-f4b460e4b761",
  "url": "https://example.com/webhooks/mutx",
  "events": ["deployment.failed", "agent.status"],
  "secret": "whsec_optional",
  "is_active": true,
  "created_at": "2026-03-19T00:00:00Z"
}
```

Delivery records currently look like:

```json
{
  "id": "4fed8ef3-2fd7-4883-82d0-77c45ec3e4e7",
  "webhook_id": "9db63131-8e22-4698-991d-f4b460e4b761",
  "event": "deployment.failed",
  "payload": {"deployment_id": "dep_123"},
  "status_code": 502,
  "success": false,
  "error_message": "upstream timeout",
  "attempts": 2,
  "created_at": "2026-03-19T00:00:00Z",
  "delivered_at": null
}
```

## Endpoints

### List webhooks

```http
GET /v1/webhooks?skip=0&limit=50
```

**Response**

```json
[
  {
    "id": "9db63131-8e22-4698-991d-f4b460e4b761",
    "url": "https://example.com/webhooks/mutx",
    "events": ["deployment.failed", "agent.status"],
    "secret": "whsec_optional",
    "is_active": true,
    "created_at": "2026-03-19T00:00:00Z"
  }
]
```

### Create webhook

```http
POST /v1/webhooks/
Content-Type: application/json
```

**Request body**

```json
{
  "url": "https://example.com/webhooks/mutx",
  "events": ["deployment.failed", "agent.status"],
  "secret": "whsec_optional",
  "is_active": true
}
```

Notes:
- `url` must start with `http://` or `https://`
- `events` may contain explicit event names or `*`
- invalid event names return `400`

**Response**

```json
{
  "id": "9db63131-8e22-4698-991d-f4b460e4b761",
  "url": "https://example.com/webhooks/mutx",
  "events": ["deployment.failed", "agent.status"],
  "secret": "whsec_optional",
  "is_active": true,
  "created_at": "2026-03-19T00:00:00Z"
}
```

### Get webhook

```http
GET /v1/webhooks/{webhook_id}
```

**Response**

```json
{
  "id": "9db63131-8e22-4698-991d-f4b460e4b761",
  "url": "https://example.com/webhooks/mutx",
  "events": ["deployment.failed", "agent.status"],
  "secret": "whsec_optional",
  "is_active": true,
  "created_at": "2026-03-19T00:00:00Z"
}
```

### Update webhook

```http
PATCH /v1/webhooks/{webhook_id}
Content-Type: application/json
```

Send only the fields you want to change.

```json
{
  "url": "https://example.com/webhooks/new-destination",
  "events": ["deployment.failed"],
  "is_active": false
}
```

**Response**

Returns the updated webhook object.

### Delete webhook

```http
DELETE /v1/webhooks/{webhook_id}
```

**Response**
- `204 No Content` on success

### Test webhook

```http
POST /v1/webhooks/{webhook_id}/test
```

Sends a synthetic `test` event to the configured destination.

**Success response**

```json
{
  "status": "test_delivered",
  "message": "Test event delivered successfully"
}
```

**Failure response**

```json
{
  "detail": "Test event delivery failed. Check webhook URL and ensure it's reachable."
}
```

### Delivery history

```http
GET /v1/webhooks/{webhook_id}/deliveries?event=deployment.failed&success=false&skip=0&limit=50
```

**Query parameters**
- `event` — exact event-name filter
- `success` — `true` / `false`
- `skip` — pagination offset
- `limit` — page size (`1..500`)

**Response**

```json
[
  {
    "id": "4fed8ef3-2fd7-4883-82d0-77c45ec3e4e7",
    "webhook_id": "9db63131-8e22-4698-991d-f4b460e4b761",
    "event": "deployment.failed",
    "payload": {"deployment_id": "dep_123"},
    "status_code": 502,
    "success": false,
    "error_message": "upstream timeout",
    "attempts": 2,
    "created_at": "2026-03-19T00:00:00Z",
    "delivered_at": null
  }
]
```

## Event subscriptions

The backend validates requested events against the live webhook event enum. Wildcard `*` is allowed, and event-prefix wildcards like `deployment.*` are accepted when they match a real event namespace.

## CLI parity

```bash
mutx webhooks list
mutx webhooks create --url https://example.com/hook --event deployment.failed --event agent.status
mutx webhooks get <webhook-id>
mutx webhooks update <webhook-id> --inactive
mutx webhooks test <webhook-id>
mutx webhooks deliveries <webhook-id> --success false
mutx webhooks delete <webhook-id> --force
```
