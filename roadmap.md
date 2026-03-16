# Roadmap

This roadmap is intentionally short and grounded in the code that exists today.

It is a guide for contributors, not a promise of exact delivery order.

## Principles

- Prefer current-state honesty over target-state marketing.
- Fix contracts before adding more surface area.
- Land small, reviewable slices.
- Update docs when behavior changes.

## Now

- CLI, SDK, and API contract alignment
  - remove stale `/v1` and `/api/v1` assumptions
  - fix broken create/deploy flows before adding more client features
- Real app dashboard basics
  - replace the current static app surface with authenticated agent and deployment lists
- Contact and API key workflows
  - make contact capture real
  - expose a usable API key lifecycle for automation
- Testing and CI
  - add backend route coverage
  - expand the new CI baseline with route, client, and local-first test coverage
- Local developer bootstrap
  - reduce the amount of manual `curl` setup needed to test the API locally

## Next

- Typed agent config instead of string blobs
- Deployment events and lifecycle history
- Webhook registration as a real product surface, separate from internal ingestion
- Monitoring and self-healing wired into actual runtime behavior
- Better app-side observability views for logs, metrics, and state transitions

## Later

- Execution and traces API for agent runs
- Versioning, rollback, and deploy history UX
- Quotas and plan enforcement
- Vector and RAG feature completion
- Expanded runtime support beyond the current foundations

## Shipped (Last 30 Days)

- [PR#562] fix(dashboard): trust backend ownership enforcement, remove redundant /auth/me calls - merged 2026-03-16
- [PR#553] fix(dashboard): trust backend ownership enforcement - merged 2026-03-16
- [PR#550] fix(api): use plan-based quota for API key limits - merged 2026-03-16
- [PR#541] feat(frontend): add copy ID button to API keys list - merged 2026-03-16
- [PR#540] feat(frontend): add copy ID button to agent detail page - merged 2026-03-16
- [PR#539] feat(frontend): add Deploy button for stopped agents on agent detail page - merged 2026-03-16
- [PR#537] feat(frontend): add Deploy button for stopped agents on agent detail page - merged 2026-03-16
- [PR#536] feat(api): add usage event model and tracking - merged 2026-03-16
- [PR#535] test(api): add test coverage for usage routes - merged 2026-03-16
- [PR#533] feat(webhooks): add delivery history viewing - merged 2026-03-16

## Contributor-Ready Lanes

- `area:docs`
  - keep commands and route examples aligned with the code
- `area:api`
  - route auth, ownership, typed schemas, and tests
- `area:cli`
  - fix create and deploy flows, config overrides, and auth ergonomics
- `area:sdk`
  - align defaults and supported methods to the real server contract
- `area:web`
  - turn the app surface into a real operator dashboard
- `area:testing`
  - backend tests, local-first Playwright, CI sanity checks

## Where To Look Next

- Current capability matrix: `docs/project-status.md`
- Setup and workflows: `docs/README.md`
- Contribution process: `CONTRIBUTING.md`
