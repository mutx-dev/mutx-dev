# Observability Dashboard Phase 1

## Current State

- `components/dashboard/ObservabilityPageClient.tsx` is a runs-only client. It loads `/api/dashboard/observability?limit=50`, renders a list and a single selected run, and treats auth failures separately from generic load errors.
- `app/api/dashboard/observability/route.ts` is a thin proxy to `/v1/observability/runs` with a default `limit=50`.
- `src/api/routes/telemetry.py` already exposes `/v1/telemetry/config` and `/v1/telemetry/health`, but the dashboard does not surface them yet.
- Nearby dashboard surfaces already aggregate multiple backend resources from one shell, especially `components/dashboard/MonitoringPageClient.tsx`, `components/dashboard/TracesPageClient.tsx`, and `app/api/dashboard/overview/route.ts`.

## Decision

Keep the first observability slice server-aggregated in the dashboard proxy layer.

That means phase 1 should widen `/api/dashboard/observability` into a single operator summary that combines run history with telemetry config and health, while leaving `ObservabilityPageClient` as a mostly presentational consumer. This matches the existing dashboard pattern, keeps auth and upstream failure handling centralized, and avoids turning the client into a fan-out coordinator.

## Implementation Map

- `app/api/dashboard/observability/route.ts`: extend the proxy to fetch `/v1/observability/runs`, `/v1/telemetry/config`, and `/v1/telemetry/health`, then normalize them into one response shape. Preserve upstream status codes and keep the default run limit.
- `components/dashboard/ObservabilityPageClient.tsx`: consume the aggregated payload, add compact telemetry summary cards, and keep the current run list/detail layout.
- `src/api/routes/telemetry.py`: no new endpoint is required for phase 1; reuse the current config and health routes as the source of truth.
- Reference patterns: `components/dashboard/MonitoringPageClient.tsx` for dual-resource loading, `components/dashboard/TracesPageClient.tsx` for dashboard drill-down, `app/api/dashboard/overview/route.ts` for multi-resource proxy aggregation, and `components/dashboard/livePrimitives.tsx` for the shared panel/stat layout.

## Phased Build Sequence

1. Phase 1: widen the dashboard proxy response and keep a backward-compatible `items` field for runs.
2. Phase 2: add telemetry/exporter status, health wording, and a small alerting summary when observability is degraded or disabled.
3. Phase 3: add tests for the proxy shape, client loading states, and auth/error handling, then update the operator docs if the dashboard contract changes.

## Risks

- The response shape will diverge from the current runs-only contract, so compatibility fields are needed during rollout.
- Telemetry can be configured without being healthy, so the UI needs to separate configuration status from reachability.
- Aggregating multiple upstream calls can blur partial failures if one source succeeds and another fails; the proxy should keep error reporting explicit.

## Validation

- Compare the implementation against `components/dashboard/MonitoringPageClient.tsx`, `components/dashboard/TracesPageClient.tsx`, and `app/api/dashboard/overview/route.ts` before wiring the new payload.
- Confirm the dashboard proxy still defaults to `limit=50` and still returns a stable operator-facing JSON payload for existing runs consumers.
