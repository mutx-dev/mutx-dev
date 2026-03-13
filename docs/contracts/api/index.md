# API Overview

The MUTX control plane is a FastAPI application in `src/api/`.
Routes are mounted directly at top-level prefixes. There is no global `/v1` backend prefix.

## Platform Surface Split

- `https://mutx.dev`: marketing and public site entrypoint.
- `https://docs.mutx.dev`: documentation surface built from the repo docs content.
- `https://app.mutx.dev`: operator dashboard surface; browser requests use Next.js same-origin proxies under `/api/*`.

## Base URLs

- Local control-plane API: `http://localhost:8000`
- Local website/app route proxies: `http://localhost:3000/api/*`
- Hosted control-plane API: `https://api.mutx.dev`
- Hosted website: `https://mutx.dev`
- Hosted app surface: `https://app.mutx.dev`
- Hosted docs: `https://docs.mutx.dev`

## Route Groups (Current)

| Group | Routes |
| --- | --- |
| Root and monitoring | `GET /`, `GET /health`, `GET /ready`, `GET /metrics` |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/forgot-password`, `POST /auth/resend-verification`, `POST /auth/verify-email`, `POST /auth/reset-password` |
| Agents (control plane) | `POST /agents`, `GET /agents`, `GET /agents/{agent_id}`, `DELETE /agents/{agent_id}`, `POST /agents/{agent_id}/deploy`, `POST /agents/{agent_id}/stop`, `GET /agents/{agent_id}/logs`, `GET /agents/{agent_id}/metrics` |
| Agent runtime | `POST /agents/register`, `POST /agents/heartbeat`, `POST /agents/metrics`, `GET /agents/commands`, `POST /agents/commands/acknowledge`, `POST /agents/logs`, `GET /agents/{agent_id}/status` |
| Deployments | `GET /deployments`, `POST /deployments`, `GET /deployments/{deployment_id}`, `GET /deployments/{deployment_id}/events`, `GET /deployments/{deployment_id}/logs`, `GET /deployments/{deployment_id}/metrics`, `POST /deployments/{deployment_id}/restart`, `POST /deployments/{deployment_id}/scale`, `DELETE /deployments/{deployment_id}` |
| API keys | `GET /api-keys`, `POST /api-keys`, `DELETE /api-keys/{key_id}`, `POST /api-keys/{key_id}/rotate` |
| Ingestion | `POST /ingest/agent-status`, `POST /ingest/deployment`, `POST /ingest/metrics` |
| Webhooks (user-managed destinations) | `POST /webhooks/`, `GET /webhooks/`, `GET /webhooks/{webhook_id}`, `PATCH /webhooks/{webhook_id}`, `DELETE /webhooks/{webhook_id}`, `POST /webhooks/{webhook_id}/test`, `GET /webhooks/{webhook_id}/deliveries` |
| Newsletter | `GET /newsletter`, `POST /newsletter` |
| Leads | `POST /leads`, `GET /leads`, `GET /leads/{lead_id}` |
| ClawHub | `POST /clawhub/install`, `GET /clawhub/skills`, `POST /clawhub/uninstall` |

## Auth Model

- Control-plane user operations expect `Authorization: Bearer <access_token>`.
- Ingestion and webhook-management routes support either bearer JWT or `X-API-Key` where documented.
- Runtime-only routes use an agent identity and reject mismatched `agent_id` access.

## Website/App Proxies

The Next.js app exposes same-origin handlers under `app/api/` for browser-facing workflows. Examples include:

- `/api/auth/login`
- `/api/auth/me`
- `/api/dashboard/agents`
- `/api/dashboard/deployments`
- `/api/api-keys`
- `/api/api-keys/[id]`
- `/api/api-keys/[id]/rotate`
- `/api/newsletter`

Use FastAPI routes for direct control-plane integrations and Next.js handlers for browser/app surface flows.

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

## API Reference

- OpenAPI snapshot: [`openapi.json`](./openapi.json)
- Reference guide: [API Reference](./reference.md)

## Detailed Docs

- [Authentication](./authentication.md)
- [API Keys](./api-keys.md)
- [Agents](./agents.md)
- [Deployments](./deployments.md)
- [Webhooks and Ingestion](./webhooks.md)
- [Leads](./leads.md)
- [Changelog and Status](../changelog-status.md)
