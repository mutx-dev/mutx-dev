# API Overview

The mutx.dev control plane is a FastAPI application living in `src/api/`. Routes are mounted directly without version prefixes.

## Base URLs

- **Local:** `http://localhost:8000`
- **Production:** `https://api.mutx.dev` (or via Railway)

## Route Groups

| Group | Routes |
| :--- | :--- |
| **Root** | `GET /`, `GET /health`, `GET /ready` |
| **Auth** | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| **Agents** | `POST /agents`, `GET /agents`, `GET /agents/{agent_id}`, `DELETE /agents/{agent_id}`, `POST /agents/{agent_id}/deploy`, `POST /agents/{agent_id}/stop`, `GET /agents/{agent_id}/logs`, `GET /agents/{agent_id}/metrics` |
| **Deployments** | `GET /deployments`, `GET /deployments/{deployment_id}`, `POST /deployments/{deployment_id}/scale`, `DELETE /deployments/{deployment_id}` |
| **Waitlist** | `POST /api/newsletter` |
| **Webhooks** | `POST /webhooks/agent-status`, `POST /webhooks/deployment`, `POST /webhooks/metrics` |

## Quickstart

```bash
BASE_URL=http://localhost:8000

# Registration
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'

# Login
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"StrongPass1!"}'
```

Authenticated requests require the access token:
```bash
curl "$BASE_URL/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Health Endpoints

- `/health`: Application status and database liveness.
- `/ready`: Returns `200` when application is fully initialized and DB is reachable; `503` otherwise.

## Error Format

FastAPI validation errors:
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
List endpoints support `skip` and `limit` query parameters (e.g., `GET /agents?skip=0&limit=50`).

---

## Detailed Docs

- [Authentication](./authentication.md)
- [Agents](./agents.md)
- [Deployments](./deployments.md)
- [Webhook ingestion](./webhooks.md)
