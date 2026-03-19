# Agents API

The canonical agent surface lives under `/v1/agents` and returns raw resources/lists rather than `{ data, total }` envelopes.

## Authentication

All routes require a valid bearer token.

```http
Authorization: Bearer <access_token>
```

## List agents

```http
GET /v1/agents?limit=50&skip=0
```

Response:

```json
[
  {
    "id": "9d9f8c70-2fd0-4d1a-80d8-4f2b4a6e3c18",
    "name": "support-agent",
    "description": "Handles customer support",
    "type": "openai",
    "status": "running",
    "config": {
      "name": "support-agent",
      "model": "gpt-4o",
      "temperature": 0.7,
      "version": 1
    },
    "config_version": 1,
    "created_at": "2026-03-19T01:00:00",
    "updated_at": "2026-03-19T01:00:00",
    "user_id": "1a20f130-cda8-4eb0-b538-2989273b29f7"
  }
]
```

## Create agent

```http
POST /v1/agents
```

Request body:

```json
{
  "name": "support-agent",
  "description": "Handles customer support",
  "type": "openai",
  "config": {
    "model": "gpt-4o",
    "temperature": 0.3,
    "max_tokens": 512
  }
}
```

Notes:
- `config` may be either a JSON object or a JSON string.
- The backend validates and normalizes the config for the selected agent `type`.

## Get agent details

```http
GET /v1/agents/{agent_id}
```

Response includes embedded deployments and their lifecycle events.

## Get runtime config

```http
GET /v1/agents/{agent_id}/config
```

Response:

```json
{
  "agent_id": "9d9f8c70-2fd0-4d1a-80d8-4f2b4a6e3c18",
  "type": "openai",
  "config": {
    "name": "support-agent",
    "model": "gpt-4o",
    "temperature": 0.3,
    "max_tokens": 512,
    "version": 1
  },
  "config_version": 1,
  "updated_at": "2026-03-19T01:00:00"
}
```

## Update runtime config

```http
PATCH /v1/agents/{agent_id}/config
```

Request body:

```json
{
  "config": {
    "model": "gpt-4o-mini",
    "temperature": 0.2,
    "max_tokens": 256
  }
}
```

Notes:
- `config` may be a JSON object or a JSON string.
- The backend increments config versioning automatically.
- Invalid configs return `400` with `Configuration validation failed ...` in `detail`.

## Deploy agent

```http
POST /v1/agents/{agent_id}/deploy
```

Response:

```json
{
  "deployment_id": "8c4880f3-5c43-4427-b74f-8068a1471110",
  "status": "deploying"
}
```

## Stop agent

```http
POST /v1/agents/{agent_id}/stop
```

Response:

```json
{
  "status": "stopped"
}
```

## Get agent logs

```http
GET /v1/agents/{agent_id}/logs?limit=100&skip=0&level=ERROR
```

Response:

```json
[
  {
    "id": "7ff456a1-0e91-4898-93c2-c617f37694c0",
    "agent_id": "9d9f8c70-2fd0-4d1a-80d8-4f2b4a6e3c18",
    "level": "ERROR",
    "message": "Inference request failed",
    "extra_data": null,
    "timestamp": "2026-03-19T01:10:00"
  }
]
```

## Get agent metrics

```http
GET /v1/agents/{agent_id}/metrics?limit=100&skip=0
```

Response:

```json
[
  {
    "id": "7ff456a1-0e91-4898-93c2-c617f37694c0",
    "agent_id": "9d9f8c70-2fd0-4d1a-80d8-4f2b4a6e3c18",
    "cpu_usage": 0.52,
    "memory_usage": 256.0,
    "timestamp": "2026-03-19T01:10:00"
  }
]
```

## Create resource-usage record

```http
POST /v1/agents/{agent_id}/resource-usage
```

Request body:

```json
{
  "prompt_tokens": 120,
  "completion_tokens": 40,
  "total_tokens": 160,
  "api_calls": 1,
  "cost_usd": 0.0042,
  "model": "gpt-4o-mini",
  "extra_metadata": {
    "request_id": "req_123"
  },
  "period_start": "2026-03-19T01:00:00Z",
  "period_end": "2026-03-19T01:05:00Z"
}
```

## List resource-usage records

```http
GET /v1/agents/{agent_id}/resource-usage?limit=50&skip=0
```

Returns a raw list of usage records ordered by `period_start` descending.

## Common error semantics

- `401` — missing or expired authentication
- `403` — resource exists but is not owned by the caller
- `404` — agent not found
- `400` — invalid config or malformed request payload
