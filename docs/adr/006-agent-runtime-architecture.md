# ADR 006: Agent and deployment lifecycle authority

## Status

Accepted. This revision supersedes the 2024-04-01 proposal for layered runtime,
EvalView, and timer-based self-healing services.

## Date

2026-10-01

## Context

Agent creation, registration, deployment routes, ingest endpoints, runtime
heartbeats, and the background monitor had independent writes to lifecycle
status. Database intent could therefore appear as successful execution, an
unbound heartbeat could promote whichever deployment was newest, and a listener
heartbeat could hide stale work. The existing command listener has no lifecycle
command producer, so no route may imply that a requested operation was executed.

## Decision

1. Keep `src/api/domain/lifecycle.py` pure. It computes lifecycle policy without
   importing HTTP, ORM, CLI, SDK, or UI modules.
2. Make `src/api/services/deployment_lifecycle.py` the single database-backed
   transition owner. Routes preserve namespaces, IDs, request shapes, ownership
   checks, and role requirements; they call this owner instead of changing agent
   or deployment lifecycle fields.
3. Preserve existing `status` values and add `desired_action`, `desired_state`,
   `observed_state`, `target_revision`, `observed_revision`, and `observed_at`.
   Migration leaves historic desired and observed evidence null and does not
   rewrite historic statuses.
4. A deployment observation is accepted only when an authenticated heartbeat
   names that deployment and its current target revision. An Agent-scoped
   heartbeat may update a standalone agent at the current Agent revision; it
   cannot complete any deployment. `command_listener` heartbeats only refresh
   liveness. User-authenticated ingest stays reported history.
5. A target transition uses a row lock and revision compare-and-swap. A delayed
   observation for an older revision cannot complete a newer intent. Agent
   state is aggregated from current target-bound observations, not deployment
   creation order.
6. Agent-wide stop stamps a persistent fence revision onto each active,
   pending, and ready target. Target actions preserve the fence. Current-revision
   stopped evidence for every fenced target completes the stop; a later explicit
   deployment create/deploy intent supersedes it. A newer global stop advances
   all affected revisions so older evidence cannot complete it.
7. The stale monitor rechecks `observed_at` and target revision under the same
   target lock before failing work. It does not provision, restart, or infer
   recovery from elapsed time. A matching, current runtime report can reconcile
   that target and its alert.
8. Lifecycle writes and history events stay in the same database transaction.
   Webhooks remain best-effort notifications and cannot turn an intent into
   runtime evidence.

## Consequences

- Creation, start, restart, stop, scale, termination, and rollback can remain
  pending until an executor reports matching evidence.
- Agent-key clients can read lifecycle fields from registration and status
  responses and must pass revisions explicitly. Heartbeat helpers must not
  silently adopt a newer revision for work that they did not perform.
- Existing IDs, route paths, status vocabulary, event history, and owner checks
  remain intact. Historical `observed_*` values are unknown until new evidence
  arrives.
- No dispatcher, simulator, retry framework, secondary run store, or automatic
  timer recovery is introduced. The API reports a pending or unavailable action
  while no supported executor can acknowledge it.
- Downgrade refuses to remove lifecycle columns after new intent or observed
  evidence has been recorded.

## Alternatives considered

- Treating row creation, ingest reports, or any authenticated heartbeat as proof
  of deployment readiness was rejected because those inputs are not bound to the
  requested target revision.
- Promoting the latest deployment was rejected because creation order does not
  identify the target that sent evidence.
- Restarting or recreating deployments from a timer was rejected because no
  supported executor acknowledgement establishes that work was dispatched.
- A second transition store or dependency-injection layer was rejected; the
  existing SQLAlchemy session and one lifecycle service provide the transaction
  and ownership boundary.

## References

- [Agent API](../api/agents.md)
- [Agent runtime architecture](../architecture/agent-runtime.md)
