# MUTX UI PORTING MISSION — MASTER PROMPT

**Status:** RESTARTED 2026-03-18  
**Mission:** Port mutx-control UI to mutx-dev with max velocity  
**Priority:** 🔴 TOP  

---

## MISSION BRIEF

We are porting the mutx-control UI (https://github.com/mutx-dev/mutx-control/) to our MUTX project (https://github.com/mutx-dev/mutx-dev).

**Background:**
- We had approval from the developer of mutx-control to use their UI
- mutx-control is an open-source agent orchestration UI
- We're building MUTX, an agent control plane
- The UI will give us production-ready components for fleet management, agent dashboards, and runtime visualization

**Goal:** Ship the ported UI incrementally, page by page, with zero debt.

---

## CONTEXT: Why We're Starting Over

**2026-03-18:** The previous fleet ran 52 concurrent workers. It caused:
- 9,377 API errors in gateway.err.log
- Rate limit cascade across MiniMax and OpenAI Codex
- Total fleet failure → user nuked all cron jobs

**What we learned:**
1. Parallelism ≠ Speed
2. State files are mandatory for isolated sessions
3. Backoff protocol: log → wait 5min → retry once → fail gracefully
4. Fewer workers, smarter work
5. Ship clean: one green PR > ten broken ones

**New rules:**
- Max 3 concurrent workers per repo
- State files before/after every action
- Rate limit hits must be 0

---

## TECHNICAL CONTEXT

### mutx-control Source
- **Repo:** https://github.com/mutx-dev/mutx-control/
- **Stack:** React + TypeScript + TailwindCSS (likely Next.js based)
- **License:** Open source (approval received)
- **Key directories:** Likely `ui/`, `frontend/`, or `src/components/`

### mutx-dev Target
- **Repo:** https://github.com/mutx-dev/mutx-dev
- **Stack:** Next.js + FastAPI + Python
- **Workspace:** `~/.openclaw/workspace/`
- **Frontend:** `~/.openclaw/workspace/app/` (Next.js app router)

### Cloning Strategy
```bash
# Clone mutx-control to temp location
git clone https://github.com/mutx-dev/mutx-control.git /tmp/mutx-control

# Or add as remote
cd ~/.openclaw/workspace
git remote add mutx-control https://github.com/mutx-dev/mutx-control.git
git fetch mutx-control
```

---

## PORTING WORKFLOW

### Phase 1: Discovery (30 min)
1. Clone mutx-control repo
2. Explore structure: components, pages, API calls, state management
3. Map mutx-control components to our project structure
4. Identify what we can copy verbatim vs what needs adaptation
5. Document findings in `UI-PORT-PLAN.md`

### Phase 2: Core Components (Priority Order)
Port these first (they're the foundation):

1. **Agent Card / Agent Status Component**
   - Shows agent name, status, last heartbeat
   - Action buttons (start, stop, restart)
   
2. **Fleet Dashboard Layout**
   - Header with nav
   - Sidebar with agent list
   - Main content area
   - Status indicators

3. **Agent List / Table View**
   - Sortable columns
   - Status badges
   - Quick actions

4. **Agent Detail View**
   - Full agent info
   - Logs viewer
   - Metrics display
   - Config editor

5. **Runtime Logs Panel**
   - Real-time log streaming
   - Log level filtering
   - Search/filter

### Phase 3: Integration
1. Wire UI components to our FastAPI backend
2. Connect to our data models (agents, deployments, logs)
3. Add authentication if needed
4. Test end-to-end flows

### Phase 4: Polish
1. Match our color scheme/branding
2. Add any missing features
3. Performance optimization
4. Mobile responsiveness

---

## STATE FILES (READ BEFORE EVERY ACTION)

| File | Purpose | Read Frequency |
|------|---------|----------------|
| `~/.openclaw/workspace/mutx-fleet-state.md` | Fleet health, active work | Every session |
| `~/.openclaw/workspace/UI-PORT-PLAN.md` | Porting progress, blockers | Every session |
| `~/.openclaw/workspace/autonomy-queue.json` | Work queue | Every session |
| `~/.openclaw/workspace/mutx-fleet-bible.md` | Fleet rules | New sessions |
| `~/.openclaw/workspace/MEMORY.md` | Long-term context | Main sessions |

---

## RULES FOR MAX VELOCITY

### DO
- Read state files BEFORE starting any work
- Update state files AFTER completing any meaningful action
- Copy verbatim when possible (we have approval)
- Ship incrementally — one page/feature at a time
- Direct push for internal refactors (no PR needed)
- Ask clarifying questions when requirements are unclear
- Break work into small, shippable chunks

### DON'T
- Don't spawn 50+ workers (we tried, it failed)
- Don't skip state file reads/writes
- Don't retry rate-limited APIs more than once
- Don't open PRs for internal work
- Don't try to port everything at once
- Don't ignore blockers — escalate immediately

### RATE LIMIT PROTOCOL
1. **Detect** — Error or log indicates rate limit
2. **Log** — Write to state: `"rateLimitHit": true, "timestamp": "..."`
3. **Wait** — 5 minute minimum backoff
4. **Retry once** — If critical, retry after backoff
5. **Fail gracefully** — Update state, stop, report

---

## WORKER CADENCE (Minimal)

Starting with just these:

| Worker | Role | Cadence | Status |
|--------|------|---------|--------|
| mutx-pulse-poster | X posting | 30 min | Active |
| mutx-pulse-engagement | X engagement | 15 min | Active |
| (UI porting) | Main session work | On-demand | Active |
| mutx-backend-worker | Backend issues | 3 min | NOT YET |
| mutx-frontend-worker | Frontend issues | 3 min | NOT YET |

**Rule:** Don't add more workers until current ones are stable.

---

## UI PORTING PROGRESS TRACKING

Update `UI-PORT-PLAN.md` after each component:

```
## Completed
- [ ] Agent Card Component
- [ ] Fleet Dashboard Layout
- [ ] Agent List View
- [ ] Agent Detail View
-[ ] Runtime Logs Panel

## In Progress
- [Component name]: [status]

## Blockers
- [Issue]: [what's needed to unblock]

## Notes
- [Anything learned that should be documented]
```

---

## TECHNICAL NOTES

### Authentication
- mutx-control may use its own auth
- We need to integrate with our FastAPI `/auth/*` endpoints
- Check our existing auth middleware

### API Endpoints (Our Backend)
```
GET  /api/agents          - List agents
GET  /api/agents/:id     - Get agent details
POST /api/agents          - Create agent
PUT  /api/agents/:id     - Update agent
DEL  /api/agents/:id     - Delete agent
GET  /api/agents/:id/logs - Get agent logs
GET  /api/deployments     - List deployments
GET  /api/deployments/:id - Get deployment details
```

### Data Models
```python
# Agent model (likely)
class Agent:
    id: str
    name: str
    status: str  # running, stopped, error
    last_heartbeat: datetime
    config: dict
    metadata: dict

# Deployment model (likely)
class Deployment:
    id: str
    agent_id: str
    status: str
    created_at: datetime
    updated_at: datetime
```

### Component Mapping
| mutx-control | Our Target | Notes |
|--------------|------------|-------|
| `AgentCard` | `components/AgentCard.tsx` | Copy + adapt |
| `FleetDashboard` | `app/(dashboard)/page.tsx` | Core layout |
| `AgentTable` | `components/AgentTable.tsx` | Copy + adapt |
| `AgentDetail` | `app/agents/[id]/page.tsx` | Next.js route |
| `LogViewer` | `components/LogViewer.tsx` | May need streaming |

---

## SUCCESS METRICS

- **Phase 1:** Discovery complete, plan documented (< 30 min)
- **Phase 2:** Core components ported and working (< 4 hours)
- **Phase 3:** Integration complete, end-to-end works (< 4 hours)
- **Phase 4:** Polish shipped, no known issues (< 2 hours)

**Total target:** Shippable UI in under 1 day

---

## ESCALATION POINTS

If blocked:
1. Check `UI-PORT-PLAN.md` for known blockers
2. Check `mutx-fleet-state.md` for fleet-wide issues
3. Ask user if unclear on requirements
4. Document blocker and continue with other work

---

## FILES TO CREATE/UPDATE

1. `~/.openclaw/workspace/UI-PORT-PLAN.md` — Porting progress tracker
2. `~/.openclaw/workspace/mutx-fleet-state.md` — Update after each milestone
3. `~/.openclaw/workspace/autonomy-queue.json` — Add/remove tasks

---

## WORKFLOW TEMPLATE

```
SESSION START:
1. Read mutx-fleet-state.md
2. Read UI-PORT-PLAN.md
3. Check autonomy-queue.json
4. Identify next task
5. Execute

DURING SESSION:
- Update state files after each completed component
- Log blockers immediately
- Ask questions when stuck

SESSION END:
- Update UI-PORT-PLAN.md with progress
- Update mutx-fleet-state.md with status
- Clear next steps for next session
```

---

## THE ask_from_openclaw

Go. Ship the UI. Start with discovery, map the components, copy what's approved, adapt what needs adapting, integrate with our backend, ship incrementally.

You have:
- Approval to use mutx-control code
- Clear workflow
- State file discipline
- Zero tolerance for rate limit issues

Don't overthink. Don't add bureaucracy. Just ship.

---

_Updated: 2026-03-18 18:35 UTC_  
_Author: Matrix Agent (Recovery Session)_  
_Next review: After Phase 1 completion_
