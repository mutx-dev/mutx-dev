---
description: Route map, auth model, base URLs, and integration basics.
icon: circle-nodes
---

# API Overview

The MUTX control plane is a FastAPI application in `src/api/`. Public control-plane routes are mounted under `/v1/*`, while root health and readiness probes stay at top-level.

## Platform Surface Split

* `https://mutx.dev`: marketing and public site entrypoint.
* `https://docs.mutx.dev`: documentation surface built from the repo docs content.
* `https://app.mutx.dev`: operator dashboard surface; browser requests use Next.js same-origin proxies under `/api/*`.

## Base URLs

* Local control-plane API: `http://localhost:8000`
* Local website/app route proxies: `http://localhost:3000/api/*`
* Hosted control-plane API: `https://api.mutx.dev`
* Hosted website: `https://mutx.dev`
* Hosted app surface: `https://app.mutx.dev`
* Hosted docs: `https://docs.mutx.dev`

## Route Groups (Current)

| Group                                | Routes                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Root and monitoring                  | `GET /`, `GET /health`, `GET /ready`, `GET /metrics`                                                                                                                                                                                                                                                                                       |
| Auth                                 | `POST /v1/auth/register`, `POST /v1/auth/login`, `POST /v1/auth/refresh`, `POST /v1/auth/logout`, `GET /v1/auth/me`, `POST /v1/auth/forgot-password`, `POST /v1/auth/resend-verification`, `POST /v1/auth/verify-email`, `POST /v1/auth/reset-password`                                                                                   |
| Agents (control plane)               | `POST /v1/agents`, `GET /v1/agents`, `GET /v1/agents/{agent_id}`, `DELETE /v1/agents/{agent_id}`, `POST /v1/agents/{agent_id}/deploy`, `POST /v1/agents/{agent_id}/stop`, `GET /v1/agents/{agent_id}/logs`, `GET /v1/agents/{agent_id}/metrics`                                                                                           |
| Agent runtime                        | `POST /v1/agents/register`, `POST /v1/agents/heartbeat`, `POST /v1/agents/metrics`, `GET /v1/agents/commands`, `POST /v1/agents/commands/acknowledge`, `POST /v1/agents/logs`, `GET /v1/agents/{agent_id}/status`                                                                                                                         |
| Runs and traces                      | `POST /v1/runs`, `GET /v1/runs`, `GET /v1/runs/{run_id}`, `GET /v1/runs/{run_id}/traces`                                                                                                                                                                                                                                                  |
| Deployments                          | `GET /v1/deployments`, `POST /v1/deployments`, `GET /v1/deployments/{deployment_id}`, `GET /v1/deployments/{deployment_id}/events`, `GET /v1/deployments/{deployment_id}/logs`, `GET /v1/deployments/{deployment_id}/metrics`, `POST /v1/deployments/{deployment_id}/restart`, `POST /v1/deployments/{deployment_id}/scale`, `DELETE /v1/deployments/{deployment_id}` |
| API keys                             | `GET /v1/api-keys`, `POST /v1/api-keys`, `DELETE /v1/api-keys/{key_id}`, `POST /v1/api-keys/{key_id}/rotate`                                                                                                                                                                                                                               |
| Ingestion                            | `POST /v1/ingest/agent-status`, `POST /v1/ingest/deployment`, `POST /v1/ingest/metrics`                                                                                                                                                                                                                                                   |
| Webhooks (user-managed destinations) | `POST /v1/webhooks/`, `GET /v1/webhooks/`, `GET /v1/webhooks/{webhook_id}`, `PATCH /v1/webhooks/{webhook_id}`, `DELETE /v1/webhooks/{webhook_id}`, `POST /v1/webhooks/{webhook_id}/test`, `GET /v1/webhooks/{webhook_id}/deliveries`                                                                                                      |
| Leads                                | `POST /v1/leads`, `GET /v1/leads`, `GET /v1/leads/{lead_id}`                                                                                                                                                                                                                                                                               |
| ClawHub                              | `POST /v1/clawhub/install`, `GET /v1/clawhub/skills`, `POST /v1/clawhub/uninstall`                                                                                                                                                                                                                                                        |

## Auth Model

* Control-plane user operations expect `Authorization: Bearer <access_token>`.
* Runs and traces endpoints are user-scoped and only return records for agents owned by the authenticated user.
* Ingestion and webhook-management routes support either bearer JWT or `X-API-Key` where documented.
* Runtime-only routes use an agent identity and reject mismatched `agent_id` access.

## Website/App Proxies

The Next.js app exposes same-origin handlers under `app/api/` for browser-facing workflows. Examples include:

* `/api/auth/login`
* `/api/auth/me`
* `/api/dashboard/agents`
* `/api/dashboard/deployments`
* `/api/api-keys`
* `/api/api-keys/[id]`
* `/api/api-keys/[id]/rotate`
* `/api/newsletter`

Use FastAPI routes for direct control-plane integrations and Next.js handlers for browser/app surface flows.

## Quickstart

```bash
BASE_URL=http://localhost:8000

curl -X POST "$BASE_URL/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'

curl -X POST "$BASE_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"StrongPass1!"}'
```

Authenticated requests require a bearer token:

```bash
curl "$BASE_URL/v1/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## API Reference

* OpenAPI snapshot: [`openapi.json`](openapi.json)
* Reference guide: [API Reference](reference.md)

## Detailed Docs

* [Authentication](authentication.md)
* [API Keys](api-keys.md)
* [Agents](agents.md)
* [Deployments](deployments.md)
* [Webhooks and Ingestion](webhooks.md)
* [Leads](leads.md)
* [Changelog and Status](../changelog-status.md)
