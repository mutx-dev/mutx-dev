# Webhooks

Webhooks allow you to receive real-time notifications about events in MUTX.

## Endpoints

### List Webhooks

Retrieve all configured webhooks.

```http
GET /webhooks/
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "data": [
    {
      "webhook_id": "whk_abc123",
      "name": "Production Notifications",
      "url": "https://example.com/webhooks/mutx",
      "events": ["deployment.started", "deployment.completed", "agent.error"],
      "active": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Create Webhook

Register a new webhook endpoint.

```http
POST /webhooks/
```

**Request Body:**

```json
{
  "name": "Production Notifications",
  "url": "https://example.com/webhooks/mutx",
  "events": ["deployment.started", "deployment.completed", "deployment.failed"],
  "secret": "whsec_your_secret_key",
  "active": true
}
```

**Response:**

```json
{
  "webhook_id": "whk_abc123",
  "name": "Production Notifications",
  "url": "https://example.com/webhooks/mutx",
  "events": ["deployment.started", "deployment.completed", "deployment.failed"],
  "active": true,
  "created_at": "2024-01-20T10:30:00Z"
}
```

---

### Get Webhook Details

Retrieve webhook configuration.

```http
GET /webhooks/{webhook_id}
```

**Response:**

```json
{
  "webhook_id": "whk_abc123",
  "name": "Production Notifications",
  "url": "https://example.com/webhooks/mutx",
  "events": ["deployment.started", "deployment.completed", "deployment.failed"],
  "active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "last_triggered_at": "2024-01-20T15:45:00Z"
}
```

---

### Update Webhook

Update webhook configuration.

```http
PUT /webhooks/{webhook_id}
```

**Request Body:**

```json
{
  "name": "Updated Name",
  "events": ["deployment.started", "deployment.completed"],
  "active": false
}
```

---

### Delete Webhook

Remove a webhook.

```http
DELETE /webhooks/{webhook_id}
```

**Response:**

```json
{
  "message": "Webhook deleted successfully"
}
```

---

### Test Webhook

Send a test event to a webhook.

```http
POST /webhooks/{webhook_id}/test
```

**Response:**

```json
{
  "test_id": "test_abc123",
  "status": "sent",
  "message": "Test event sent successfully"
}
```

---

### Get Webhook Deliveries

View delivery history for a webhook.

```http
GET /webhooks/{webhook_id}/deliveries
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter (success, failed, pending) |
| `limit` | int | Maximum results |
| `offset` | int | Pagination offset |

**Response:**

```json
{
  "deliveries": [
    {
      "delivery_id": "dlv_abc123",
      "event": "deployment.completed",
      "status": "success",
      "status_code": 200,
      "timestamp": "2024-01-20T15:45:00Z",
      "duration_ms": 245
    }
  ]
}
```

## Event Types

| Event | Description |
|-------|-------------|
| `deployment.started` | Deployment initiated |
| `deployment.completed` | Deployment successful |
| `deployment.failed` | Deployment failed |
| `deployment.stopped` | Deployment stopped |
| `agent.registered` | New agent registered |
| `agent.heartbeat` | Agent heartbeat received |
| `agent.error` | Agent reported an error |
| `agent.offline` | Agent went offline |

## Webhook Payload

All webhook events are sent as POST requests with a JSON body:

```json
{
  "event": "deployment.completed",
  "timestamp": "2024-01-20T15:45:00Z",
  "data": {
    "deployment_id": "dply_abc123",
    "agent_id": "agnt_abc123",
    "version": "1.3.0",
    "status": "running"
  }
}
```

## Verifying Webhooks

Webhooks include a signature header for verification:

```
X-Mutx-Signature: sha256=<signature>
```

Verify using the secret:

```python
import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

## Retry Policy

Failed deliveries are retried with exponential backoff:
- 1st retry: 1 minute
- 2nd retry: 5 minutes
- 3rd retry: 30 minutes
- 4th retry: 2 hours
- 5th retry: 24 hours

After 5 failed attempts, the webhook is marked as failed and not retried automatically.
