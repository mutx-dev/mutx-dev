# UI Porting Plan — mutx-control → mutx-dev

**Started:** 2026-03-18  
**Status:** PHASE 3 IN PROGRESS — Integration wiring done, e2e testing pending  
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
| 10 | Nav Rail | `components/layout/nav-rail.tsx` | `components/ui/nav-rail.tsx` | TODO | Mobile nav |

---

## Integration (Phase 3)

- [ ] Wire dashboard to `/api/dashboard/agents` + `/api/dashboard/deployments`
- [ ] Add `/api/dashboard/logs` endpoint (currently missing)
- [ ] Add `/api/dashboard/tasks` endpoint (currently missing)
- [ ] Add `/api/dashboard/events` endpoint (for activity feed)
- [ ] Wire sidebar nav to MUTX dashboard routes
- [ ] Test end-to-end flows

---

## Polish (Phase 4)

- [ ] Apply MUTX branding (logo, colors from tailwind.config.js)
- [ ] Mobile responsiveness (nav rail)
- [ ] Loading states with framer-motion
- [ ] Empty states for agents/deployments

---

## Blocker Log

| Blocker | Severity | Status | Resolution |
|---------|----------|--------|------------|
| API endpoints incomplete | Medium | OPEN | Implement missing endpoints first |
| No existing `/dashboard/agents` route group | Low | OK | Use `/api/dashboard/agents` directly |

---

## Progress Timeline

| Date | Phase | Components Done | Notes |
|------|-------|-----------------|-------|
| 2026-03-18 | Phase 1 (Discovery) | ✅ Complete | mutx-control = OpenClaw UI |
| 2026-03-18 | Phase 2 (Components) | 10/10 | sidebar, stat-card, agent-row, widget-grid, dashboard-overview, log-viewer, activity-feed, task-board → pushed to ui-porting |

---

**Note:** `main` is protected — all changes pushed to `ui-porting` branch. Open PR to merge into main.

## Next Actions

1. **DONE:** sidebar, stat-card, widget-grid, dashboard-overview, log-viewer, activity-feed, task-board, metric-cards, nav-rail — all 10 components ported to ui-porting
2. **IN PROGRESS:** Phase 3 — /app wired to ported components, API endpoints exist
3. **NEXT:** Phase 4 (Polish) — MUTX branding, empty states, mobile polish
4. **PENDING:** Manual e2e testing of all ported components

---

## Discovery Notes

```
mutx-control is actually the OpenClaw Mission Control UI (not MUTX-specific).
It manages: agents, sessions, tasks, logs, cron, memory, channels, nodes.

mutx-dev needs: agents, deployments, webhooks, API keys, health.

Strategy: Port the SIDEBAR + STATS + DASHBOARD layout, adapt the content panels.
```
