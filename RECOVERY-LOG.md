# MUTX RECOVERY LOG
**Started: 2026-03-18 16:00 GMT+1**
**Last updated: 2026-03-18 16:45 GMT+1**

---

## MOVE 1 — FIX THE PORTING WORKER
**Status: COMPLETE ✅**

### Root Cause
Old worker `mutx-ui-porting-v2` used `~/mutx-worktrees/factory/ship/` paths. Isolated cron sessions are sandboxed to `~/.openclaw/workspace/`. The worktree lives outside the sandbox. The `edit` tool was blocked at the sandbox boundary before reaching file content. 6 consecutive identical failures.

### Fix Applied
- Removed `mutx-ui-porting-v2`
- Created `mutx-ui-porting-v3` (id: `8d84e720-cb34-46a0-b801-112dc007e4f1`)
  - Same cadence: every 30 min
  - Same session: isolated (agentTurn requires isolated)
  - **Changed paths** from `~/mutx-worktrees/factory/ship/` → `~/.openclaw/workspace/`
  - **Shortened prompt** (was 500+ words, now ~100 words)
  - **Increased timeout**: 600s → 900s
  - mutx-control source at `/tmp/mutx-control/src/` (accessible from isolated)

### Proof of Success
- Worker run completed successfully
- Commit `b263dcf ui: port dashboard-layout` — 237 lines, new file `components/app/dashboard-layout.tsx`
- Author: Fortune <mbarbetti@gmail.com> (worker identity)
- Timestamp: Wed Mar 18 16:40:35 2026 +0100
- File includes: `HealthResponse`, `AgentResponse`, `DeploymentResponse` types wired to MUTX API
- SignalPill component adapted from mutx-control with MUTX type system

### Deletion Audit
| File | Removed | Proof | Verdict |
|------|---------|-------|---------|
| `components/ui/widget-grid.tsx` | YES | 0 imports anywhere | Keep removed ✅ |
| `components/ui/stat-card.tsx` | YES | 0 imports anywhere | Keep removed ✅ |
| `components/ui/Card.tsx` | NO | Orphaned but harmless | Keep as-is |
| `components/ui/Section.tsx` | NO | Orphaned but harmless | Keep as-is |
| `components/ui/sidebar.tsx` | NO | Orphaned but harmless | Keep as-is |

---

## MOVE 2 — WIRE DASHBOARD TO REAL API
**Status: COMPLETE ✅**

### Live Dashboard Entrypoints
| Route | Component | Status |
|-------|----------|--------|
| `/app` | Landing section + `AppDashboardClient` | ✅ Wired |
| `/app/agents` | `AgentsPageClient` | ✅ Wired |
| `/app/deployments` | `DeploymentsPageClient` | ✅ Wired |
| `/app/api-keys` | `ApiKeysPageClient` | ✅ Fixed (was bug) |
| `/app/health` | Header + AppDashboardClient | ⚠️ Stub header |
| `/app/webhooks` | `WebhooksPageClient` | ✅ Wired |
| `/app/observability` | `LogsMetricsStateClient` | ✅ Wired |

### Endpoints Used
| Endpoint | Used by | Status |
|----------|---------|--------|
| `/api/dashboard/agents` | AppDashboardClient, AgentsPageClient | ✅ Real |
| `/api/dashboard/deployments` | AppDashboardClient, DeploymentsPageClient | ✅ Real |
| `/api/dashboard/health` | AppDashboardClient | ✅ Real |
| `/api/api-keys` | AppDashboardClient, ApiKeysPageClient | ✅ Real |

### Routing Fix Applied
- **Bug fixed**: `/app/api-keys` was rendering `AppDashboardClient` instead of `ApiKeysPageClient`
- Committed: `91d8eca fix: wire /app/api-keys to ApiKeysPageClient`

### Remaining Issues
- `/app/health` header-only stub (low priority — health endpoint itself is wired via AppDashboardClient)

---

## MOVE 3 — EMPTY STATES
**Status: IN PROGRESS (subagent running)**
- Subagent: `agent:main:subagent:40f7d32d-4cf3-4a68-b9fc-e087ecb2a2e4`
- Model: `MiniMax-M2.7` confirmed

## MOVE 4 — HEAL PRs
**Status: IN PROGRESS (subagent running)**
- Subagent: `agent:main:subagent:2ebad1bd-f8df-4e9b-84d2-72904467c736`
- Model: `MiniMax-M2.7` confirmed

## MOVE 5 — HOMEPAGE + README
**Status: IN PROGRESS (subagent running)**
- Subagent: `agent:main:subagent:d0b9fa88-96e8-4282-a42a-6c4e93767b4f`
- Model: `MiniMax-M2.7` confirmed

---

## COMMITS THIS SESSION
1. `1c469d8` ui: remove dead port artifacts
2. `d931990` ui: improve empty states with OpenClaw workspace entry CTAs
3. `a49c11e` docs: rewrite homepage hero + README positioning
4. `b263dcf` ui: port dashboard-layout (worker — first success)
5. `91d8eca` fix: wire /app/api-keys to ApiKeysPageClient
