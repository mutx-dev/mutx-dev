# Implementation Brief — Runtime Health Truth Pass

Date: 2026-03-28
Owner: AI Engineer

## Lead
Surface real control-plane health in the operator layer before adding more self-heal complexity.

## Problem
`/health` already carries the useful truth: background monitor state, last success/error timing, consecutive failure count, and schema repair signals. But the operator-facing layer still flattens that into generic system/database status, and the docs still teach `/health` like a DB probe.

That creates the wrong debugging behavior: runtime degradation reads like database trouble even when the real issue is the monitor/recovery loop.

## Evidence checked
- `src/api/main.py` serializes `components.background_monitor` and `schema_repairs_applied`
- `tests/api/test_app_factory.py` proves `/health` degrades on monitor failures while `/ready` can still be healthy
- `components/dashboard/MonitoringPageClient.tsx` only shows top-level `status` and `database`
- `docs/MONITORING.md` and `docs/troubleshooting/debugging.md` still describe `/health` mostly as a basic health/DB check

## Proposed ship
1. Extend dashboard monitoring health UI to show:
   - background monitor status
   - consecutive failures
   - last success / last error timestamps
   - last error text
   - schema repairs applied
2. Keep `/ready` positioned as DB readiness only.
3. Update monitoring and debugging docs so `/health` vs `/ready` semantics match implementation.
4. Add contract coverage so this truth does not drift again.

## Acceptance criteria
- A monitor failure that degrades `/health` is visible in the dashboard without reading logs first.
- Docs explicitly say `/ready` is DB readiness and `/health` is broader control-plane truth.
- UI and docs both reflect `components.background_monitor` and `schema_repairs_applied`.
- Tests cover API payload expectations and the dashboard render path.

## Validation
- `pytest tests/api/test_app_factory.py tests/api/test_monitor.py tests/api/test_monitoring.py`
- `npm test -- dashboardRoutes`
- targeted dashboard component test for health rendering
- doc drift check if the health payload is referenced in prose

## Non-goals
- no new recovery actions
- no deployment/runtime protocol expansion
- no scheduler/RAG work in this pass

## Why this now
The recovery loop is wired enough to be worth trusting. The bigger gap is operator truth: people still cannot see quickly whether the problem is DB readiness or the background runtime monitor itself. Fix that first.