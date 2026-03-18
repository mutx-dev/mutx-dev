# MUTX Execution Program — Derived from Recovery Packet

**Generated: 2026-03-18**
**Based on:** `MUTX RECOVERY PACKET/` (5 files)
**Status:** IN PROGRESS — Recovered session produced partial ports; full execution below.

---

## 1. CURRENT REPO REALITY

### What exists (shipped/wired)

| Surface | File | Status |
|---------|------|--------|
| App shell + catch-all routing | `app/app/[[...slug]]/page.tsx` | ✅ Shipped |
| Agents list | `components/app/AgentsPageClient.tsx` | ✅ Wired to `/api/dashboard/agents` |
| Deployments list | `components/app/DeploymentsPageClient.tsx` | ✅ Wired |
| Overview dashboard | `components/app/AppDashboardClient.tsx` | ✅ Wired to `/api/dashboard/*` |
| API keys | `components/app/ApiKeysPageClient.tsx` | ✅ Wired to `/api/api-keys` |
| Webhooks | `components/webhooks/WebhooksPageClient.tsx` | ✅ Wired |
| Observability | `components/app/LogsMetricsStateClient.tsx` | ✅ Wired |
| Error boundary | `components/app/ErrorBoundary.tsx` | ✅ Shipped |

### Ported but NOT wired (orphaned)

| File | Source | Problem | Decision |
|------|--------|---------|---------|
| `components/app/dashboard-layout.tsx` | MC layout (worker `b263dcf`) | Uses `/api/dashboard/logs` (doesn't exist); wraps shell in a way that conflicts with inline routing page | Keep orphaned. Blocked — needs FastAPI `/api/dashboard/logs` + routing restructure first. |
| `components/app/log-viewer.tsx` | MC panels (worker `5dfa3e3`) | Uses `/api/dashboard/logs` (doesn't exist) | Keep orphaned. Blocked — needs FastAPI endpoint first. |
| `components/ui/Card.tsx` | MC port | Never imported | Keep orphaned. Harmless. |
| `components/ui/Section.tsx` | MC port | Never imported | Keep orphaned. Harmless. |
| `components/ui/sidebar.tsx` | MC dashboard/sidebar.tsx | Wrong routes (`/app/logs`, `/docs`), emoji icons, non-existent CSS vars, inferior to inline nav | **DELETED** — inline nav in routing page is superior. |

### Mission Control source available at `/tmp/mutx-control/src/`

Key directories:
- `components/layout/` — header-bar (638 lines), nav-rail, local-mode-banner
- `components/dashboard/` — sidebar (201 lines), stats-grid, widget-grid, widgets/
- `components/panels/` — 35+ panels (activity, agent-detail, log-viewer, cost-tracker, webhook, cron-management, etc.)
- `components/onboarding/` — onboarding-wizard, security-scan-card
- `components/chat/` — chat-page-panel (NOT MUTX scope)
- `app/setup/` — setup page
- `app/layout.tsx` — root layout reference

### What MUTX does NOT have yet (from MC source)

| Missing | MC Source | Priority |
|---------|---------|----------|
| Onboarding wizard | `components/onboarding/onboarding-wizard.tsx` | HIGH |
| Gateway health widget | `components/dashboard/widgets/gateway-health-widget.tsx` | HIGH |
| Runtime health widget | `components/dashboard/widgets/runtime-health-widget.tsx` | HIGH |
| Metric cards widget | `components/dashboard/widgets/metric-cards-widget.tsx` | HIGH |
| Quick actions widget | `components/dashboard/widgets/quick-actions-widget.tsx` | MEDIUM |
| Activity feed panel | `components/panels/activity-feed-panel.tsx` | MEDIUM |
| Cost tracker panel | `components/panels/cost-tracker-panel.tsx` | MEDIUM |
| Agent history panel | `components/panels/agent-history-panel.tsx` | MEDIUM |
| Audit trail panel | `components/panels/audit-trail-panel.tsx` | MEDIUM |
| Webhook panel | `components/panels/webhook-panel.tsx` | MEDIUM |
| Session details panel | `components/panels/session-details-panel.tsx` | LOW (OpenClaw-coupled) |
| Skills panel | `components/panels/skills-panel.tsx` | SKIP |
| Task board panel | `components/panels/task-board-panel.tsx` | SKIP (task ontology) |
| Standup panel | `components/panels/standup-panel.tsx` | SKIP |
| Office panel | `components/panels/office-panel.tsx` | SKIP |

### Contract status

| Contract | Status |
|----------|--------|
| `/api/dashboard/agents` | ✅ Real, wired |
| `/api/dashboard/deployments` | ✅ Real, wired |
| `/api/dashboard/health` | ✅ Real, wired |
| `/api/api-keys` | ✅ Real, wired |
| CLI ↔ backend parity | Needs audit |
| SDK ↔ backend parity | Needs audit |
| Docs ↔ backend | Needs audit |

### Branch state

```
fix/sdk-api-contract-alignment  ← active ship branch
main                             ← protected
```

**63 open PRs remaining.** 25 closed this session. 7 high-value conflicted PRs need manual rebase worktree setup.

---

## 2. PHASED SHIP PLAN

### 48h — Shell integrity + Orphan wiring + Adapter layer

**Goal:** Make the current ship shell complete, wired, and clean. No new surfaces.

- [ ] Wire orphaned `sidebar.tsx` → `app/app/[[...slug]]/page.tsx` (replace existing inline sidebar)
- [ ] Wire `dashboard-layout.tsx` → `app/app/[[...slug]]/page.tsx` (wrap shell content)
- [ ] Wire `log-viewer.tsx` → `LogsMetricsStateClient.tsx` (replace inline log viewer)
- [ ] Create `lib/mc-adapters/index.ts` — central adapter export
- [ ] Create `lib/mc-adapters/overview.ts` — normalize dashboard data shapes
- [ ] Create `lib/mc-adapters/agents.ts` — normalize agent list/detail shapes
- [ ] Create `lib/mc-adapters/deployments.ts` — normalize deployment shapes
- [ ] Audit CLI ↔ backend contract drift (Contract Keeper lane)
- [ ] Audit SDK ↔ backend contract drift
- [ ] Audit docs ↔ backend drift
- [ ] 3 PRs: shell-wiring, adapter-layer, contract-drift-wave-1

### 7d — Port missing MC high-value surfaces + OpenClaw entry flows

**Goal:** Fill the gap between current shipped surfaces and MC's best operator UX.

- [ ] Port `onboarding-wizard.tsx` → `components/app/OnboardingWizard.tsx`
  - Adapt: login → MUTX register/login, OpenClaw link → actual MC runtime link flow
  - Include: readiness checks (backend reachable, auth, agents, deployments, API keys)
- [ ] Port `gateway-health-widget.tsx` → `components/app/GatewayHealthWidget.tsx`
- [ ] Port `runtime-health-widget.tsx` → `components/app/RuntimeHealthWidget.tsx`
- [ ] Port `metric-cards-widget.tsx` → `components/app/MetricCardsWidget.tsx` (adapt to MUTX stats)
- [ ] Port `quick-actions-widget.tsx` → `components/app/QuickActionsWidget.tsx`
- [ ] Create OpenClaw entry flow CTAs:
  - "Create new OpenClaw deployment" → `components/app/CreateOpenClawModal.tsx`
  - "Link existing OpenClaw workspace" → `components/app/LinkWorkspaceModal.tsx`
- [ ] Port `activity-feed-panel.tsx` → `components/app/ActivityFeed.tsx`
- [ ] Port `audit-trail-panel.tsx` → `components/app/AuditTrail.tsx`
- [ ] Port `cost-tracker-panel.tsx` → `components/app/CostTracker.tsx`
- [ ] Update empty states with OpenClaw CTAs (DONE this session — verify)
- [ ] PR: `feat/mc-shell-orphans-wired`
- [ ] PR: `feat/mc-adapters-layer`
- [ ] PR: `feat/onboarding-wizard`
- [ ] PR: `feat/openclaw-entry-flows`
- [ ] PR: `feat/health-widgets`

### 30d — Differentiate MUTX moat surfaces

**Goal:** Surface deployments, runs, traces, API key governance as visible advantages.

- [ ] Deployment detail page: restart / scale / rollback / version history
- [ ] Run history + run inspector (detail page)
- [ ] Trace explorer + trace detail
- [ ] API key governance: named keys, scopes, rotate/revoke, one-time reveal, expiry
- [ ] Webhook management: delivery history, retry, signing details
- [ ] Budget/usage surfaces (only if backend semantics are real)
- [ ] Doctor/readiness workflow (integrated with onboarding wizard)
- [ ] PR: `feat/deployments-detail`
- [ ] PR: `feat/runs-traces`
- [ ] PR: `feat/apikey-governance`
- [ ] PR: `feat/webhooks-management`
- [ ] PR: `feat/budgets-usage`

---

## 3. HARVEST MAP (source → destination)

Format: `MC_SOURCE → MUTX_DESTINATION | status | adaptation notes`

### Shell / Layout

```
MC: components/layout/header-bar.tsx (638L)
  → MUTX: components/app/HeaderBar.tsx (or integrate into [[...slug]]/page.tsx)
  | status: NOT PORTED
  | adaptation: strip OpenClaw backend assumptions; keep nav structure + gateway status indicators

MC: components/layout/nav-rail.tsx
  → MUTX: components/app/NavRail.tsx
  | status: NOT PORTED
  | adaptation: replace MC routes with MUTX route map (/app, /app/agents, /app/deployments, /app/api-keys, /app/webhooks, /app/observability, /app/health)

MC: components/dashboard/sidebar.tsx (201L)
  → MUTX: components/app/Sidebar.tsx (ALREADY PORTED — components/ui/sidebar.tsx — NEEDS WIRING)
  | status: PORTED BUT ORPHANED
  | adaptation: add MUTX nav items; wire OpenClaw CTAs

MC: app/layout.tsx
  → MUTX: reference only (MUTX already has app/layout.tsx)
  | status: REFERENCE ONLY

MC: app/setup/page.tsx
  → MUTX: components/app/SetupPage.tsx (new)
  | status: NOT PORTED
  | adaptation: replace MC bootstrap with MUTX register/login + OpenClaw link
```

### Dashboard / Widgets

```
MC: components/dashboard/dashboard.tsx
  → MUTX: reference only (MUTX has AppDashboardClient.tsx)
  | adaptation: harvest widget composition pattern

MC: components/dashboard/stats-grid.tsx
  → MUTX: components/app/StatsGrid.tsx
  | status: NOT PORTED
  | adaptation: wire to /api/dashboard/* endpoints

MC: components/dashboard/widget-grid.tsx
  → MUTX: ALREADY DELETED (was in components/ui/widget-grid.tsx — 0 imports, never wired)
  | restore: NO — the port was dead; re-port cleanly from MC source if needed

MC: components/dashboard/widgets/gateway-health-widget.tsx
  → MUTX: components/app/widgets/GatewayHealthWidget.tsx
  | status: NOT PORTED — HIGH PRIORITY

MC: components/dashboard/widgets/runtime-health-widget.tsx
  → MUTX: components/app/widgets/RuntimeHealthWidget.tsx
  | status: NOT PORTED — HIGH PRIORITY

MC: components/dashboard/widgets/metric-cards-widget.tsx
  → MUTX: components/app/widgets/MetricCardsWidget.tsx
  | status: NOT PORTED — HIGH PRIORITY

MC: components/dashboard/widgets/quick-actions-widget.tsx
  → MUTX: components/app/widgets/QuickActionsWidget.tsx
  | status: NOT PORTED — MEDIUM PRIORITY

MC: components/dashboard/widgets/onboarding-checklist-widget.tsx
  → MUTX: components/app/OnboardingChecklist.tsx (integrate into wizard)
  | status: NOT PORTED
```

### Onboarding

```
MC: components/onboarding/onboarding-wizard.tsx
  → MUTX: components/app/OnboardingWizard.tsx
  | status: NOT PORTED — HIGH PRIORITY
  | adaptation: replace MC bootstrap with MUTX auth + OpenClaw link flow; keep step structure

MC: components/onboarding/security-scan-card.tsx
  → MUTX: components/app/SecurityScanCard.tsx
  | status: NOT PORTED
  | adaptation: reimplement security checks against MUTX health endpoint
```

### Panels (selective)

```
MC: components/panels/activity-feed-panel.tsx
  → MUTX: components/app/panels/ActivityFeedPanel.tsx
  | status: NOT PORTED — MEDIUM PRIORITY
  | adaptation: wire to MUTX deployment/agent events

MC: components/panels/agent-history-panel.tsx
  → MUTX: components/app/AgentHistory.tsx
  | status: NOT PORTED — MEDIUM PRIORITY

MC: components/panels/audit-trail-panel.tsx
  → MUTX: components/app/panels/AuditTrailPanel.tsx
  | status: NOT PORTED — MEDIUM PRIORITY
  | adaptation: adapt to MUTX api_key/webhook event model

MC: components/panels/cost-tracker-panel.tsx
  → MUTX: components/app/panels/CostTrackerPanel.tsx
  | status: NOT PORTED — MEDIUM PRIORITY (only if budget semantics are real in backend)

MC: components/panels/webhook-panel.tsx
  → MUTX: reference for WebhooksPageClient improvements
  | status: REFERENCE ONLY — MUTX already has WebhooksPageClient wired

MC: components/panels/log-viewer-panel.tsx
  → MUTX: ALREADY PORTED — components/app/log-viewer.tsx (5dfa3e3) — NEEDS WIRING
  | status: PORTED BUT ORPHANED
  | adaptation: wire into LogsMetricsStateClient.tsx

MC: components/panels/gateway-config-panel.tsx
  → MUTX: SKIP — OpenClaw-specific

MC: components/panels/github-sync-panel.tsx
  → MUTX: SKIP

MC: components/panels/task-board-panel.tsx
  → MUTX: NEVER — task ontology is anti-MUTX

MC: components/panels/standup-panel.tsx
  → MUTX: NEVER

MC: components/panels/office-panel.tsx
  → MUTX: NEVER
```

### UI Primitives (from MC components/ui/)

```
MC: components/ui/button.tsx
  → MUTX: SKIP — MUTX already has button primitives via Tailwind

MC: components/ui/agent-avatar.tsx
  → MUTX: components/app/AgentAvatar.tsx
  | status: NOT PORTED — low priority

MC: components/ui/online-status.tsx
  → MUTX: components/app/OnlineStatus.tsx
  | status: NOT PORTED — low priority

MC: components/ui/digital-clock.tsx
  → MUTX: SKIP — purely decorative
```

### Adapter layer (new — does not exist yet)

```
NEW: lib/mc-adapters/index.ts
  → exports all adapter functions

NEW: lib/mc-adapters/types.ts
  → shared normalized types across all adapters

NEW: lib/mc-adapters/overview.ts
  → getOverview(): aggregates health + agents + deployments + keys

NEW: lib/mc-adapters/agents.ts
  → getAgents(), getAgent(id), normalizeAgent(raw)

NEW: lib/mc-adapters/deployments.ts
  → getDeployments(), getDeployment(id), normalizeDeployment(raw)

NEW: lib/mc-adapters/monitoring.ts
  → getHealth(), getLogs(), getMetrics()

NEW: lib/mc-adapters/openclaw.ts
  → linkWorkspace(), createOpenClawDeployment(), getOpenClawStatus()
```

---

## 4. MULTI-AGENT ASSIGNMENT PLAN

### Active lanes (max 3 concurrent)

| Lane | Agent | Model | Scope |
|------|-------|-------|-------|
| L1: Shell + Orphan Wiring | `shell-wirer` | MiniMax-M2.7 | Wire 3 orphaned port files; no new ports |
| L2: Adapter Layer | `adapter-engineer` | MiniMax-M2.7 | Create `lib/mc-adapters/` — all adapter files |
| L3: PR Healing (continued) | `pr-healer` | MiniMax-M2.7 | Rebase 7 conflicted PRs; close remaining duplicates |

### Queued lanes (start after L1/L2 close)

| Lane | Agent | Model | Scope |
|------|-------|-------|-------|
| L4: Onboarding Wizard | `onboarding-port` | MiniMax-M2.7 | Port onboarding-wizard.tsx; wire OpenClaw entry flows |
| L5: Health Widgets | `widgets-port` | MiniMax-M2.7 | Port 4 widget files; wire to real endpoints |
| L6: Positioning + Docs | `docs-worker` | MiniMax-M2.7 | Homepage, README, release notes |

### Rules
- No lane touches another lane's files without coordination via `reports/<lane>-status.md`
- Coordinator (main) owns merge order and blocker resolution
- Each lane produces `reports/<name>-status.md` at start and completion
- Subagents only spawn after lane assignment is written to `autonomy-queue.json`

### Anti-chaos hard rules
- Max 3 active lanes at once
- No speculative ports outside assigned lane
- No deletion without integration-or-removal note
- No "done" without proof artifact (commit SHA or report)

---

## 5. FIRST 10 PRs TO OPEN

In priority order:

| # | Branch | Title | Files | Lane |
|---|--------|-------|-------|------|
| 1 | `feat/shell-orphans-wired` | wire orphaned sidebar + dashboard-layout + log-viewer into routing | 3 | L1 |
| 2 | `feat/mc-adapters-layer` | add lib/mc-adapters/ with types + overview + agents + deployments + monitoring | 6 | L2 |
| 3 | `fix/contract-drift-wave-1` | audit + fix CLI/SDK/backend drift | varies | L2 |
| 4 | `feat/onboarding-wizard` | port MC onboarding-wizard.tsx, adapt to MUTX auth + OpenClaw flows | 3 | L4 |
| 5 | `feat/openclaw-entry-flows` | add LinkWorkspaceModal + CreateOpenClawModal + CTAs on dashboard | 4 | L4 |
| 6 | `feat/health-widgets` | port gateway-health + runtime-health + metric-cards + quick-actions widgets | 4 | L5 |
| 7 | `feat/activity-audit-widgets` | port activity-feed + audit-trail panels | 3 | L5 |
| 8 | `feat/deployments-detail` | add deployment detail page with restart/scale/rollback/version-history | 4 | L5 |
| 9 | `chore/pr-heal-rebase-1` | rebase 7 conflicted PRs (self-healing, SDK contract tests, coverage, mutation testing) | varies | L3 |
| 10 | `docs/reposition-mutx-v2` | update homepage hero, README, and docs landing to reflect shipped state | 3 | L6 |

---

## 6. IMMEDIATE NEXT ACTION

**After analysis, the routing shell is already complete. The inline nav is superior to the orphaned port.**

Immediate actions (in order):

**Action 1 — Commit removal of dead port:**
```bash
git add components/ui/ && git commit -m "chore: remove dead port artifact components/ui/sidebar.tsx" && git push
```

**Action 2 — Audit FastAPI for `/api/dashboard/logs` endpoint:**
- Check if backend has a logs endpoint under a different path
- If it exists: note the correct path and update `dashboard-layout.tsx` and `log-viewer.tsx` to use it
- If it doesn't exist: add to backlog as FastAPI work item (outside UI scope)

**Action 3 — Start Lane L2: Adapter Layer:**
- Create `lib/mc-adapters/index.ts`
- Create `lib/mc-adapters/types.ts`
- Create `lib/mc-adapters/overview.ts` (aggregates health + agents + deployments + keys)
- Create `lib/mc-adapters/agents.ts`
- Create `lib/mc-adapters/deployments.ts`
- This is prerequisite for all subsequent port work

**Action 4 — Start Lane L3: PR Healing (rebase):**
- Rebase the 7 conflicted high-value PRs using git worktree
- Focus: #1086 (self-healing), #1103 (SDK contract tests), #1090 (coverage thresholds)

**No other work begins until Actions 1-4 are complete.**

---

## HARVEST LEDGER (live)

| Imported File | Source | Target | Status | Notes |
|---|---|---|---|---|
| `components/app/dashboard-layout.tsx` | MC layout | `components/app/dashboard-layout.tsx` | PORTED_ORPHAN | Worker port `b263dcf`. Uses `/api/dashboard/logs` (doesn't exist). Blocked. |
| `components/app/log-viewer.tsx` | MC panels/log-viewer-panel.tsx | `components/app/log-viewer.tsx` | PORTED_ORPHAN | Worker port `5dfa3e3`. Uses `/api/dashboard/logs` (doesn't exist). Blocked. |
| `components/app/OnboardingWizard.tsx` | MC onboarding-wizard.tsx | `components/app/OnboardingWizard.tsx` | NOT_PORTED | HIGH PRIORITY |
| `components/app/widgets/GatewayHealthWidget.tsx` | MC widgets/gateway-health-widget.tsx | `components/app/widgets/` | NOT_PORTED | HIGH PRIORITY |
| `components/app/widgets/RuntimeHealthWidget.tsx` | MC widgets/runtime-health-widget.tsx | `components/app/widgets/` | NOT_PORTED | HIGH PRIORITY |
| `components/app/widgets/MetricCardsWidget.tsx` | MC widgets/metric-cards-widget.tsx | `components/app/widgets/` | NOT_PORTED | HIGH PRIORITY |
| `components/app/widgets/QuickActionsWidget.tsx` | MC widgets/quick-actions-widget.tsx | `components/app/widgets/` | NOT_PORTED | MEDIUM PRIORITY |
| `components/app/panels/ActivityFeedPanel.tsx` | MC panels/activity-feed-panel.tsx | `components/app/panels/` | NOT_PORTED | MEDIUM PRIORITY |
| `components/app/panels/AuditTrailPanel.tsx` | MC panels/audit-trail-panel.tsx | `components/app/panels/` | NOT_PORTED | MEDIUM PRIORITY |
| `lib/mc-adapters/index.ts` | NEW | `lib/mc-adapters/` | NOT_CREATED | BLOCKING — all subsequent ports need adapter layer |
| `lib/mc-adapters/types.ts` | NEW | `lib/mc-adapters/` | NOT_CREATED | BLOCKING |
| `components/ui/sidebar.tsx` | MC dashboard/sidebar.tsx | `components/ui/sidebar.tsx` | **DELETED** | Wrong routes, emoji icons, broken CSS vars. Inline nav in routing page is superior. |
| `components/ui/widget-grid.tsx` | MC dashboard/widget-grid.tsx | — | REMOVED | Was ported, 0 imports, never wired. Do not restore. |
| `components/ui/stat-card.tsx` | MC dashboard/stat-card.tsx | — | REMOVED | Was ported, 0 imports, never wired. Do not restore. |

---

## EXECUTION PROGRAM — REVISED STATUS

**After audit, the routing shell + inline nav is already the best navigation we have.**  
**The orphaned port files are blocked on FastAPI `/api/dashboard/logs` endpoint.**  
**The execution program is the authoritative artifact. Update this before every session.**
