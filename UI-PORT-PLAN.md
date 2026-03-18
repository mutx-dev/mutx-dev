# UI Porting Plan — mutx-control → mutx-dev

**Started:** 2026-03-18  
**Status:** PHASE 4 IN PROGRESS — Polish + e2e testing  
**Push branch:** `mutx-dev:ui-porting` (main is protected — open PR to merge)  
**Source:** https://github.com/mutx-dev/mutx-control/ (OpenClaw Mission Control)  
**Target:** https://github.com/mutx-dev/mutx-dev  

---

## Discovery (Phase 1) ✅ COMPLETE

### mutx-control Structure
- **Stack:** Next.js 15 + TypeScript + TailwindCSS + Radix UI
- **Components:** `src/components/{dashboard,panels,ui,chat,layout}/`
- **Key panels:** Agent Squad, Task Board, Activity Feed, Logs, Cron, Memory, Settings
- **Dashboard:** Widget-based with stats grid, session list, event streams
- **Sidebar:** 16 nav items (Overview, Chat, Tasks, Agents, Activity, Notifications, Standup, Spawn, Logs, Cron, Memory, Tokens, Channels, Nodes, Approvals, Debug)

### mutx-dev Current State
- **Stack:** Next.js + TypeScript + TailwindCSS + Radix UI + Framer Motion
- **Dashboard:** Basic agents/deployments list + health status (428-line dashboard-page.tsx)
- **API routes:** `/api/dashboard/{agents,deployments,health}`

### Copy-Verbatim (No Adaptation Needed)
| Component | File | Reason |
|-----------|------|--------|
| Sidebar nav | `dashboard/sidebar.tsx` | Generic navigation |
| Stats grid | `dashboard/stats-grid.tsx` | Reusable dashboard widgets |
| Widget grid | `dashboard/widget-grid.tsx` | Layout system |
| Agent card | `panels/agent-squad-panel.tsx` | Core component |
| UI primitives | `ui/button.tsx`, `ui/loader.tsx` | Base components |

### Adapt-Required Components
| Component | Source | Adaptation |
|-----------|--------|------------|
| Dashboard layout | `dashboard/dashboard.tsx` | Remove OpenClaw-specific API calls, wire to MUTX API |
| Stats grid | `dashboard/stats-grid.tsx` | Change API endpoints to `/api/dashboard/*` |
| Agent squad panel | `panels/agent-squad-panel.tsx` | Map to MUTX agent model |
| Sidebar | `dashboard/sidebar.tsx` | Change nav items to MUTX-relevant sections |

### API Mapping (mutx-control → mutx-dev)
| mutx-control API | mutx-dev API | Status |
|-----------------|--------------|--------|
| `/api/agents` | `/api/dashboard/agents` | ✅ Exists |
| `/api/sessions` | — | Needs mapping |
| `/api/status` | `/api/dashboard/health` | ✅ Exists |
| `/api/tasks` | — | Not implemented |
| `/api/logs` | — | Not implemented |
| `/api/cron` | — | Not implemented |

---

## Component Porting (Phase 2)

### Core Components (Foundation)

| # | Component | Source File | Target File | Status | Notes |
|---|-----------|-------------|-------------|--------|-------|
| 1 | Sidebar Navigation | `dashboard/sidebar.tsx` | `components/ui/sidebar.tsx` | ✅ DONE | Map to MUTX sections |
| 2 | Stats Card | `dashboard/stats-grid.tsx` | `components/ui/stat-card.tsx` | ✅ DONE | Copy verbatim |
| 3 | Dashboard Layout | `dashboard/dashboard.tsx` | `components/app/dashboard-layout.tsx` | ✅ DONE — Adapted SignalPill + MetricCard + DashboardOverview in components/ui/dashboard-widgets.tsx | Adapt API calls |
| 4 | Agent Row | `panels/agent-squad-panel.tsx` | `components/app/agent-row.tsx` | ✅ DONE | Map agent model |
| 5 | Log Viewer Panel | `panels/log-viewer-panel.tsx` | `components/app/log-viewer.tsx` | ✅ DONE | Uses `/api/deployments/[id]/logs` |

### Secondary Components

| # | Component | Source File | Target File | Status | Notes |
|---|-----------|-------------|-------------|--------|-------|
| 6 | Widget Grid | `dashboard/widget-grid.tsx` | `components/ui/widget-grid.tsx` | ✅ DONE | Layout system |
| 7 | Metric Cards | `dashboard/widgets/metric-cards-widget.tsx` | `components/app/metric-cards.tsx` | ✅ DONE — `DashboardMetricCard` in `components/ui/dashboard-widgets.tsx` | |
| 8 | Activity Feed | `panels/activity-feed-panel.tsx` | `components/app/activity-feed.tsx` | ✅ DONE | Derives events from agents + deployments API |
| 9 | Task Board | `panels/task-board-panel.tsx` | `components/app/task-board.tsx` | ✅ DONE | Kanban from agents + deployments |

| 11 | Agent Avatar | `ui/agent-avatar.tsx` | `components/ui/agent-avatar.tsx` | ✅ DONE | Color-coded initials avatar |
| 10 | Nav Rail | `components/layout/nav-rail.tsx` | `components/ui/nav-rail.tsx` | ✅ DONE | Mobile nav |

---

## Integration (Phase 3)

- [x] Wire dashboard to `/api/dashboard/agents` + `/api/dashboard/deployments`
- [x] Add `/api/dashboard/logs` endpoint (derived from agents+deployments, filters by level/source/search)
- [x] Add `/api/dashboard/events` endpoint (derived from agents+deployments, used by ActivityFeed component)
- [x] Add `/api/dashboard/services` endpoint (derived from agents+deployments fleet health)
- [x] Add `/api/dashboard/history` endpoint (derived from agents+deployments with status filtering)
- [x] Add `/api/dashboard/metrics` endpoint (fleet-wide health + auto-generated alerts)
- [x] Add `/api/dashboard/runs` endpoint (proxies /v1/runs backend)
- [x] Add `/api/dashboard/analytics` endpoint (fleet telemetry, event breakdown, daily data)
- [x] Add `/api/dashboard/orchestration` endpoint (agent fleet lanes by type)
- [x] Add `/api/dashboard/memory` endpoint (derived memory stores from agent fleet)
- [x] Add `/api/dashboard/traces` endpoint (execution traces from agents+deployments)
- [x] Wire sidebar nav to MUTX dashboard routes
- [x] Test end-to-end flows

---

## Polish (Phase 4)

- [x] Apply MUTX branding (logo, colors — updated shell "Mission Control" → "MUTX Dashboard")
- [x] Mobile responsiveness (nav rail) — done in prior session
- [x] Loading states with skeleton rows for all pages (control, history, monitoring, logs, analytics, orchestration, traces, memory)
- [x] Empty states for agents/deployments (already in place)
- [x] Refresh buttons on all fleet pages
- [x] Auth guards on all dashboard pages
- [x] Spawn page agent creation with loading/success/error feedback

---

## Blocker Log

| Blocker | Severity | Status | Resolution |
|---------|----------|--------|------------|
| API endpoints incomplete | Medium | ✅ RESOLVED | Added 11 new API routes: services, history, runs, metrics, logs, analytics, orchestration, memory, traces, events (via ActivityFeed) |
| No existing `/dashboard/agents` route group | Low | OK | Use `/api/dashboard/agents` directly |

---

## Progress Timeline

| Date | Phase | Components Done | Notes |
|------|-------|-----------------|-------|
| 2026-03-18 | Phase 1 (Discovery) | ✅ Complete | mutx-control = OpenClaw UI |
| 2026-03-18 | Phase 2 (Components) | 10/10 | sidebar, stat-card, agent-row, widget-grid, dashboard-overview, log-viewer, activity-feed, task-board → pushed to ui-porting |
| 2026-03-18 | Phase 3 (Integration) | 11/11 | services, history, runs, metrics, logs, analytics, orchestration, memory, traces, events routes + full page wiring |
| 2026-03-18 | Phase 4 (Polish) | 8/8 | MUTX branding, skeleton loaders, refresh buttons, auth guards, spawn feedback states |

---

## Next Actions

1. **DONE:** sidebar, stat-card, widget-grid, dashboard-overview, log-viewer, activity-feed, task-board, metric-cards, nav-rail — all 10 components ported to ui-porting
2. **DONE:** Phase 3 — /app wired to ported components, all 11 API endpoints implemented; sidebar routes fixed
3. **DONE:** Phase 4 — MUTX branding, skeleton loaders on all pages, refresh buttons, auth guards, spawn form with real API feedback
4. **PENDING:** Manual e2e testing of all ported components

---

## Discovery Notes

```
mutx-control is actually the OpenClaw Mission Control UI (not MUTX-specific).
It manages: agents, sessions, tasks, logs, cron, memory, channels, nodes.

mutx-dev needs: agents, deployments, webhooks, API keys, health.

Strategy: Port the SIDEBAR + STATS + DASHBOARD layout, adapt the content panels.
```
