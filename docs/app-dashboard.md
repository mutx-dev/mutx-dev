# App and Dashboard

This page documents the current truth of `app.mutx.dev`.

## Current role

`app.mutx.dev` is the operator-facing app shell.

Right now it is best understood as a real authenticated preview surface, not a finished production dashboard.

## What exists today

### Auth flows

The app exposes browser-facing auth route handlers under `app/api/auth/`:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Those handlers proxy to the FastAPI control plane and manage browser cookies for the web surface.

### Dashboard reads

The app exposes read-oriented dashboard routes for current resources:

- `GET /api/dashboard/agents`
- `GET /api/dashboard/deployments`
- `GET /api/dashboard/health`
- `GET /api/api-keys`
- `POST /api/api-keys`
- `DELETE /api/api-keys/{id}`
- `POST /api/api-keys/{id}/rotate`

### Rendered shell

The current app shell is rendered from `app/app/[[...slug]]/page.tsx` and positions the product around:

- overview
- auth
- agents
- deployments
- API keys
- health

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
| `app.mutx.dev` | operator-facing authenticated app shell |

## Known gaps

- no full write-complete dashboard for all resources
- dashboard maturity still trails the backend resource model
- some workflows remain easier through direct API or CLI usage than through the app shell

That gap should be documented plainly so the product surface stays trustworthy.
