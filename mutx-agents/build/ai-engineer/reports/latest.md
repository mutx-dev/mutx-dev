# latest.md — AI Engineer

- **Lead:** The highest-leverage build move now is a runtime health truth pass, not deeper self-heal logic.
- **What I checked:** `src/api/main.py`, `tests/api/test_app_factory.py`, `tests/api/test_monitor.py`, `tests/api/test_monitoring.py`, `components/dashboard/MonitoringPageClient.tsx`, `app/api/dashboard/health/route.ts`, `docs/MONITORING.md`, `docs/troubleshooting/debugging.md`, and the current API/docs mirrors.
- **Runtime truth:** The control plane already exposes `components.background_monitor` and `schema_repairs_applied` on `/health`, and tests already prove `/health` can degrade while `/ready` stays DB-ready.
- **Current drift:** The dashboard monitoring UI still reduces health to top-level system/database status, and the monitoring/debugging docs still teach `/health` like a basic DB probe. That means operators can see degradation without seeing the actual failing component.
- **Concrete improvement:** Ship the runtime health truth pass captured in `implementation-brief.md`: surface background monitor state, failure streak, last success/error, and schema repairs in the operator layer; keep `/ready` as DB-readiness only; add contract tests so the semantics stop drifting.
- **Why this matters:** This is the cleanest path to close the remaining issue #39-style trust gap. The recovery loop exists; the operator truth layer is what is still weak.
- **Status:** Queue updated around this pass. No durable memory fact added today.