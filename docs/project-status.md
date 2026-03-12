# Project Status

This matrix tracks the current repo state and where contributors can help next.

## Capability Matrix

| Area | Current state | Biggest gaps | Contributor-ready work |
|------|---------------|--------------|------------------------|
| Web | Strong marketing surface and a clean app-facing teaser | app surface is still mostly static | authenticated dashboard basics, app data fetching, contact capture |
| API | Real auth, agent, deployment, webhook, health, and readiness routes | auth and ownership are not consistently enforced outside `/auth/*` | route auth, ownership checks, typed schemas, route tests |
| CLI | usable for auth, status, listing, and some deploy flows | create and some deploy commands still reflect older contracts | align command payloads and route paths, improve auth ergonomics |
| SDK | useful foundation and packaging | defaults and supported methods do not fully match the server | shrink to supported methods or add missing API routes |
| Infra | Terraform, Ansible, Docker, and deployment docs exist | validation and confidence loops are thin | CI validation, syntax checks, infra docs cleanup |
| Tests and CI | lint/build commands and a basic GitHub Actions workflow exist | backend tests are improving, but CI truth still depends on keeping Playwright/test assumptions aligned with supported hosted behavior | route tests, local-first Playwright, stronger CI coverage, validation ownership docs |
| Docs | current-state docs are much more honest than before | still need ongoing drift control | examples, contribution docs, roadmap-linked issue shaping |

## Highest-Leverage Next Tasks

- enforce authenticated ownership for agent and deployment routes
- remove client-supplied `user_id` from the happy path
- align CLI and SDK behavior with the current FastAPI contract
- turn `app/app` into a real dashboard instead of a pure teaser
- add backend route coverage and keep CI honest
- make local bootstrap easier than manual `curl` flows

## Contribution Lanes

### `area:web`

- authenticated agent and deployment list views
- dashboard polish once real data exists
- contact persistence or delivery integration

### `area:api`

- auth dependencies and per-user ownership checks
- typed config and cleaner schemas
- deployment lifecycle and event history

### `area:cli`

- fix `mutx agents create`
- fix `mutx deploy create`
- clean up API URL overrides and refresh behavior

### `area:sdk`

- remove unsupported assumptions
- align default base URLs and method coverage
- add a supported-method matrix with tests

### `area:testing`

- backend route tests
- CLI and SDK contract tests
- local-first Playwright configuration

### `area:docs`

- keep examples aligned with real routes
- document supported versus aspirational surfaces clearly

For priority and sequencing, see `ROADMAP.md`.
