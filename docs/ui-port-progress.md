# UI Port Spec & Progress

Last updated: 2026-04-16

## Architecture Summary

### Mission-Control Architecture
- **Routing**: Single catch-all route `src/app/[[...panel]]/page.tsx` — SPA-like panel switching via URL ↔ Zustand sync
- **State**: Single Zustand store (`src/store/index.ts`, ~1100 LOC) with `subscribeWithSelector` — 15+ domain interfaces, 20+ actions
- **Design Tokens**: HSL triplet system (`src/styles/design-tokens.ts`) — voidPalette, voidAccents, statusColors, surfaces, spacing, radius, fonts; `hsl()`/`hslRaw()` helpers
- **Navigation**: URL-driven with aggressive prefetching (`src/lib/navigation.ts`) — 7 core panels prefetched on every route change
- **Polling**: Visibility-aware `useSmartPoll` hook (`src/lib/use-smart-poll.ts`) — backoff, WS/SSE pause signals, manual trigger
- **Real-time**: Triple layer — WebSocket (gateway) + SSE (local DB events) + smart polling (fallback)
- **Boot**: 9-step parallel initialization (auth → capabilities → config → connect → agents/sessions/projects/memory/skills)
- **Layout**: Three-column — NavRail (left) + HeaderBar + ContentRouter (center) + LiveFeed (right); ChatPanel overlay

### MUTX Current Architecture
- **Routing**: Next.js App Router with 28 separate page routes under `app/dashboard/` — each is a full page load
- **State**: Pure React Context/hooks — **no Zustand, no global store**. State is local to component trees
- **Design Tokens**: CSS custom-property token system (`components/dashboard/tokens.ts`) — 30+ tokens + statusTokens; uses `var()` with hardcoded fallbacks
- **Navigation**: `DashboardShell` (592 LOC) with inline `DashboardNav`, grouped sidebar from `dashboardNav.ts`; has `components/ui/nav-rail.tsx` (17KB, partially implemented)
- **Polling**: **None** — no smart polling or adaptive refresh pattern exists
- **Real-time**: **None** — no WebSocket, SSE, or real-time patterns in frontend code
- **Boot**: Desktop status provider chain — no parallel data boot sequence
- **Layout**: DashboardShell with sidebar + topbar + content; mobile drawer; desktop native shell branch

### Key Structural Differences
| Aspect | Mission-Control | MUTX | Gap |
|--------|----------------|------|-----|
| Routing | Single catch-all, panel switch | 28 separate page routes | L — needs SPA shell |
| State management | Zustand single store | React Context only | L — needs store layer |
| Design tokens | HSL triplets + helpers | CSS var tokens | S — similar, needs alignment |
| Real-time | WS + SSE + smart poll | None | L — needs full real-time layer |
| Boot sequence | 9-step parallel init | Desktop provider chain | M — needs data boot |
| Navigation | Prefetch + transition | Standard Next.js links | M — needs prefetch layer |
| Plugin system | Dynamic panel loading | None | M — extensibility gap |

---

## Component Port Spec

### 1. Zustand Store (`useMissionControl`)
- **MC Source**: `src/store/index.ts` (~1100 LOC)
- **MUTX Equivalent**: **MISSING** — no global store exists
- **Gap**: Entire state management layer absent. MUTX uses scattered React Context providers (DesktopStatusProvider, DesktopWindowProvider, DesktopJobProvider) with no centralized state.
- **Port Scope**: **L** — Create new `lib/store.ts` with Zustand. Must define 15+ domain interfaces (Session, LogEntry, CronJob, Agent, Task, Activity, Notification, etc.), 20+ actions, connection state, boot state, navigation state. Adapt MC's store shape to use MUTX API endpoints (`/v1/*` routes).
- **Dependencies**: None (this is the foundation)
- **API Surface**: All MUTX `/v1/*` endpoints — agents, sessions, tasks, activities, notifications, cron, memory, skills, settings, auth/me
- **Design Details**: Uses `subscribeWithSelector` middleware for fine-grained subscriptions. Task has 9-status workflow + 5 priority levels + GitHub sync fields.
- **Priority**: **critical** — blocks all other porting work
- **Status**: spec'd

### 2. SPA Shell & Panel Router (`ContentRouter`)
- **MC Source**: `src/app/[[...panel]]/page.tsx` — ContentRouter component
- **MUTX Equivalent**: `components/dashboard/DashboardShell.tsx` (592 LOC) — has sidebar+content but no panel routing
- **Gap**: MUTX uses 28 separate Next.js page routes. MC uses a single catch-all with a switch-based `ContentRouter`. MUTX needs to either: (a) adopt catch-all routing, or (b) add panel routing awareness to DashboardShell.
- **Port Scope**: **L** — Create `app/dashboard/[[...panel]]/page.tsx` or refactor DashboardShell to include ContentRouter. Map 28 routes to ~30 MC panels. Add Essential vs Full interface modes.
- **Dependencies**: Zustand store (#1)
- **API Surface**: `/api/auth/me`, `/api/capabilities`, `/api/settings`
- **Design Details**: Boot sequence with 9 steps, Promise.allSettled for parallel data preload, ErrorBoundary per panel, essential mode panel gating, plugin extensibility via `renderPluginPanel()`.
- **Priority**: **critical** — core architecture change
- **Status**: spec'd

### 3. Design Token System
- **MC Source**: `src/styles/design-tokens.ts` — HSL triplet tokens
- **MUTX Equivalent**: `components/dashboard/tokens.ts` — CSS var tokens
- **Gap**: Different token formats and naming. MC uses HSL triplets with `hsl()`/`hslRaw()` helpers for alpha support. MUTX uses CSS custom properties with hardcoded fallbacks. MC has explicit surface elevation scale (0-3), spacing scale, radius scale, font references. MUTX tokens are more ad-hoc.
- **Port Scope**: **S** — Extend `tokens.ts` with MC's patterns: add HSL triplet helper functions, surface elevation scale, spacing scale, explicit accent palette (cyan/mint/amber/violet/crimson). Keep existing token names for backward compatibility.
- **Dependencies**: None
- **API Surface**: N/A
- **Design Details**: MC uses `satisfies Record<string, HSL>` for type safety, `as const` for deep readonly. `hsl(color, alpha?)` returns CSS string. `hslRaw(color)` returns raw HSL for CSS variable values. Palette: void (#07090C bg), card (#0F141C), primary (#22D3EE cyan). Accent: cyan, mint, amber, violet, crimson. Surfaces: 4-level elevation. Spacing: 4/8/16/24/32/48px.
- **Priority**: **medium** — visual consistency, not blocking
- **Status**: spec'd

### 4. Navigation System
- **MC Source**: `src/lib/navigation.ts` — panelHref, useNavigateToPanel, usePrefetchPanel
- **MUTX Equivalent**: `components/dashboard/dashboardNav.ts` — nav config + helpers; `components/ui/nav-rail.tsx` — nav rail UI
- **Gap**: MUTX has nav config and sidebar rendering but lacks: (1) prefetch system, (2) `panelHref` URL helper, (3) `useNavigateToPanel` hook with transition wrapping, (4) route deduplication, (5) navigation timing.
- **Port Scope**: **M** — Create `lib/navigation.ts` with `panelHref()`, `useNavigateToPanel()`, `usePrefetchPanel()`. Add default prefetch panel list. Integrate with store for `activeTab` sync.
- **Dependencies**: Zustand store (#1)
- **API Surface**: N/A (internal routing)
- **Design Details**: `panelHref()` normalizes 'overview' → '/'. `useNavigateToPanel()` uses `startTransition()` + `router.push(href, { scroll: false })`. Dedup via `PREFETCHED_ROUTES` Set. Default prefetch: overview, chat, tasks, agents, activity, notifications, tokens.
- **Priority**: **high** — UX performance
- **Status**: spec'd

### 5. Smart Polling Hook
- **MC Source**: `src/lib/use-smart-poll.ts` — useSmartPoll
- **MUTX Equivalent**: **MISSING** — no polling abstraction
- **Gap**: No visibility-aware polling exists. Components likely either don't refresh or use ad-hoc intervals.
- **Port Scope**: **M** — Create `lib/use-smart-poll.ts` with full SmartPoll pattern: visibility API, WS/SSE pause signals, progressive backoff (0.5x increment, 3x cap), initial bootstrap fetch, manual trigger return.
- **Dependencies**: Zustand store (#1) for `connection.isConnected`, `connection.sseConnected`
- **API Surface**: N/A (hook abstraction)
- **Design Details**: Interface: `SmartPollOptions { pauseWhenConnected?, pauseWhenDisconnected?, pauseWhenSseConnected?, backoff?, maxBackoffMultiplier?, enabled? }`. Returns manual trigger function. Uses refs for callback/interval/backoff/visibility/initialFired.
- **Priority**: **high** — data freshness foundation
- **Status**: spec'd

---

## MUTX Files to Create/Modify

| File | Action | Depends On |
|------|--------|------------|
| `lib/store.ts` | create | — |
| `lib/use-smart-poll.ts` | create | Zustand store |
| `lib/navigation.ts` | create | Zustand store |
| `components/dashboard/tokens.ts` | modify | — |
| `app/dashboard/[[...panel]]/page.tsx` | create | Zustand store, navigation, tokens |
| `app/dashboard/layout.tsx` | modify | SPA shell |
| `components/dashboard/DashboardShell.tsx` | modify | SPA shell, store, navigation |

## Recommended Implementation Order

1. **Zustand Store** (`lib/store.ts`) — Foundation for everything else. Define all interfaces, state shape, actions. Wire to MUTX `/v1/*` API endpoints.
2. **Design Token Alignment** (`components/dashboard/tokens.ts`) — Add HSL helpers, surface scale, accent palette. No dependencies, can be done in parallel.
3. **Smart Poll Hook** (`lib/use-smart-poll.ts`) — Needs store for connection state. Low risk, high value.
4. **Navigation System** (`lib/navigation.ts`) — Needs store for activeTab. Enables SPA-like transitions.
5. **SPA Shell / ContentRouter** — Needs store + navigation + tokens. Largest change. Consider feature flag to switch between old multi-page and new SPA modes.

## Engineering Notes

1. **API Mapping**: MC calls `/api/*` routes (e.g., `/api/auth/me`, `/api/agents`). MUTX uses `/v1/*` routes via FastAPI backend. The store must map MC's fetch calls to MUTX's endpoints.
2. **No Real-time Yet**: MC's store has `connection.isConnected` and `connection.sseConnected` state. MUTX has no WebSocket/SSE layer yet. The store should still define this state shape but with stubs initially.
3. **Desktop Branch**: MUTX's DashboardShell has a desktop (Electron) branch that MC doesn't have. The SPA shell must preserve desktop detection and native shell rendering.
4. **Essential vs Full Mode**: MC gates panels by interface mode. MUTX doesn't have this concept yet — needs store state + UI gating.
5. **28 → ~30 Routes**: MUTX has 28 dashboard pages. MC has ~30 panels. Not all map 1:1. Some MC panels (gateways, channels, nodes, exec-approvals) are gateway-only and may not apply to MUTX's use case.
6. **Plugin System**: MC has a dynamic plugin loading system (`getPluginPanel()`). MUTX doesn't need this initially — can be added later.
7. **i18n**: MC uses `next-intl` with translation keys for boot labels and common text. MUTX doesn't use i18n — hardcode English for now.
8. **Task Model Alignment**: MC's Task has 9 statuses, 5 priorities, GitHub sync fields. MUTX's task model may differ — verify with backend API schema before porting interfaces.
9. **Backward Compatibility**: The SPA shell must not break existing `app/dashboard/*/page.tsx` routes during migration. Consider a gradual approach where both routing modes coexist.
10. **Token Color Clash**: MC uses cyan (#22D3EE) as primary; MUTX uses blue (#3b82f6). Decide on brand alignment before porting tokens.
