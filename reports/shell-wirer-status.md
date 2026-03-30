# Shell Wiring Lane — Status Report

## Scope
Audit and wire orphaned port files from Mission Control into MUTX routing shell.

## Files Analyzed

### 1. `components/ui/sidebar.tsx` — PORTED ORPHANED
- **Source:** MC `dashboard/sidebar.tsx`  
- **Problem:** Wrong routes (`/app/logs` instead of `/app/observability`, `/docs` route that doesn't exist), emoji icons instead of Lucide, non-existent CSS vars (`text-muted-foreground`), inferior Tailwind pattern vs the inline nav already in the routing page
- **Inline nav in routing page:** Already correct — 7 nav items with correct MUTX routes, Lucide icons, proper dark theme (`text-slate-400`, `text-white`)
- **Decision:** DELETE. Inline nav is superior.
- **Action:** `trash components/ui/sidebar.tsx` — DONE, committed `81ed75f`

### 2. `components/app/dashboard-layout.tsx` — PORTED ORPHANED
- **Source:** MC layout (worker `b263dcf`)
- **What it does:** Wraps children with health + agents + deployments overview panel + 60s polling
- **Problem:** Uses `/api/dashboard/logs` endpoint which does NOT exist in FastAPI backend
  - Backend has: `/api/dashboard/health`, `/api/dashboard/agents`, `/api/dashboard/deployments` — all real
  - Backend is missing: `/api/dashboard/logs`
- **Decision:** KEEP ORPHANED. Blocked on FastAPI `/api/dashboard/logs` endpoint.
- **Alternative:** Could integrate SignalPill components into AppDashboardClient without full layout wrapper. Lower priority.

### 3. `components/app/log-viewer.tsx` — PORTED ORPHANED  
- **Source:** MC `panels/log-viewer-panel.tsx` (worker `5dfa3e3`)
- **What it does:** Full-featured log viewer with filters, auto-scroll, export
- **Problem:** Uses `/api/dashboard/logs` — same non-existent endpoint as above
- **Decision:** KEEP ORPHANED. Blocked on FastAPI endpoint.
- **Current state:** `LogsMetricsStateClient.tsx` uses mock data. Real logs require backend work.

## Routing Shell Assessment

`app/app/[[...slug]]/page.tsx` is complete and correct:
- `/app` → hero + AppDashboardClient ✅
- `/app/agents` → AgentsPageClient ✅
- `/app/deployments` → DeploymentsPageClient ✅
- `/app/api-keys` → ApiKeysPageClient ✅ (fixed this session — was bug)
- `/app/health` → header stub + AppDashboardClient ⚠️ (stub header only)
- `/app/webhooks` → WebhooksPageClient ✅
- `/app/observability` → LogsMetricsStateClient ✅

## Decisions Made

| File | Decision | Reason |
|------|----------|--------|
| `components/ui/sidebar.tsx` | **DELETED** | Inline nav is better |
| `components/app/dashboard-layout.tsx` | Keep orphaned | Blocked on FastAPI `/api/dashboard/logs` |
| `components/app/log-viewer.tsx` | Keep orphaned | Blocked on FastAPI `/api/dashboard/logs` |

## Blockers for Future Work

1. **FastAPI `/api/dashboard/logs` endpoint** — required before `dashboard-layout.tsx` and `log-viewer.tsx` can be wired. Add to FastAPI backlog.

## Next Lane

**Lane L2: Adapter Layer** — Create `lib/mc-adapters/` as prerequisite for all subsequent port work.

Lane complete. Commit: `81ed75f`.
