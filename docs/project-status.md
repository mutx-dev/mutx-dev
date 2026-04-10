---
description: Capability matrix, biggest gaps, and highest-leverage next tasks.
icon: chart-line
---

# Project Status

This matrix tracks the current repo state and where contributors can help next.

## Capability Matrix

| Area         | Current state                                                       | Biggest gaps                                                                                                                                     | Contributor-ready work                                                               |
| ------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Web          | landing site, supported dashboard routes, observability dashboard, and control demo all exist in Next.js | dashboard still does not cover every backend capability; some flows remain better in CLI or direct API                                           | fill dashboard gaps, tighten auth/session UX, keep demo vs live boundaries honest    |
|| API          | real `/v1/*` contract with 27 route prefixes, 170 endpoint-method pairs, auth enforcement via `get_current_user` on 146+ endpoints, RBAC, OIDC validation | RAG and scheduler are now real implementations (no longer 503 stubs); preview routes still need live contracts before they return to primary nav | typed response polish, lifecycle tests, OpenAPI `required: false` → `true` fix on auth headers |
| CLI          | grouped `auth`, `agent`, `deployment`, `assistant`, `runtime`, `setup`, `governance`, and `observability` commands plus compatibility aliases | some older aliases still create duplicate docs burden; setup ergonomics and error recovery still need polish                                    | streamline help/docs, keep setup truthful, tighten command coverage                  |
| SDK          | sync client is useful and tracks `/v1/*` correctly; observability SDK with `OpenClawObservability` added | `MutxAsyncClient` remains limited and must stay explicitly documented as such                                                                     | async contract coverage, clearer supported-method matrix, docs truth                 |
| Infra        | Docker, Terraform, Ansible, Railway, Kubernetes/Helm chart, and monitoring assets exist    | Vault integration is still a stub and validation confidence loops are thin                                                                       | infra docs cleanup, validation, stub visibility, Helm chart hardening                |
| Tests and CI | API, CLI, frontend, observability, docs, and serial release smoke now exist | hosted-vs-local assumptions still need careful coverage; signed desktop artifact validation depends on real Apple credentials                     | route/openapi drift checks, link checks, local-first validation, signed-artifact CI  |
| Docs         | docs are now structured for GitBook and GitHub together; v1.3 release notes and launch checklist exist | drift risk remains high whenever routes, app paths, or CLI groups move                                                                           | doc drift guardrails, GitBook sync rules, API reference upkeep                       |
| Autonomous   | autonomous dev lane shipped for agentic workflows | still early; coverage and reliability need real-world validation | autonomous flow coverage, reliability, docs alignment |

## Highest-Leverage Next Tasks

- keep route, CLI, SDK, and docs truth aligned around the live `/v1/*` contract
- keep the dashboard honest about which flows are live, partial, or still backend-only
- keep preview and redirect-backed routes out of primary stable navigation until their contracts are real
- keep the signed desktop artifact lane healthy so `mutx.dev/download/macos` and the supported dashboard release stay trustworthy
- keep SDK async documentation honest until full async support is real
- fix OpenAPI spec auth header `required: false` → `true` to match runtime enforcement
- keep GitBook sync GitHub-first and stop GitBook-only README drift
- deepen RBAC role coverage and OIDC provider support

## Contribution Lanes

### `area:web`

- dashboard completeness for live routes
- better browser auth/session handling
- keep `/dashboard` and `/control` semantics clear

### `area:api`

- auth dependencies and per-user ownership checks (shipped — `get_current_user` on 146+ endpoints)
- deeper runtime-backed lifecycle semantics
- OpenAPI spec accuracy: `required: false` → `true` on auth headers
- Vault integration completion

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
