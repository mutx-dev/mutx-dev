# BACKEND UI Unblockers

Date: 2026-03-18
Context: MUTX dashboard UI port in `~/mutx-worktrees/factory/backend`.

## Prioritized Blockers

| Priority | Blocker | User-facing surface affected | Exact route/module | Why it matters | Effort |
|---|---|---|---|---|---|
| P0 | Fix unresolved alert count query (completed) | `/dashboard/monitoring` alert counters and unresolved alert visibility | `src/api/routes/monitoring.py` (`GET /v1/monitoring/alerts`) | `unresolved_count` used Python boolean negation on a SQLAlchemy column, which can miscount or break query behavior; monitoring UI trust depends on this count. | quick win |
| P0 | Normalize dashboard overview response contract | `/dashboard` overview cards (total/active agents and deployments) | `app/dashboard/page.tsx`, `app/api/dashboard/agents/route.ts`, `app/api/dashboard/deployments/route.ts` | Overview currently expects `{ agents: [...] }` and `{ deployments: [...] }` while proxies often pass raw arrays, causing empty/zero UI despite real backend data. | quick win |
| P1 | Add runs + traces dashboard proxies | `/dashboard/runs`, `/dashboard/traces` | Missing `app/api/dashboard/runs/*` BFF routes; backend exists in `src/api/routes/runs.py` (`/v1/runs`, `/v1/runs/{run_id}`, `/v1/runs/{run_id}/traces`) | Runs/traces pages are still mock-driven even though backend endpoints already exist; adding BFF routes is the clean bridge to real data. | medium |
| P1 | Add monitoring/analytics/budgets dashboard proxies | `/dashboard/monitoring`, `/dashboard/analytics`, `/dashboard/budgets` | Missing `app/api/dashboard/monitoring/*`, `app/api/dashboard/analytics/*`, `app/api/dashboard/budgets/*`; backend exists in `src/api/routes/monitoring.py`, `src/api/routes/analytics.py`, `src/api/routes/budgets.py` | These UI surfaces cannot be wired to live backend telemetry/cost data without same-origin dashboard proxy routes. | medium |
| P1 | Align deployment control semantics with UI actions | `/dashboard/deployments` card actions (`start/stop/restart`) and `/dashboard/deployments/[id]` | `components/app/DeploymentsPageClient.tsx`, `src/api/routes/deployments.py` (`/scale`, `/restart`, `/delete`) | UI currently uses `scale` with `replicas=0` as stop/start behavior, but backend semantics are deployment-status-based and not explicit stop/start for deployments; this yields confusing or brittle controls. | medium |
| P2 | Provide global logs feed endpoint for dashboard | `/dashboard/logs` | No global logs route in `src/api/routes/*`; only per-resource logs in `src/api/routes/agents.py` and `src/api/routes/deployments.py` | Logs screen needs cross-source filtering/search; current backend only supports agent/deployment-scoped logs, so UI cannot be wired cleanly. | deep |
| P2 | Provide unified history timeline endpoint | `/dashboard/history` | No dedicated history route/module; source data currently split across `DeploymentEvent`, `AgentRun`, `UsageEvent` | History UI needs one normalized event timeline for operator actions; stitching client-side from multiple endpoints is fragile and expensive. | deep |
| P2 | Persist orchestration entities (no in-memory swarms) | `/dashboard/orchestration` | `src/api/routes/swarms.py` uses in-memory `_swarms` store | Orchestration state disappears on process restart, making lane/scheduling UX non-durable and non-production-ready. | deep |
| P2 | Implement control-plane operations endpoints | `/dashboard/control` quick actions (restart/reload/toggles) | Missing route module (e.g. `src/api/routes/control.py`) and service operation contract | Control page actions are currently UI-only; without backend operations the port cannot be considered operationally complete. | deep |

## Notes

- Existing backend capability is strongest for: agents, deployments, runs/traces, analytics summary/time series, budgets, and monitoring alerts.
- The main missing bridge for the UI port is the dashboard BFF layer under `app/api/dashboard/*` for new surfaces.
- One low-risk backend bugfix was applied immediately in the backend worktree (`monitoring.py` unresolved-count predicate).
