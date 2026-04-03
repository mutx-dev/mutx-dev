---
description: Current implementation priorities grounded in code, OpenAPI, and tests.
icon: road
---

# Roadmap

This roadmap is intentionally short and grounded in the code that exists today.

It is a guide for contributors, not a promise of exact delivery order.

## Principles

- Prefer current-state honesty over target-state marketing.
- Fix contracts before adding more surface area.
- Land small, reviewable slices.
- Update docs when behavior changes.
- Keep GitBook rendering downstream from repo truth, not beside it.

## Now

- API, CLI, SDK, and docs contract alignment
  - keep every public example aligned with the mounted `/v1/*` contract
  - keep grouped CLI commands and compatibility aliases documented accurately
  - keep SDK async support honest while `MutxAsyncClient` remains limited
- Dashboard truth and completeness
  - keep `/dashboard` as the canonical operator surface
  - keep `/control/*` clearly marked as the demo shell
  - fill the highest-value dashboard gaps without pretending every backend feature already has a finished UI
- Docs drift and GitBook stability
  - keep `README.md` and `SUMMARY.md` repo-owned
  - preserve the current GitBook sidebar feel while removing sync-poisoning pages
  - make docs drift tests catch broken links, dead paths, and stale route claims
- Backend hardening
  - continue tightening ownership and auth enforcement across user-scoped resources
  - keep deployment lifecycle history, versions, and rollback semantics honest and tested
- Placeholder-backed subsystems
  - replace the scheduler stub with a real implementation or keep it clearly unmounted and documented
  - turn RAG search into real vector-backed behavior instead of placeholder responses
  - keep Vault integration explicitly documented as an infrastructure stub until it is real

## Next

- Webhook and API-key product depth
  - make browser and CLI flows equally trustworthy for outbound webhooks and service credentials
- Better app-side observability
  - improve logs, metrics, traces, session, and alert views in the dashboard
- Runtime-backed lifecycle semantics
  - keep deployment versions, rollback, and restart behavior tied to real execution posture
- Local operator ergonomics
  - keep the hosted and local setup lanes recoverable when installs, migrations, or stale local state drift

## Later

- Quotas and plan enforcement beyond the current foundations
- Deeper run and trace workflows
- Expanded runtime support beyond the current OpenClaw-first path
- Broader tenant and secret-management hardening once Vault and deeper infra automation are real

## Shipped (Last 30 Days)

- `2026-03-22` Prepare `v1.1` and CLI `0.2.1` release
- `2026-03-22` Fix local demo bootstrap and migration flow
- `2026-03-21` Simplify quickstart and bootstrap the localhost lane from docs truth
- `2026-03-21` Stabilize control and live route surfaces for the dashboard
- `2026-03-21` Add OpenClaw import flow, provider wizard, runtime tracking, and suspended handoff
- `2026-03-20` Build the public browser control-plane demo and rename stale internal app routes
- `2026-03-20` Simplify installer handoff and bootstrap local operator auth
- `2026-03-19` Add one-command TUI bootstrap and operator packaging work
- `2026-03-19` Enforce ownership on all agent endpoints
- `2026-03-19` Make `/dashboard` the canonical operator surface and collapse stale app routes

## Contributor-Ready Lanes

- `area:docs`
  - keep commands and route examples aligned with the code
  - keep GitBook sync GitHub-first and repo-owned
- `area:api`
  - route auth, ownership, typed schemas, placeholder reduction, and tests
- `area:cli`
  - setup ergonomics, grouped command docs, config overrides, and auth ergonomics
- `area:sdk`
  - align defaults and supported methods to the real server contract
  - keep async support and docs honest
- `area:web`
  - deepen the dashboard without blurring the line between live UI and demo UI
- `area:testing`
  - backend tests, docs drift checks, local-first Playwright, and CI sanity checks

## Where To Look Next

- Current capability matrix: `project-status.md`
- Setup and workflows: `README.md`
- Contribution process: `../CONTRIBUTING.md`
