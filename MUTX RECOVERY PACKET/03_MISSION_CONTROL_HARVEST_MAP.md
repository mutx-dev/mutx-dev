# Mission Control Harvest Map — What to Copy, Adapt, or Ignore

## Copy first (high leverage)

### A. App shell + layout
**Mission Control source areas**
- app shell / catch-all routing pattern
- layout components
- sidebar + top bar + panel wrappers
- onboarding surfaces
- base UI primitives

**Why**
This is the highest-visibility delta between the products.

**How**
- copy to `components/mc-shell/*`
- rename only after it runs
- keep a clear `compat` namespace during ingestion
- wire through MUTX adapters

### B. Realtime UX helpers
**Copy/adapt**
- smart polling
- SSE/WebSocket client patterns
- event bus ideas
- lightweight connection state handling

**Why**
These make the dashboard feel alive and serious.

**How**
- reimplement around MUTX event/health endpoints if needed
- keep transport wrappers isolated from components

### C. Onboarding / doctor patterns
**Copy/adapt**
- readiness steps
- banner flows
- first-run wizard structure
- self-hosting guardrails
- browser/CSP hardening patterns

**Why**
Mission Control’s polish is not just visuals; it reduces abandonment.

**How**
Use the pattern, not the exact OpenClaw bootstrap assumptions.

---

## Adapt carefully

### D. State store topology
Mission Control’s Zustand store is useful as a topology reference:
- connection
- sessions/logs
- tasks/agents
- notifications
- chat/panels
- UI persistence

**Do not** import blindly.
Instead:
- map only the slices MUTX really needs
- keep domain slices aligned with MUTX resources
- avoid importing task-centric worldview as primary

### E. GitHub sync / local discovery / skill registry ideas
These are valuable because they make Mission Control feel alive.

For MUTX:
- use as inspiration for runtime integration modules
- especially where OpenClaw local workspace link flow can benefit
- keep backend source-of-truth in FastAPI

### F. Installer / hardening story
Harvest:
- installation UX
- docker/self-hosting docs structure
- setup wizard patterns
- first-run health checks

Do not copy:
- backend runtime assumptions
- local-only architecture as the central story

---

## Ignore or treat as references only

### G. SQLite/db model
Mission Control is local-first/SQLite-oriented.
MUTX is explicitly heavier:
- FastAPI
- PostgreSQL
- Redis
- pgvector
- infra/provisioning

This is not a transplant candidate.

### H. Task-board ontology
Mission Control:
- tasks
- task comments
- assignments
- standups
- inbox/review board semantics

MUTX:
- agents
- deployments
- runs
- traces
- governance

Do not let the product become a task-board clone.

### I. OpenClaw backend coupling
Good reference.
Bad source of truth.

Use it to design integration adapters, not as your new backend core.

---

## Concrete file-level ingest plan

## Wave 1 — shell
- layout components
- nav rail/sidebar
- breadcrumbs
- panel containers
- loading/error/empty-state primitives

## Wave 2 — overview
- overview card patterns
- health/status badges
- activity feed concepts
- onboarding/readiness banners

## Wave 3 — runtime UX
- live connection indicators
- logs/monitoring panel patterns
- websocket/polling support hooks

## Wave 4 — hardening
- CSP/browser-security helper ideas
- installer/self-hosting docs structure
- first-run UX structure

---

## Best-practice ingest rules

1. Never paste directly into final app namespaces first.
   Use `components/mc-imports/*` or `components/mc-shell/*`.

2. Keep adapter mapping explicit.
   Every imported component should have a note:
   - source file
   - target MUTX data source
   - status: copied / wired / adapted / removed

3. Do not delete existing MUTX surfaces until replacement is mounted and verified.

4. Track every harvested file in a ledger.

## Recommended ledger format

| Imported File | Source | Target | Status | Notes |
|---|---|---|---|---|
| sidebar.tsx | MC layout | components/mc-shell/sidebar.tsx | wired | uses MUTX route map |
| onboarding banner | MC onboarding | components/onboarding/... | adapted | now includes OpenClaw link flow |

5. Keep React version mismatches in mind.
Mission Control uses React 19 while MUTX docs still describe React 18. Validate imported hooks/components carefully.

6. Prefer CSS/token/system reuse over exact feature reuse when domain assumptions diverge.
