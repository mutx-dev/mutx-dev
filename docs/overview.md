# Platform Overview

MUTX is an open-source control plane for operating AI agents with clearer boundaries than a demo app.

Today the repo exposes three distinct public surfaces, and understanding that split is the fastest way to orient yourself.

For a detailed supported-vs-preview matrix, see [Surface Matrix](surfaces.md).

## The three surfaces

### `mutx.dev`

`mutx.dev` is the public marketing site.

What it does today:

- explains the product thesis
- links people to the docs and GitHub repo
- captures waitlist signups through the Next.js waitlist flow
- points users toward the app preview

What it is not:

- not the canonical API reference
- not the authenticated operator dashboard
- not the source of truth for route behavior

The landing page currently lives in `app/page.tsx`.

### `docs.mutx.dev`

`docs.mutx.dev` is the canonical documentation surface.

It should answer three questions clearly:

1. what exists now
2. how to get started
3. how the marketing site, docs, and app relate

In repo terms, the docs source currently lives under `docs/`.

### `app.mutx.dev`

`app.mutx.dev` is the operator-facing app host.

What exists today:

- login and register browser flows via `app/api/auth/*`
- current-user lookup via `app/api/auth/me`
- authenticated dashboard pages under `app/dashboard/*`
- same-origin dashboard and control-plane proxies under `app/api/dashboard/*`, `app/api/agents/*`, `app/api/deployments/*`, `app/api/api-keys/*`, and `app/api/webhooks/*`
- a catch-all control demo rendered from `app/control/[[...slug]]/page.tsx`

What it is not yet:

- not a complete production dashboard
- not a full replacement for direct API usage
- not yet a write-complete surface for every backend resource

## Product model right now

MUTX already has real control-plane primitives:

- authentication
- templates and assistant workflows
- agents
- deployments
- runs and traces
- sessions
- budgets and monitoring
- API keys
- ingest routes
- webhook registration and delivery history
- health and readiness routes

The docs should describe those primitives as they exist today, not as a future ideal.

## Source-of-truth map

Use these directories when checking claims:

| Source | Trust it for |
| --- | --- |
| `app/page.tsx` | public landing site content and calls-to-action |
| `app/dashboard/` | current operator dashboard routes and positioning |
| `app/control/[[...slug]]/page.tsx` | current demo shell positioning |
| `app/api/` | browser-facing same-origin proxy routes |
| `src/api/routes/` | backend route contracts |
| `docs/api/openapi.json` | generated API contract snapshot |
| `docs/project-status.md` | current-state maturity framing |

## Canonical rule

If a route, screen, or workflow cannot be traced to code in this repo, do not present it as live product truth.
