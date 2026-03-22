# App and Dashboard

This page documents the current truth of `app.mutx.dev`.

## Current role

`app.mutx.dev` is the operator-facing app host.

Right now it has two distinct browser roles:

- `/dashboard` is the authenticated operator shell backed by live `/v1/*` API calls
- `/control/*` is the browser demo shell for the control-plane story

It is a real preview surface, not a finished production dashboard.

## What exists today

### Auth flows

The app exposes browser-facing auth route handlers under `app/api/auth/`:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Those handlers proxy to the FastAPI control plane and manage browser cookies for the web surface.

### Dashboard and resource proxies

The app exposes current resource routes such as:

- `GET /api/dashboard/agents`
- `GET /api/dashboard/agents/{agentId}`
- `GET /api/dashboard/deployments`
- `GET /api/dashboard/deployments/{id}`
- `GET /api/dashboard/runs`
- `GET /api/dashboard/runs/{runId}`
- `GET /api/dashboard/runs/{runId}/traces`
- `GET /api/dashboard/sessions`
- `GET /api/dashboard/swarms`
- `GET /api/dashboard/budgets`
- `GET /api/dashboard/monitoring/alerts`
- `GET /api/dashboard/assistant/overview`
- `GET /api/dashboard/health`
- `GET /api/api-keys`
- `POST /api/api-keys`
- `DELETE /api/api-keys/{id}`
- `POST /api/api-keys/{id}/rotate`
- `GET /api/webhooks`
- `POST /api/webhooks`
- `GET /api/agents`
- `POST /api/agents`
- `GET /api/deployments`
- `POST /api/deployments`

### Rendered shells

The current dashboard shell is rendered from `app/dashboard/*` and positions the product around:

- overview
- auth
- agents
- deployments
- runs and traces
- sessions and swarms
- budgets and monitoring
- API keys
- webhooks

The control demo is rendered from `app/control/[[...slug]]/page.tsx`.

## Important boundary

The app surface is not the canonical source for route contracts.

When describing behavior:

- trust `src/api/routes/` for backend semantics
- trust `app/api/` for browser proxy behavior
- trust the app shell for UX positioning only

## Domain split summary

| Surface | Main job |
| --- | --- |
| `mutx.dev` | public product narrative and entry point |
| `docs.mutx.dev` | canonical docs and API explanation |
| `app.mutx.dev/dashboard` | operator-facing authenticated shell |
| `app.mutx.dev/control/*` | demo surface for the browser control-plane story |

## Known gaps

- no full write-complete dashboard for all resources
- dashboard maturity still trails the backend resource model
- some flows remain easier through the CLI or direct API
- some backend capabilities remain placeholder-backed, especially scheduler and full RAG search

That gap should be documented plainly so the product surface stays trustworthy.
