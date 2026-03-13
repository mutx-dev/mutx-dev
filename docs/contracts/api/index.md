# API Overview

The MUTX control plane is a FastAPI application living in `src/api/`.
Routes are mounted directly at top-level prefixes. There is no global `/v1` backend prefix.

## Base URLs

- Local API: `http://localhost:8000`
- Website route proxies: `http://localhost:3000/api/*`
- Hosted frontend: `https://mutx.dev`
- Hosted app surface: `https://app.mutx.dev`

## Route Groups

| Group | Routes |
| --- | --- |
| Root | `GET /`, `GET /health`, `GET /ready` |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Agents | `POST /agents`, `GET /agents`, `GET /agents/{agent_id}`, `DELETE /agents/{agent_id}`, `POST /agents/{agent_id}/deploy`, `POST /agents/{agent_id}/stop`, `GET /agents/{agent_id}/logs`, `GET /agents/{agent_id}/metrics` |
| Agent Runtime | `POST /agents/register`, `POST /agents/heartbeat`, `POST /agents/metrics`, `GET /agents/commands`, `POST /agents/commands/acknowledge`, `POST /agents/logs`, `GET /agents/{agent_id}/status` |
| Deployments | `GET /deployments`, `GET /deployments/{deployment_id}`, `GET /deployments/{deployment_id}/events`, `POST /deployments/{deployment_id}/scale`, `POST /deployments/{deployment_id}/restart`, `DELETE /deployments/{deployment_id}` |
| API Keys | `GET /api-keys`, `POST /api-keys`, `DELETE /api-keys/{key_id}`, `POST /api-keys/{key_id}/rotate` |
| Webhooks | `GET /webhooks/`, `GET /webhooks/{id}`, `GET /webhooks/{id}/deliveries`, `PATCH /webhooks/{id}`, `DELETE /webhooks/{id}`, `POST /webhooks/{id}/test`, `POST /webhooks/agent-status`, `POST /webhooks/deployment`, `POST /webhooks/metrics` |
| Newsletter | `GET /newsletter`, `POST /newsletter` |
| Leads | `POST /leads`, `GET /leads`, `GET /leads/{lead_id}` |

## Website Proxies

The Next.js app also exposes same-origin route handlers under `app/api/` for browser-facing workflows. Examples include:

- `/api/auth/login`
- `/api/auth/me`
- `/api/dashboard/agents`
- `/api/dashboard/deployments`
- `/api/api-keys`
- `/api/api-keys/[id]`
- `/api/api-keys/[id]/rotate`
- `/api/newsletter`

Use the FastAPI routes for direct control-plane integrations and the Next.js route handlers for browser or app-surface flows.

## Quickstart

```bash
BASE_URL=http://localhost:8000

curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'

curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"StrongPass1!"}'
```

Authenticated requests require a bearer token:

```bash
curl "$BASE_URL/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Agent runtime routes use the agent API key as the bearer token rather than a user access token.

## Health And Readiness

- `/health` reports application status and database liveness
- `/ready` returns `200` when the application is initialized and the data layer is reachable, otherwise `503`

## Error Shape

FastAPI validation errors typically look like this:

```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "Field required",
      "type": "missing"
    }
  ]
}
```

## Pagination

List endpoints generally support `skip` and `limit` query parameters, for example:

```bash
curl "$BASE_URL/agents?skip=0&limit=50"
```

## Detailed Docs

- [Authentication](./authentication.md)
- [API Keys](./api-keys.md)
- [Agents](./agents.md)
- [Deployments](./deployments.md)
- [Webhook Ingestion](./webhooks.md)
- [Leads](./leads.md)
