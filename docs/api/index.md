# API Overview

MUTX public control-plane routes are mounted under `/v1/*`.

Root operational probes remain at `/`, `/health`, `/ready`, and `/metrics`.

## Base URLs

- Local API: `http://localhost:8000`
- Hosted API: `https://api.mutx.dev`
- Browser proxy surface: `http://localhost:3000/api/*` locally and `https://app.mutx.dev/api/*` when hosted

## Source Of Truth

When prose and implementation disagree, use this order:

1. `src/api/main.py` router registration plus `src/api/routes/*.py`
2. [`openapi.json`](./openapi.json)
3. Markdown pages in `docs/api/*.md`

## Authentication Model

- Interactive user flows use `Authorization: Bearer <access_token>`.
- Managed API keys can authenticate automation through `Authorization: Bearer <mutx_live_...>` or `X-API-Key: <mutx_live_...>`.
- `POST /v1/auth/local-bootstrap` is for localhost-only, non-production operator setup.

See [authentication.md](./authentication.md) and [api-keys.md](./api-keys.md) for details.

## Current Route Groups

| Group | Mounted routes |
| --- | --- |
| Auth | `/v1/auth/*` |
| Assistant | `/v1/assistant/*` |
| Agents | `/v1/agents`, `/v1/agents/{agent_id}/*`, runtime-compatible `/v1/agents/register`, `/v1/agents/heartbeat`, `/v1/agents/metrics`, `/v1/agents/logs`, `/v1/agents/commands*` |
| Deployments | `/v1/deployments`, `/v1/deployments/{deployment_id}/*` |
| API keys | `/v1/api-keys`, `/v1/api-keys/{key_id}`, `/v1/api-keys/{key_id}/rotate` |
| Webhooks | `/v1/webhooks/*` for outbound webhook management |
| Ingest | `/v1/ingest/agent-status`, `/v1/ingest/deployment`, `/v1/ingest/metrics` |
| Leads | `/v1/leads` plus compatibility-shaped `/v1/leads/contacts` |
| Other public families | `/v1/templates`, `/v1/sessions`, `/v1/runs`, `/v1/usage`, `/v1/analytics`, `/v1/monitoring`, `/v1/rag`, `/v1/runtime`, `/v1/swarms`, `/v1/budgets`, `/v1/onboarding`, `/v1/clawhub` |

## Browser And App Surface

The Next.js app exposes same-origin route handlers under `app/api/*` for browser-facing flows such as auth, dashboard reads and writes, API keys, webhooks, and leads.

Use the FastAPI routes directly for server-to-server integrations. Use `app/api/*` when you are operating inside the browser app surface.

## Generated Contract Artifacts

- OpenAPI snapshot: [`openapi.json`](./openapi.json)
- Generated TypeScript types: `app/types/api.ts`
- Refresh commands: see [reference.md](./reference.md)

## Related Pages

- [Authentication](./authentication.md)
- [API Keys](./api-keys.md)
- [Agents](./agents.md)
- [Deployments](./deployments.md)
- [Webhooks And Ingestion](./webhooks.md)
- [Leads](./leads.md)
