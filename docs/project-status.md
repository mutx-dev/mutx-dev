---
description: Capability matrix, biggest gaps, and highest-leverage next tasks.
icon: chart-line
---

# Project Status

This matrix tracks the current repo state and where contributors can help next.

## Capability Matrix

| Area         | Current state                                                       | Biggest gaps                                                                                                                                     | Contributor-ready work                                                               |
| ------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Web          | landing site, dashboard routes, and control demo all exist in Next.js | dashboard still does not cover every backend capability; some flows remain better in CLI or direct API                                           | fill dashboard gaps, tighten auth/session UX, keep demo vs live boundaries honest    |
| API          | real `/v1/*` contract with auth, agents, deployments, runs, monitoring, webhooks, budgets, leads, and more | scheduler is still placeholder-backed, RAG search still returns placeholder results, and some lifecycle features need deeper runtime backing     | auth hardening, route ownership checks, typed response polish, lifecycle tests       |
| CLI          | grouped `auth`, `agent`, `deployment`, `assistant`, `runtime`, and `setup` commands plus compatibility aliases | some older aliases still create duplicate docs burden; setup ergonomics and error recovery still need polish                                    | streamline help/docs, keep setup truthful, tighten command coverage                  |
| SDK          | sync client is useful and tracks `/v1/*` correctly                  | `MutxAsyncClient` remains limited and must stay explicitly documented as such                                                                     | async contract coverage, clearer supported-method matrix, docs truth                 |
| Infra        | Docker, Terraform, Ansible, Railway, and monitoring assets exist    | Vault integration is still a stub and validation confidence loops are thin                                                                       | infra docs cleanup, validation, stub visibility                                      |
| Tests and CI | API, CLI, frontend, and docs tests exist                            | docs drift tests were too narrow; hosted-vs-local assumptions still need careful coverage                                                        | route/openapi drift checks, link checks, local-first validation                      |
| Docs         | docs are now structured for GitBook and GitHub together             | drift risk remains high whenever routes, app paths, or CLI groups move                                                                           | doc drift guardrails, GitBook sync rules, API reference upkeep                       |

## Highest-Leverage Next Tasks

- keep route, CLI, SDK, and docs truth aligned around the live `/v1/*` contract
- keep the dashboard honest about which flows are live, partial, or still backend-only
- strengthen auth and ownership posture across every user-scoped route
- keep SDK async documentation honest until full async support is real
- finish placeholder-backed areas such as scheduler integration and RAG search
- keep GitBook sync GitHub-first and stop GitBook-only README drift

## Contribution Lanes

### `area:web`

- dashboard completeness for live routes
- better browser auth/session handling
- keep `/dashboard` and `/control` semantics clear

### `area:api`

- auth dependencies and per-user ownership checks
- deeper runtime-backed lifecycle semantics
- scheduler and RAG completion

### `area:cli`

- keep grouped commands and compatibility aliases documented accurately
- improve auth ergonomics and setup recovery
- keep runtime import/resync flows honest

### `area:sdk`

- keep `/v1/*` behavior aligned to the server
- keep `MutxAsyncClient` deprecation and docs honest until async method coverage is real
- add a supported-method matrix with tests

### `area:testing`

- docs drift tests against real routes and OpenAPI
- backend route tests
- CLI and SDK contract tests

### `area:docs`

* keep examples aligned with real routes
* document supported versus preview surfaces clearly (see [Surface Matrix](../docs/surfaces.md))
* keep GitBook sidebar and repo docs in sync

For priority and sequencing, see `roadmap.md`.
