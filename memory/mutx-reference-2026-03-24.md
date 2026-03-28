# MEMORY.md - Long-Term Memory

> Last updated: 2026-03-24

## MUTX Product Brief (for sales calls)

**One-liner:** "MUTX is the control plane for AI agents — deploy, operate, and govern them like production infrastructure."

**Plain language for non-technical buyers:**
> "Most teams can get an AI agent working in a demo. MUTX is what you need when you want to run it for real — managing who can access it, how it behaves, what it costs, what happens when it breaks, and whether it's actually doing what you intended."

---

### What MUTX Actually Does (API surface)

**Agents** — Register, configure, deploy, stop, monitor
- `POST /v1/agents` — register an agent with config (model, tools, instructions)
- `GET /v1/agents` — list all agents
- `PATCH /v1/agents/{id}/config` — update agent config live
- `POST /v1/agents/{id}/deploy` — deploy an agent instance
- `POST /v1/agents/{id}/stop` — stop a running agent
- `GET /v1/agents/{id}/logs` — get agent logs
- `GET /v1/agents/{id}/metrics` — get agent metrics

**Deployments** — Full lifecycle management with versioning
- `POST /v1/deployments` — create a deployment
- `GET /v1/deployments` — list deployments
- `POST /v1/deployments/{id}/restart` — restart a deployment
- `POST /v1/deployments/{id}/scale` — scale replicas up/down
- `POST /v1/deployments/{id}/rollback` — rollback to previous version
- `GET /v1/deployments/{id}/versions` — version history
- `GET /v1/deployments/{id}/logs` — deployment logs
- `GET /v1/deployments/{id}/events` — event history (who did what, when)
- `DELETE /v1/deployments/{id}` — kill a deployment

**Runs** — Track what agents actually did
- `GET /v1/runs` — list agent run records
- Traces, execution history, outcome tracking

**Sessions** — Manage agent interaction sessions
- `GET /v1/sessions` — list sessions
- Session-level visibility and control

**Webhooks** — Event-driven integrations
- `POST /v1/webhooks` — create webhook
- `POST /v1/webhooks/{id}/test` — test a webhook
- Webhook delivery lifecycle: create → deliver → retry → inspect

**API Keys** — Per-agent credential management
- `POST /v1/api-keys` — create API key for an agent
- `GET /v1/api-keys` — list keys
- Prevents secret sprawl across agents

**Budgets** — Cost governance per agent
- `POST /v1/budgets` — set budget limits per agent
- Prevents runaway spend on API calls

---

### CLI (what operators type)

```bash
mutx agents list              # List all agents
mutx agents create            # Register new agent
mutx deploy create --agent-id XYZ   # Deploy an agent
mutx deploy list              # List deployments
mutx deploy restart DEPLOYMENT_ID   # Restart
mutx deploy scale ID -r 3    # Scale to 3 replicas
mutx deploy logs ID           # View logs
mutx webhooks create          # Create webhook
mutx api-keys create          # Create API key
mutx doctor                  # Diagnose setup issues
mutx setup                   # First-time setup
make dev                     # Start full local stack
make test-auth               # Register test user, get token
```

---

### What Makes MUTX Different

| Competitor | What they do | MUTX |
|---|---|---|
| LangChain/LangGraph | Agent *building* framework | Agent *operations* platform |
| Langfuse/LangSmith | Observability (what happened) | Control plane (what runs next, who decides) |
| CrewAI dashboard | Session management | Deployment lifecycle + governance |
| Kealu | Enterprise trust/governance layer | Open, extensible, OSS-first control plane |
| Mission Control | UI for OpenClaw sessions | Deeper: deployment, budgets, webhooks, API keys |

**The key insight:** Most tools help you *build* or *observe* agents. MUTX helps you *operate* them — which is a different job that becomes critical once agents are in production.

---

### Common Buyer Objections (with answers)

**"We already have LangChain"**
→ LangChain helps you build agents. MUTX helps you operate them. They're complementary. Once your agent is built, you still need to deploy it, govern it, monitor it, and recover it.

**"Our infra team handles this"**
→ Standard infra tools don't understand agent semantics — what a deployment is, how to restart an agent, what the config should look like, how to track costs per agent. MUTX speaks agent.

**"We'll build it ourselves"**
→ The operational layer for agents is a product in itself. MUTX is already there. Building it yourself means not shipping your actual product while you rebuild operational infrastructure.

**"It's open source — how do you make money"**
→ Open-core: the core is OSS and free. Enterprise features (advanced governance, hosted control plane, SLA-backed support, enterprise integrations) are paid.

**"Is it production-ready"**
→ The API and CLI are real and working. The SDK has some async contract gaps being closed. The dashboard UI was recently rebuilt. We're in active development toward V1.0.

---

## About Fortune

- **Name:** Fortune
- **GitHub:** fortunexbt
- **Timezone:** Europe/Rome (CET/CEST)
- Building MUTX (mutx-dev/mutx-dev) — open-source control plane for AI agent orchestration
- Runs Codex/OpenClaw factory sessions to auto-pump PRs via a disciplined subagent fleet

---

## What MUTX Is

**MUTX** is an open-source **control plane for AI agent orchestration** — treats agents like production infrastructure: deployment, lifecycle management, orchestration, observability, and governance.

Core positioning: *"Deploy agents like services. Operate them like systems."*

MUTX competes in the AI infra space. The reference/inspiration is `mutx-dev/mutx-control` (the original "mission control" UI), which MUTX is forking and porting into its own frontend at `mutx-dev/mutx-dev`.

### The Problem MUTX Solves

Running AI agents at scale means you need:
- **Deployment** — spin up/tear down agent instances reliably
- **Lifecycle management** — start, stop, pause, resume, restart
- **Orchestration** — multi-agent workflows, dependencies, sequencing
- **Observability** — logs, traces, metrics, events
- **Governance** — access control, API keys, quotas, budgets

Most agent frameworks (LangChain, AutoGPT, etc.) are developer SDKs. MUTX is the **ops layer** on top — the thing you use when agents are in production, not just in your notebook.

### Positioning vs Competitors

- **LangChain/LangGraph** — developer framework, not an ops platform
- **AutoGPT / AgentGPT** — toy/demo, no real orchestration
- **CrewAI** — multi-agent flows but no production control plane
- **mutx-dev/mutx-control** — the reference UI MUTX is porting from (our "fork source")
- **OpenClaw** —Fortune's own agent orchestration layer that integrates with MUTX

The differentiation: MUTX combines the agent SDK (agents/, sdk/) with a real FastAPI control plane, a real CLI, and a real operator UI — all consistently documented and deployed.

---

## MUTX Architecture

```
mutx-dev/mutx-dev/
├── control-plane/     # FastAPI backend (the core API server)
├── cli/               # MUTX operator CLI (mutx CLI tool)
├── sdk/               # Python SDK (mutx Python client library)
├── agents/            # Agent templates and runtimes
├── infrastructure/    # Docker, Docker Compose, Terraform, Helm
│   └── docker/
│       └── docker-compose.yml   # Local dev stack
├── docs/              # User-facing and contributor documentation
└── .github/workflows/ # CI/CD including autonomous-shipping.yml
```

### Key Directories

| Path | Purpose |
|------|---------|
| `control-plane/src/api/routes/` | FastAPI route modules (agents, deployments, runs, monitoring, etc.) |
| `control-plane/src/runtime/` | Agent runtime adapters (Anthropic, OpenAI, etc.) |
| `cli/commands/` | CLI command modules |
| `sdk/mutx/` | Python SDK resource modules (agents.py, deployments.py, etc.) |
| `infrastructure/docker/` | Docker Compose definitions (moved from repo root) |

### Entry Points

- **API:** `control-plane/` — run with `make dev` (starts Docker + DB + API + Frontend)
- **CLI:** `cli/` — `pip install -e cli/` then `mutx --help`
- **SDK:** `sdk/` — `pip install -e sdk/`

---

## Key People

| Person | Role |
|--------|------|
| **Fortune** (`fortunexbt`) | Founder, lead developer. Does the big-picture architecture + ships code personally |
| **OpenClaw** | Agent orchestration layer that Fortune runs; coordinates subagent fleet |

---

## Current Status (as of 2026-03-24)

### What's Built

**Backend (control-plane/):**
- FastAPI server with routes for: agents, deployments, runs, monitoring, webhooks, API keys, budgets, events, traces
- Auth: JWT-based, ownership enforced on all agent endpoints (`fix/issue-1132` landed)
- Deployment surface parity work in progress (#117)
- SDK async contract issues known (#114)
- Bootstrap scripts broken after Docker Compose relocation (#115)

**Frontend (app/ in mutx-dev/mutx-dev):**
- Marketing site at `/` (landing page revamped multiple times)
- Canonical dashboard at `/dashboard/*` — the main operator surface
- Dashboard nav collapsed into: Agents, Deployments, Webhooks, API Keys, Logs, Monitoring, Analytics, Spawn
- `/dashboard` is the canonical landing for authenticated operators
- `app.mutx.dev` is the dedicated app host; marketing host redirects to it
- Legacy `/app/*` routes redirect to `/dashboard/*`
- Monitoring shell ported from mutx-control
- Shell health chip reads "Control plane online"
- Public OG image uses MUTX tagline

**CLI + SDK:**
- CLI exists in `cli/commands/deploy.py` but lags backend surface
- SDK exposes `MutxAsyncClient` but many methods are not truly async (#114)

**Infrastructure:**
- Docker Compose stack under `infrastructure/docker/`
- Terraform for cloud deploys
- Helm charts in progress

### What's Staged / In Progress

- **UI port from mutx-control** — ongoing; porting components incrementally. Phase 2 complete (nav rail, dashboard shell, monitoring shell). Phase 3+ in progress.
- **Deployment surface parity** (#117) — API done, CLI/SDK/docs lagging
- **Monitoring/runtime unblock** (#39) — backend executor blocked on timeout/auth issues
- **mutx-control v2.0.1 features pulled** — GNAP sync engine, task-dispatch, i18n (10 languages) in ship worktree; next-intl not yet set up in MUTX frontend
- **Auth fix landed** (#1132) — ownership enforced on all agent endpoints, merged

### Known Issues & Decisions

1. **UI port stuck on validation** — `npm run build` fails in worktree without `node_modules`; `npm install` needed first
2. **Backend executor quarantined** — 7 consecutive timeout errors; disabled until prompt/state-path cleanup + one clean pass
3. **X cron workers disabled** — legacy cron shape errors; need migration before re-enabling
4. **PR backlog** — 15+ open PRs, many DIRTY/BLOCKED/UNSTABLE; healer cleaning conflicts
5. **SDK async contract false advertising** (#114) — `MutxAsyncClient` not truly async
6. **Bootstrap scripts broken** (#115) — scripts still point to root-level Compose files, real files under `infrastructure/docker/`
7. **Monitor/self-heal wiring incomplete** (#39) — scaffolding exists but not connected to real runtime events
8. **Queue health enforcement missing** (#112) — autonomy tooling doesn't enforce zero-PR queue states

### Decisions Made

- **Max 3 concurrent workers per repo** (2026-03-18, after 52-worker rate limit cascade)
- **Direct push for internal refactors** — no PR needed for worktree-based internal changes
- **State-first workflow** — read state files before every action, update after
- **Rate limit protocol** — log → back off 5min → retry once → fail gracefully
- **Ship clean > ship fast** — one green PR > ten broken ones
- **`/dashboard` is canonical** — all `/app/*` redirects to `/dashboard/*`
- **`app.mutx.dev` is app host** — marketing host redirects operators to app host

---

## OpenClaw Integration

Fortune runs **OpenClaw** as the agent fleet orchestrator. OpenClaw manages subagents that:
- Spawn Codex sessions for code work
- Run autonomous shipping loops (healer → shipper → executor)
- Manage X (Twitter) presence via cron workers

### Worktree Setup

```
~/mutx-worktrees/factory/
├── backend/    → mutx-dev/backend    (backend development)
├── frontend/  → mutx-dev/frontend   (frontend development)
└── ship/      → mutx-dev/mutx-dev   (PR healing + shipping)
```

Secondary worktrees:
```
~/.openclaw/workspace/.worktrees/
├── ui-porting/    → mutx-dev/factory/ui-porting
├── pr-healer/      → mutx-dev/factory/pr-healer
├── ship/           → mutx-dev/factory/ship
└── live-main/      → mutx-dev/main (direct-to-main frontend)
```

### Make Commands (local dev)

```bash
make dev          # Start Docker, DB, API, and Frontend together
make test-auth    # Register a test user, print access token
make seed         # Create test agents + deployments using the test token
```

All three are run from the repo root. `make dev` is the canonical local bootstrap.

---

## Key Technical Truths

1. **`make dev` starts everything** — Docker containers, database, FastAPI backend, Next.js frontend
2. **`make test-auth` + `make seed`** — register test user + populate test data
3. **Worktrees are the unit of parallelism** — never do direct branch work in the main clone
4. **Direct-to-main push is OK for internal refactors** — no PR needed for non-public-facing changes
5. **`npm run build` validates the frontend** — must pass before any UI work is considered done
6. **`git diff --check` validates rebases** — use before force-pushing healed branches
7. **Docker Compose moved** — from repo root to `infrastructure/docker/`; bootstrap scripts still need updating
8. **Frontend uses Next.js App Router** — pages at `app/dashboard/`, `app/app/`, routing through `middleware.ts`
9. **X cron workers are disabled** — legacy shape issues, need rewrite before re-enabling
10. **PR ship criteria** — must be simultaneously: GREEN CI, CONFLICT-FREE, NON-DRAFT, POLICY-CLEAN

---

## Open Issues (autonomy:ready labels)

| # | Title | Labels | Status |
|---|-------|--------|--------|
| #117 | Close deployment surface parity drift | area:api, area:cli-sdk, area:docs | open |
| #39 | Wire monitoring and self-healing into runtime | area:ops, area:api | open |
| #114 | Make MutxAsyncClient truthful or deprecate it | area:cli-sdk | open |
| #115 | Fix local bootstrap scripts after Compose relocation | area:infra, area:docs | open |
| #112 | Enforce queue health + Codex review handoff | area:ops, area:docs | open |

---

## Fleet Learnings (2026-03-18 Cascade — Critical)

### The Failure

- 52 workers launched → rate limit cascade → 9,377 errors in `gateway.err.log`
- All providers failed in sequence: MiniMax → OpenAI Codex → OpenRouter
- 9,377 total errors: 5,930 rate_limit, 3,813 API rate limit, 612 LLM timeouts

### Root Causes

1. **Isolated sessions = stateless** — each cron job started with no context continuity
2. **Memory indexing broken** — only `main` agent indexed; codex/opencode had 0 chunks
3. **Provider instability** — no single reliable provider; all failed in sequence
4. **Browser automation broken** — X Pulse workers timing out on UI interactions
5. **File writes failing in isolated sessions** — queue/state files not writable

### What We Fixed

1. Max 3 concurrent workers per repo
2. Rate limit protocol: log → back off 5min → retry once → fail cleanly
3. State files mandatory for continuity
4. `delivery.mode=none` for Discord announce failures (coordination via `reports/` files)
5. Absolute workspace paths in prompts
6. Single reliable model provider (MiniMax via OpenClaw)

---

## X / Social Media Ops (@mutxdev)

### The Volume Spiral → Quality Gates (2026-03-24)

The original X cron system was posting too much, with no quality gates, no caps, and workers running unsupervised. The result: poor engagement ratio, quality score dropped, thread abandonment, and duplicate posts.

**New rules enforced:**

| Action | Cap | Condition |
|--------|-----|-----------|
| Original posts | 2/week | Hard cap. When reached → reply-only until Monday reset |
| Quote-RTs | 7/week | Must be >200 followers AND >30 views |
| Replies | Unlimited | Must be >50K followers OR >20 engagement |
| Likes | No cap | Must be verified account OR in-lane content |

**Timing rules:** 50-min minimum between originals. Preferred windows: 07:00-09:00, 12:00-14:00, 17:00-19:00 Rome. No originals 23:00-07:00.

### Critical X Browser Method

⚠️ **The "+" button for threads in X web UI is broken in automation.** Always reply to your own tweet to continue a thread.

**Before typing:** Click the textbox first, THEN type. X requires focus before input.

### What Works on @mutxdev

**Best performers:** Reply to noahzweben (617 views), Quote-RT ZackKorman (409 views), Pinned manifesto (225 views)

**Winning content angles:**
- "The model is a commodity. Governance is the differentiation."
- "Most hosted control planes claim they can see everything. The honest ones tell you when they can't."
- "Governance that holds at runtime, not just in principle"
- Enterprise voice: operators, not developers. "3am" → "production"

**Verified P1 targets:** @noahzweben, @siddontang, @prefactordev, @Ryan_Singer, @thealpha_ai (Vishnu — building Enterprise Intelligence Control Plane), @joshalbrecht (CTO Imbue), @Saboo_Shubham_ (Sr AI PM Google)

### X Worker Files

```
~/.openclaw/workspace-x/
├── worker_state.json          # Weekly metrics, quality score (78), health status
├── queue/
│   ├── posts_ready.md        # Draft queue with status (READY/POSTED/EXPIRED)
│   ├── posted_log.md          # Full engagement history — every post, like, follow
│   └── execution.log          # Error log for heartbeat health checks
└── docs/AUTONOMOUS_ARCHITECTURE.md  # Quality-gated autonomous worker design
```

### Skills

- `browser-use-mutx` — X posting workflow, browser quirks, thread method, deletion workflow
- `mutx-x-content` — Voice guide (enterprise Do/Never lists), best posts, quality gates, target accounts

### Current Status (2026-03-24)

- **Mode:** reply-only until 2026-03-30 (week's 2 originals not yet replenished)
- **Health:** RUNNING, quality score 78/100
- **Weekly:** 0 originals (2 remaining), 1 quote-RT (6 remaining), 6 replies, 12 likes, 3 followers gained
- **Engagement rate:** 4.2%, ~4,200 estimated views

### Health Alert Rules

- qualityScore < 60 → DEGRADED (reduce frequency)
- qualityScore < 40 → BLOCKED (pause all posting, urgent)
- Browser CDP unreachable → BLOCKED
- Rate limit hit → pause posting, wait for clear

Full X learnings: `memory/x-ops-learnings-2026-03-24.md`

---

## Operational Knowledge

### Factory Session Pattern

1. Spawn Codex agent on an issue branch in `~/mutx-worktrees/factory/`
2. Each agent works on exactly one issue
3. Creates PR when done, tagged `autonomy:claimed`
4. Shipper checks: GREEN CI + CONFLICT-FREE + NON-DRAFT + POLICY-CLEAN → merge
5. Healer fixes conflicts before shipper touches a PR

### ship-closer Pattern

Auto-merge green PRs, auto-close red ones after ~10min of failing checks.

### Cron Worker Pattern

- 15-minute staggered intervals (1 min apart) for company roles
- State persisted to `reports/company/*.md` (not Discord, since announce delivery was broken)
- Workers read `autonomy-queue.json` for work items

---

## Preferences

- Efficiency over ceremony
- Operational rigor for agent deployments
- Clever hacks over repetitive manual work
- Direct push for internal refactors
- Clean validation before any push

---

_Last updated: 2026-03-24 (comprehensive MUTX project context added)_

## 2026-03-24: Role Changed — Co-Founder Mode

Fortune explicitly rejected the "coding agent" framing in a voice memo today.

**What he said:**
- "Your role should NOT be coding or auditing codebases"
- "I prefer Codex for coding — CLI or Mac app"
- "You need to be my business partner, co-founder type"
- "Translate MUTX into marketing terms, revenue terms, business terms"

**What this means:**
- SOUL.md rewritten: business partner, not coder
- Priority order: Revenue → Pipeline → Content → Partnerships → Ops
- NOT a priority: internal tooling, agent frameworks, elaborate automation
- Codex is Fortune's coding tool — I'm not a coding agent

**Implications:**
- Stop building elaborate OpenClaw cron systems unless they serve revenue
- Focus on: revenue paths, content that converts, pipeline, partnerships
- X account (@mutxdev) is a revenue channel — every post should advance pipeline
- Speak in business terms: revenue, market position, pipeline, users

**Confirmed at 09:00 Rome 2026-03-24:**
- ALL coding agents permanently stopped. No Codex, no code generation.
- Backend Executor job is permanently disabled.
- I am purely a product expert and business partner: I know MUTX inside out, I answer questions in plain language, I translate code → business language for non-technical buyers.
- I read the repo, I know what's shipped vs aspirational, I can support enterprise sales calls cold.
- Voice memos are always real direction — transcribe and execute, don't just narrate.

