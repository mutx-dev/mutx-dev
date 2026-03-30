---
name: mutx-dev
description: Definitive MUTX codebase reference for building, deploying, testing, debugging, and contributing to MUTX — the open-source control plane for AI agent orchestration. Triggers on: MUTX architecture, make commands, worktree setup, CLI, SDK, FastAPI backend, React dashboard, Docker compose, agent orchestration, OpenClaw integration, CI/CD, and contributor workflows.
---

# MUTX Development Skill

**MUTX** is an open-source **control plane for AI agent orchestration** — treats agents like production infrastructure.

Tagline: *Deploy agents like services. Operate them like systems.*

---

## What MUTX Is

MUTX solves the problem of running AI agents at scale by providing:

- **Deployment** — spin up/tear down agent instances reliably
- **Lifecycle management** — start, stop, pause, resume, restart
- **Orchestration** — multi-agent workflows, dependencies, sequencing
- **Observability** — logs, traces, metrics, events
- **Governance** — access control, API keys, quotas, budgets

Most agent frameworks (LangChain, AutoGPT, CrewAI) are developer SDKs. MUTX is the **ops layer** on top — for when agents are in production, not just in your notebook.

### Core Stack

| Layer | Tech | Location |
|-------|------|----------|
| Control plane API | FastAPI (Python) | `control-plane/` |
| Operator CLI | Python CLI + Textual TUI | `cli/` |
| Python SDK | `mutx` client library | `sdk/` |
| Dashboard/Frontend | Next.js (App Router) | `app/` |
| Agent templates | Python runtimes | `agents/` |
| Infrastructure | Docker Compose, Terraform, Helm | `infrastructure/` |

---

## Repository Structure

```
mutx-dev/mutx-dev/
├── control-plane/          # FastAPI backend — the core API server
│   └── src/
│       ├── api/routes/    # Route modules: agents, deployments, runs, monitoring,
│       │                  #   webhooks, api_keys, budgets, events, traces, auth
│       └── runtime/       # Agent runtime adapters (Anthropic, OpenAI, etc.)
├── cli/                    # MUTX operator CLI (mutx CLI tool)
│   └── commands/          # CLI command modules
├── sdk/                    # Python SDK
│   └── mutx/              # Resource modules: agents.py, deployments.py,
│                          #   api_keys.py, webhooks.py, runs.py
├── agents/                # Agent templates and runtimes
├── infrastructure/        # Docker, Docker Compose, Terraform, Helm
│   └── docker/
│       └── docker-compose.yml   # Local dev stack (canonical path!)
├── docs/                  # User-facing + contributor documentation
│   ├── api/               # API route docs (agents, deployments, auth, etc.)
│   ├── architecture/       # Architecture overviews
│   ├── autonomy/          # Autonomous shipping docs
│   └── deployment/        # Deployment guides, quickstart
├── app/                   # Next.js frontend
│   ├── dashboard/         # Canonical operator dashboard (`/dashboard/*`)
│   └── api/               # API proxy routes for frontend
├── src/                   # Root-level src (legacy/shared)
├── scripts/               # Dev and bootstrap scripts
├── tests/                 # Pytest test suite
└── Makefile               # Canonical local dev commands
```

### Key Files

- **`Makefile`** — `make dev`, `make test-auth`, `make seed`, `make test`, `make lint`
- **`docker-compose.yml`** — moved from repo root → `infrastructure/docker/docker-compose.yml`
- **`pyproject.toml`** — Python package config
- **`.github/workflows/`** — CI/CD including `autonomous-shipping.yml`
- **`middleware.ts`** — Next.js routing middleware (redirects `/app/*` → `/dashboard/*`)

---

## Key Make Commands

All commands run from the repo root (`~/MUTX/`).

```bash
make dev          # Start Docker, DB, API, and Frontend together (canonical local bootstrap)
make test-auth    # Register a test user and print an access token
make seed         # Create test agents + deployments using the test token
make test         # Run the full pytest suite
make lint         # Run linting checks
make docker-dev   # Start Docker containers for local dev (no hot-reload)
```

### Docker Compose Path

The canonical Docker Compose file moved from the repo root to `infrastructure/docker/`. Bootstrap scripts may still reference the old root-level path — see `references/bootstrap-fix.md` if local dev fails to start.

---

## Development Setup

### Worktree Locations

Fortune uses Git worktrees for parallel development:

```
~/mutx-worktrees/factory/
├── backend/    → mutx-dev/backend    (backend development)
├── frontend/  → mutx-dev/frontend   (frontend development)
└── ship/      → mutx-dev/mutx-dev   (PR healing + shipping)

~/.openclaw/workspace/.worktrees/
├── ui-porting/    → mutx-dev/factory/ui-porting
├── pr-healer/      → mutx-dev/factory/pr-healer
├── ship/           → mutx-dev/factory/ship
└── live-main/      → mutx-dev/main (direct-to-main frontend)
```

**Never do direct branch work in the main clone.** Always use a worktree.

### Local Dev Bootstrap

```bash
# Full stack (Docker + DB + API + Frontend)
make dev

# Or step by step:
docker compose -f infrastructure/docker/docker-compose.yml up -d
mutx setup local
mutx doctor
```

### OpenClaw Integration

OpenClaw is the agent runtime provider that orchestrates MUTX's autonomous fleet. See `references/openclaw-integration.md` for details on how OpenClaw agents connect to MUTX, the control-plane API endpoints they call, and how to configure new agents.

### Database Setup

MUTX uses PostgreSQL. The Docker Compose stack handles DB provisioning automatically. For direct DB access during development:

```bash
# Connect to local DB
psql $(grep DATABASE_URL infrastructure/docker/.env 2>/dev/null || echo "postgresql://mutx:mutx@localhost:5432/mutx")
```

---

## Testing

```bash
# Run full test suite
make test

# Run specific test file
pytest tests/api/test_agents.py -v

# Run with coverage
pytest --cov=src --cov-report=term-missing tests/

# Seed test data first
make test-auth && make seed
```

### Auth Testing

```bash
make test-auth
# Output: prints a JWT access token for the test user
# Use the token as: curl -H "Authorization: Bearer $TOKEN" /v1/...
```

---

## Frontend Development

```bash
# Navigate to frontend worktree
cd ~/mutx-worktrees/factory/frontend

# Install dependencies (required before build)
npm install   # or pnpm install

# Development server (hot-reload)
npm run dev

# Production build validation (REQUIRED before any UI PR)
npm run build

# Type checking
npx tsc --noEmit
```

**Important:** `npm run build` must pass before any UI work is considered done. The worktree may lack `node_modules` — run `npm install` first.

Frontend routing: Next.js App Router at `app/dashboard/*`. Legacy `/app/*` routes redirect to `/dashboard/*` via `middleware.ts`. Canonical operator surface is `/dashboard`.

---

## Key Tech Details

### FastAPI Backend

- **Entry point:** `control-plane/` — run with `make dev`
- **Public routes:** mounted under `/v1/*`
- **Auth:** JWT-based, ownership enforced on all agent endpoints
- **DB ORM:** SQLAlchemy with Alembic migrations
- **Runtime adapters:** `src/runtime/adapters/` (Anthropic, OpenAI, etc.)

### Key API Routes

| Route | Purpose |
|-------|---------|
| `POST /v1/auth/register` | Register a new user |
| `POST /v1/auth/login` | Login, get JWT |
| `GET /v1/agents` | List agents (ownership-filtered) |
| `POST /v1/agents` | Create an agent |
| `GET /v1/deployments` | List deployments |
| `POST /v1/deployments` | Create a deployment |
| `POST /v1/deployments/{id}/restart` | Restart a deployment |
| `GET /v1/runs` | List agent runs |
| `POST /v1/runs` | Create a run |
| `GET /v1/monitoring/alerts` | Get active alerts |
| `GET /v1/api-keys` | Manage API keys |
| `GET /v1/webhooks` | Manage webhooks |

See `references/architecture.md` for full API route reference.

### SDK

```python
from mutx import MutxClient

client = MutxClient(base_url="http://localhost:8000", token="your-jwt-token")
agents = client.agents.list()
```

Async client: `MutxAsyncClient` (note: not all methods are truly async — see `references/development.md`).

---

## Operational Procedures

See `references/operations.md` for:
- Docker compose setup
- Environment variables
- Monitoring a running deployment
- Common operational procedures

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `Module not found: Can't resolve 'zod'` | Run `npm install` in worktree before build |
| `npm run build` fails with heap OOM | Set `NODE_OPTIONS=--max-old-space-size=8192` |
| Bootstrap fails (can't find Compose) | Use `infrastructure/docker/docker-compose.yml` explicitly |
| SDK methods not truly async | Use `MutxClient` (sync) or await only known-async methods |
| Backend executor timeouts | Use absolute workspace paths in prompts |

---

## Contributing Guidelines

1. **State-first workflow:** Read `mutx-fleet-state.md` and `autonomy-queue.json` before every action; update them after
2. **Worktree-based parallelism:** Never do direct branch work in the main clone
3. **Ship clean:** One green PR > ten broken ones
4. **Direct push OK for internal refactors:** No PR needed for non-public-facing internal changes
5. **`git diff --check` before push:** Validates clean rebases
6. **Validate before push:** `npm run build` (frontend), `pytest` (backend)
7. **Max 3 concurrent workers per repo** — avoid rate limit cascades
8. **Rate limit protocol:** Log → back off 5 min → retry once → fail gracefully

### Ship Criteria

Every PR must be simultaneously:
- ✅ GREEN CI (all checks passing)
- ✅ CONFLICT-FREE (rebase onto latest `main`)
- ✅ NON-DRAFT
- ✅ POLICY-CLEAN (no `needs-improvement` labels)

---

## References

- `references/architecture.md` — System architecture, API routes, auth
- `references/development.md` — Local dev setup, worktrees, testing, debugging
- `references/operations.md` — Deployment, Docker, env vars, monitoring
- `references/openclaw-integration.md` — OpenClaw agent integration
- `references/roadmap.md` — Current status, open issues, priorities
