

---

## 7. PRIORITIZED BACKLOG

### P0 (Next 48 hours — must ship)

| # | Title | Rationale | Impact | Dependencies | Complexity | Owner | Type |
|---|-------|-----------|--------|--------------|------------|-------|------|
| P0-1 | **Wire overview dashboard to real API** | UI shows nothing because components aren't connected | Critical — demoability | MUTX health/agents API exists | Low | Frontend harvester | Adaptation |
| P0-2 | **Fix porting worker edit failures** | 6 consecutive failures; UI porting is blocked | Critical — worker army broken | None | Low | Main session | Cleanup |
| P0-3 | **Add empty states for all list pages** | Looks broken when lists are empty; 2h work | High — perceived maturity | List pages exist | Low | Frontend harvester | Direct reuse |
| P0-4 | **Rewrite homepage + README positioning** | Current positioning doesn't land in 30s; thesis is there but invisible | High — first impressions | None | Low | Main session | Positioning |
| P0-5 | **Verify agent-row wiring** | agent-row component was claimed done but not on disk | Critical — agents page broken | API returns agents | Low | Frontend harvester | Direct reuse |
| P0-6 | **CSP hardening in middleware.ts** | MC's `44aaf15` nonce CSP; apply to MUTX | High — security credibility | None | Medium | Main session | Adaptation |

### P1 (Next 7 days — functional parity)

| # | Title | Rationale | Impact | Dependencies | Complexity | Owner | Type |
|---|-------|-----------|--------|--------------|------------|-------|------|
| P1-1 | **Doctor/health diagnostic UI** | Operators need help when things break | High — time-to-value | `/health` + `/ready` endpoints wired | Medium | Frontend harvester | Adaptation |
| P1-2 | **API key panel UX** | MC UX is good; MUTX backend exists | High — core workflow | API key endpoints exist | Low | Frontend harvester | Direct reuse |
| P1-3 | **Healer worker — resolve PR conflicts** | 13 PRs blocked; zero progress | High — unblocks everything | None | Medium | Healer worker | Original MUTX |
| P1-4 | **Activity feed + log viewer wiring** | Already ported; verify they work with real data | Medium | usage_events + agent_logs APIs | Medium | Frontend harvester | Adaptation |
| P1-5 | **Agent detail page — deploy/restart controls** | MUTX has agent_runtime; wire it to UI | High — core workflow | agent detail API route | Medium | Frontend harvester | Adaptation |
| P1-6 | **CLI deploy flow end-to-end test + fix** | `deploy.py` is broken; operators need it | High — SDK/CLI thesis | Backend deploy route | Medium | Backend worker | Original MUTX |
| P1-7 | **SDK coverage audit** | SDK must match backend surface | High — SDK/CLI thesis | Backend routes | Medium | Backend worker | Original MUTX |

### P2 (Next 30 days — structural depth)

| # | Title | Rationale | Impact | Dependencies | Complexity | Owner | Type |
|---|-------|-----------|--------|--------------|------------|-------|------|
| P2-1 | **Budget enforcement UI** | Backend has `budgets.py`; wire it | High — MUTX differentiation | Budgets backend | Medium | Frontend + backend | Original MUTX |
| P2-2 | **Deployment rollback UX** | `DeploymentVersion` exists; build version list + rollback | High — production credibility | Deployment backend | Medium | Frontend + backend | Original MUTX |
| P2-3 | **Webhook lifecycle UI** | Full create → deliver → retry → inspect | Medium | Webhook backend exists | Medium | Frontend harvester | Adaptation |
| P2-4 | **Run traces UI** | `runs.py` exists; wire traces view | Medium | Runs backend | Medium | Frontend + backend | Original MUTX |
| P2-5 | **Swarm orchestration overview** | `swarms.py` exists; show swarm list | Medium | Swarms backend | Medium | Frontend + backend | Original MUTX |
| P2-6 | **Self-hosted deployment guide** | Close MC's self-hosted advantage | High — enterprise fit | None | Low | Docs worker | Original MUTX |
| P2-7 | **Repo scout + competitor scout workers** | Continuous intelligence; enables autonomous ops | High — operational leverage | None | Medium | Main session | Original MUTX |
| P2-8 | **Tailscale / reverse proxy detection** | MC solved this; adapt to MUTX infra | Medium | None | Medium | Backend worker | Adaptation |
| P2-9 | **GNAP sync wiring** | Already in lib/; wire to MUTX autonomy queue | Medium | Autonomy queue exists | Medium | Backend worker | Adaptation |

---

## 8. POSITIONING REWRITE

### One-Line Description
**MUTX: The production control plane for AI agents — deploy, operate, and govern agents like the infrastructure they are.**

### Homepage Paragraph
MUTX is the open-source control plane that makes AI agents production-grade.

Most teams can prototype an agent. Very few can operate one: managing deployments, enforcing budgets, controlling access, observing behavior, and maintaining governance across an agent fleet. MUTX provides the operational layer that most agent tooling skips.

Built on a typed FastAPI backend, a Python SDK, and a CLI designed for real infrastructure — not just local runs. Agents get deployments, not just sessions. Operations get budgets, not just logs. Teams get contracts, not conventions.

If you're building agents that need to run in production — not just in demos — MUTX is the control plane underneath.

### Product Thesis
MUTX exists because agents fail in production for the same reasons other services fail: unclear ownership, uncontrolled deployments, missing observability, and secret sprawl. The agent itself is rarely the problem. The operational layer around it is.

Most agent frameworks treat the agent as the product. MUTX treats the agent as infrastructure — with the deployment semantics, lifecycle controls, and governance contracts that infrastructure requires.

### Why MUTX Is Not the Same Category as Mission Control
Mission Control is a dashboard for OpenClaw agents — focused on sessions, chat, tasks, and operator interaction with running agents. It's well-built and polished, but it's a UI layer on top of a session management system.

MUTX is a control plane for agent systems — focused on deployment, lifecycle, governance, budgets, multi-tenant operations, and runtime abstraction. The dashboard is one surface; the SDK and CLI are equally primary. The backend owns the agent lifecycle, not just the chat session.

Mission Control answers: "What are my agents doing right now?"
MUTX answers: "How are my agents deployed, governed, and performing — and what do I do when they're not?"

### Competitive Note
Tools like Mission Control, CrewAI's dashboard, or LangSmith are session or tracing layers. They observe what agents do. MUTX controls how agents run: their deployment model, their access boundaries, their budget constraints, and their operational contracts.

---

## 9. BRANCH / EXECUTION STRUCTURE

### Branch Lanes

```
main (protected)
├── pr-1154  (ship — UI porting + v2.0.1 features)
│   └── ui-porting/  (topic branches per component)
├── onboarding-reliability/  (doctor flow, empty states, health wiring)
├── csp-hardening/  (nonce CSP fix, SSRF protection)
├── positioning/  (README, homepage, docs rewrite)
├── healer/  (PR conflict resolution automation)
├── worker-orchestration/  (cron worker army setup)
└── [feature branches off main for P2 work]
```

### Where Each Thing Lives

| Work | Branch | Location |
|------|--------|----------|
| UI porting (sidebar, widgets, panels) | `pr-1154` (ship worktree) | `~/mutx-worktrees/factory/ship/` |
| Doctor/health flow | `onboarding-reliability/` | `~/mutx-worktrees/factory/` new worktree |
| Positioning rewrite | `positioning/` | `~/mutx-worktrees/factory/` new worktree |
| Healer worker | `healer/` | Isolated cron, no branch |
| Worker orchestration | `worker-orchestration/` | State files + cron config |
| P2 features (budgets, rollback, traces) | Per-feature branches | `~/mutx-worktrees/factory/` worktrees |

### Isolation Rules
- **Never push directly to `main`** — all merges via PR
- **One feature per worktree** — don't mix UI work with backend work in the same tree
- **Workers operate on isolated branches** — healers/scouts write to `mutx-fleet-state.md`, not code
- **UI experiments stay in `pr-1154` until verified** — then cherry-pick to main

### PR Readiness Checklist
- [ ] Component renders without console errors
- [ ] Connects to real MUTX API endpoint (or stub if endpoint missing)
- [ ] Empty state shown when API returns no data
- [ ] Loading state shown during fetch
- [ ] Error state shown when API fails
- [ ] Responsive layout works at 375px and 1440px
- [ ] No OpenClaw-specific assumptions in component code
- [ ] Changelog entry added

### Worker Conflict Prevention
- Lock file pattern: `.harvester.lock` with PID + timestamp
- State file is single coordination point
- No worker modifies another worker's output directory
- Competitor scout + repo scout run sequentially, not in parallel

---

## 10. RISKS, TRAPS, AND NON-GOALS

### The 5 Most Important Truths

1. **The dashboard looks unfinished and that's killing demos before the thesis gets heard.** Fix the UI before fixing anything else.

2. **MUTX's backend is genuinely deeper than Mission Control's, but nobody can see it.** The operator surface must be credible enough to earn a look at the backend.

3. **The porting worker has been failing for 6 runs.** The file-write issue in isolated sessions is blocking everything. This must be diagnosed and fixed.

4. **GNAP sync + task-dispatch are in `lib/` but not wired to anything.** They were copied as artifacts, not integrated as features. Until they're wired to MUTX's autonomy model, they're just dead weight.

5. **13 PRs are blocked by merge conflicts.** The healer worker is more important than any new feature work. Conflicts prevent CI from running, which prevents progress.

### The 5 Moves to Make First

1. **Fix the porting worker** — Diagnose and resolve the isolated session file-write failures. Everything downstream depends on this.

2. **Wire the dashboard to real API data** — Connect `DashboardOverview` to `/api/dashboard/agents`, `/api/dashboard/deployments`, `/api/dashboard/health`. Ship real data or clean empty states today.

3. **Add empty states everywhere** — Every list view that shows nothing when empty looks broken. 2-4 hours of work, massive perceptual impact.

4. **Open the healer worker** — Resolve PR conflicts on the 13 blocked PRs. Unblocking those is worth more than any new feature.

5. **Rewrite the homepage headline and README** — Land the control-plane thesis in 30 seconds. The content is strong; the presentation is not.

### The 5 Traps to Avoid

1. **Don't try to build the Mission Control UI feature-by-feature.** Harvest the patterns, adapt to MUTX routes and API shapes, move on.

2. **Don't spawn 50 workers again.** We tried, rate limits killed everything. Start with 3-4 workers maximum. Add more only when the first ones prove stable.

3. **Don't add i18n right now.** It's high-effort, low near-term impact. The 10-language copy in `messages/` is inert without next-intl setup. Leave it for later.

4. **Don't open new PRs while 13 are blocked by conflicts.** The queue is clogged. Heal the existing PRs first.

5. **Don't confuse "port from MC" with "integrate into MUTX."** A copied file that doesn't connect to MUTX's API is not a shipped feature. Every port must wire to real endpoints.

### Non-Goals
- Building a task management UI (not MUTX's primary value)
- Windows installer (not MUTX's platform)
- Full i18n localization (too early)
- GNAP sync UI (backend wiring first)
- Competing on UI polish alone (leads to dashboard clone, not control plane)
- Rewriting the backend (it's MUTX's strongest layer)
