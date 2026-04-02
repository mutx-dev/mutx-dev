# Autonomy Operating Model

## Architecture

**Hermes** is the executive brain/operator. It orchestrates work across the system, manages the backlog queue, and assigns tasks to specialist subagents. Hermes never does the work itself -- it delegates.

**OpenClaw** is the managed runtime substrate. It provides the execution environment for ephemeral specialist agents, handling sandboxing, resource limits, and tool access. OpenClaw is not a developer tool -- it is the runtime that specialist agents execute within.

## 8 Logical Delivery Lanes

Each lane is a pull-based specialist subagent that claims work from the backlog independently.

| Lane | Specialist Agent | Bounded To |
|------|-----------------|-------------|
| executive | `hermes-orchestrator` | backlog scanning, task routing, work order generation |
| backend | `backend-specialist` | API routes, services, database migrations in `src/api/` |
| frontend-dashboard | `frontend-specialist` | Dashboard UI, React components, API type consumption |
| cli-sdk | `cli-sdk-specialist` | CLI commands, SDK surface, parity with API |
| runtime-openclaw | `openclaw-runtime-specialist` | OpenClaw runtime itself, Node 22+ execution environment |
| auth-security | `auth-security-specialist` | Session management, API keys, auth contracts |
| observability | `observability-specialist` | OpenTelemetry traces, metrics, logging, dashboards |
| docs | `docs-specialist` | `.md` files in `docs/`, inline code documentation |

All 8 lanes pull from the canonical backlog queue. No lane receives work via direct handoff -- it must claim from the queue.

## Always-On Processes (Maximum 4)

Only these processes are allowed to run continuously. All others are ephemeral and terminate after completing a work item.

| Process | Function | Config Key |
|---------|----------|------------|
| executive scheduler | Polls GitHub issues every 15 min, generates work orders | `AUTONOMY_SCHEDULER_ENABLED` |
| backlog sync | Keeps local queue JSON in sync with GitHub issue state | `AUTONOMY_BACKLOG_SYNC_ENABLED` |
| release watchdog | Monitors release branches, triggers staging deploys | `AUTONOMY_RELEASE_WATCHDOG_ENABLED` |
| runtime health watchdog | Monitors OpenClaw runtime health, restarts if unhealthy | `AUTONOMY_HEALTH_WATCHDOG_ENABLED` |

These are implemented as long-running processes or scheduled workflows in `.github/workflows/`. Never add additional always-on processes without updating this document and the max-4 constraint.

## Ephemeral Agent Rules

All specialist agents except the 4 always-on processes are ephemeral:

- Each agent invocation starts, does one unit of work, and exits.
- Agents pull from the backlog independently -- no push, no handoff.
- If an agent crashes, it leaves its claim on the issue and a reviewer must release it or the stale-claim timeout (default 120 minutes) reclaims it.

## Operating Rules

1. **No asking questions.** Agents must make a best-effort decision and proceed. If information is missing, the agent must infer from existing code, tests, or documentation. If that is insufficient, the agent closes the issue with a `cannot-reproduce` or `needs-investigation` label rather than asking.

2. **No fake work.** Agents must not create branches, PRs, or comments that do not change behavior. Validation must reflect real functionality.

3. **No report-only automation.** Dashboards, metrics exports, and status reports generated automatically must be accompanied by at least one actionable response loop. A metric that no one acts on is not automation -- it is noise.

4. **GitHub issues are the canonical truth queue.** All work originates from an issue. PRs without a linked issue are rejected by policy. The queue is the single source of truth for what is in flight and what is queued.

## Queue States

An issue moves through these states:

```
autonomy:ready     -> autonomy:claimed -> (PR opened) -> autonomy:review
                                                              |
                   (stale claim) <---- autonomy:claimed <----+
                                                              |
                   (done/merged) <---- autonomy:approved <---+
                   (rejected)   <---- autonomy:needs-work <--+
```

## File Ownership By Lane

| Path | Lane |
|------|------|
| `src/api/routes/` | backend |
| `src/api/services/` | backend |
| `src/dashboard/` | frontend-dashboard |
| `src/cli/` | cli-sdk |
| `src/sdk/` | cli-sdk |
| `src/openclaw/` | runtime-openclaw |
| `src/auth/` | auth-security |
| `src/observability/` | observability |
| `docs/**/*.md` | docs |

## References

- Dispatch workflow: `.github/workflows/autonomous-dispatch.yml`
- Control tower: `.github/workflows/autonomous-shipping.yml`
- Agent registry: `agents/registry.yml`
- Scripts: `scripts/autonomy/select_agent.py`, `scripts/autonomy/build_work_order.py`, `scripts/autonomy/execute_work_order.py`
