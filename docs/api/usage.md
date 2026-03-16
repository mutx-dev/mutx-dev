# Usage API

The Usage API tracks API usage events and credits for quota enforcement.

## Endpoints

### Create Usage Event

Record a usage event for tracking API usage and quotas.

**Endpoint:** `POST /api/v1/usage/events`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "event_type": "agent_create",
  "resource_id": "agent_123",
  "metadata": {
    "credits_used": 10,
    "plan": "starter"
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "event_type": "agent_create",
  "user_id": "uuid",
  "resource_id": "agent_123",
  "event_metadata": "{\"credits_used\": 10, \"plan\": \"starter\"}",
  "created_at": "2026-03-16T02:00:00Z"
}
```

### List Usage Events

List usage events for the authenticated user.

**Endpoint:** `GET /api/v1/usage/events`

**Authentication:** Required (Bearer token)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| skip | int | 0 | Number of records to skip |
| limit | int | 50 | Max records to return (max 100) |
| event_type | string | - | Filter by event type |
| resource_id | string | - | Filter by resource ID |

**Response:** `200 OK`
```json
{
  "items": [...],
  "total": 100,
  "skip": 0,
  "limit": 50
}
```

### Get Usage Event

Get a specific usage event by ID.

**Endpoint:** `GET /api/v1/usage/events/{event_id}`

**Authentication:** Required (Bearer token)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "event_type": "agent_create",
  "user_id": "uuid",
  "resource_id": "agent_123",
  "event_metadata": "{\"credits_used\": 10}",
  "created_at": "2026-03-16T02:00:00Z"
}
```

## Event Types

| Event Type | Description |
|------------|-------------|
| `agent_create` | Creating a new agent |
| `agent_run` | Running an agent task |
| `deployment_create` | Creating a deployment |
| `deployment_run` | Running a deployment |

## Credit Limits

Usage events enforce credit constraints:
- Minimum: 0 credits
- Maximum: 1,000,000 credits per event

Quota enforcement is based on the user's plan tier (free/starter/pro/enterprise).

## Related

- [Usage Service](../../src/api/services/usage.py)
- [Usage Models](../../src/api/models/models.py)
