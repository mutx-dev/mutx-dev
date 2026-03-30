# MUTX Development Guide

## Local Dev Setup

### Prerequisites

- Python 3.11+
- Node.js 20+ / pnpm
- Docker + Docker Compose
- Git

### First-Time Bootstrap

```bash
# Clone the repo
git clone https://github.com/mutx-dev/mutx-dev.git ~/MUTX
cd ~/MUTX

# Install Python deps
pip install -e .

# Start the full stack (Docker + DB + API + Frontend)
make dev
```

`make dev` is the canonical local bootstrap. It starts:
1. PostgreSQL via Docker
2. FastAPI backend (port 8000)
3. Next.js frontend (port 3000)

### Manual Step-by-Step

```bash
# Start Docker containers only
docker compose -f infrastructure/docker/docker-compose.yml up -d

# Install CLI
pip install -e cli/

# Install SDK
pip install -e sdk/

# Install backend deps
pip install -r requirements.txt

# Run backend
cd control-plane && uvicorn src.main:app --reload --port 8000

# In another terminal — run frontend
cd app && npm install && npm run dev
```

---

## Worktree Workflow

Fortune uses Git worktrees for parallel development. Never do direct branch work in the main clone.

### Standard Worktrees

```bash
# Primary factory worktrees (~/mutx-worktrees/factory/)
git -C ~/MUTX worktree add ../mutx-worktrees/factory/backend mutx-dev/backend
git -C ~/MUTX worktree add ../mutx-worktrees/factory/frontend mutx-dev/frontend
git -C ~/MUTX worktree add ../mutx-worktrees/factory/ship mutx-dev/mutx-dev

# Secondary worktrees (~/.openclaw/workspace/.worktrees/)
git -C ~/MUTX worktree add ~/.openclaw/workspace/.worktrees/ui-porting mutx-dev/factory/ui-porting
git -C ~/MUTX worktree add ~/.openclaw/workspace/.worktrees/pr-healer mutx-dev/factory/pr-healer
git -C ~/MUTX worktree add ~/.openclaw/workspace/.worktrees/live-main mutx-dev/main
```

### Worktree Conventions

| Worktree | Branch | Purpose |
|----------|--------|---------|
| `factory/backend` | `mutx-dev/backend` | Backend API, runtime, SDK |
| `factory/frontend` | `mutx-dev/frontend` | Frontend dashboard |
| `factory/ship` | `mutx-dev/mutx-dev` | PR healing + shipping |
| `ui-porting` | `factory/ui-porting` | Porting mutx-control UI components |
| `pr-healer` | `factory/pr-healer` | Fix PR conflicts |
| `live-main` | `mutx-dev/main` | Direct-to-main frontend work |

**Branch naming:** Feature branches use prefixes: `fix/`, `feat/`, `ui/`, `codex/`, `factory/`.

### Rebasing a Worktree

```bash
git fetch origin main
git rebase origin/main
git diff --check   # Validate no conflict markers
git push --force-with-lease
```

---

## Running Tests

### Full Test Suite

```bash
make test
```

### Specific Test Files

```bash
# API tests
pytest tests/api/test_agents.py -v
pytest tests/api/test_deployments.py -v
pytest tests/api/test_runs.py -v

# Unit tests
pytest tests/unit/ -v
```

### With Coverage

```bash
pytest --cov=src --cov-report=term-missing tests/
```

### Known Test Issues

- `tests/api/test_deployments.py` — 65 errors after some rebases; investigate `deployment_id` fixture drift
- Deployment tests may fail if DB is not seeded — run `make test-auth && make seed` first

---

## Seeding Test Data

```bash
# Register a test user and get a JWT token
make test-auth
# Output: access_token=eyJ...

# Create test agents and deployments
make seed
```

The seed script creates a set of realistic test agents and deployments using the test token.

### Manual Auth Token Usage

```bash
TOKEN=$(make test-auth 2>/dev/null | grep access_token | cut -d= -f2)

# List agents
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/v1/agents

# Create an agent
curl -X POST -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "test-agent", "runtime": "anthropic"}' \
     http://localhost:8000/v1/agents
```

---

## Frontend Development

### Setup

```bash
cd ~/mutx-worktrees/factory/frontend

# Install deps (REQUIRED before build — worktrees may lack node_modules)
npm install

# Dev server with hot-reload
npm run dev
```

### Validation

```bash
# Production build — MUST pass before any UI PR
npm run build

# If heap OOM: increase Node memory
NODE_OPTIONS=--max-old-space-size=8192 npm run build

# Type checking
npx tsc --noEmit

# Linting
npx eslint 'app/**/*.ts' --max-warnings=0
```

### Routing

- Canonical operator routes: `app/dashboard/*`
- Legacy `/app/*` routes redirect to `/dashboard/*` via `middleware.ts`
- API proxy routes: `app/api/` (BFF layer for frontend)

### Key Frontend Files

```
app/
├── dashboard/
│   ├── page.tsx          # Canonical dashboard landing
│   ├── agents/
│   ├── deployments/
│   ├── monitoring/
│   ├── runs/
│   ├── webhooks/
│   └── api-keys/
├── app/[[...slug]]/      # Legacy route redirects
└── api/                  # BFF proxy routes
```

---

## Backend Development

### Running the Backend

```bash
cd ~/mutx-worktrees/factory/backend

# With hot-reload
uvicorn src.main:app --reload --port 8000

# Production mode
uvicorn src.main:app --workers 4 --port 8000
```

### Key Backend Directories

```
control-plane/src/
├── main.py              # FastAPI app entry point
├── api/routes/          # Route handlers
│   ├── agents.py
│   ├── deployments.py
│   ├── runs.py
│   ├── monitoring.py
│   └── auth.py
├── runtime/
│   └── adapters/        # Anthropic, OpenAI, etc.
└── db/
    ├── models.py        # SQLAlchemy models
    └── session.py       # DB session management
```

### API Documentation

Swagger UI: `http://localhost:8000/docs`
ReDoc: `http://localhost:8000/redoc`

### Linting

```bash
make lint
# or
ruff check src/
ruff format src/
```

---

## Common Debugging Commands

### Check if services are running

```bash
# Docker containers
docker compose -f infrastructure/docker/docker-compose.yml ps

# API health
curl http://localhost:8000/v1/monitoring/health

# Frontend
curl http://localhost:3000/api/health
```

### View logs

```bash
# Backend logs (from uvicorn stdout)
# Docker compose logs
docker compose -f infrastructure/docker/docker-compose.yml logs -f api

# Frontend logs
docker compose -f infrastructure/docker/docker-compose.yml logs -f frontend
```

### DB inspection

```bash
# Open psql shell
docker compose -f infrastructure/docker/docker-compose.yml exec db psql -U mutx -d mutx

# List tables
\dt

# Inspect agents table
SELECT id, name, user_id, created_at FROM agents LIMIT 10;
```

### Clear and reseed

```bash
docker compose -f infrastructure/docker/docker-compose.yml down -v   # Wipe DB
make dev && make test-auth && make seed                             # Fresh start
```

---

## SDK Development

```bash
cd ~/mutx-worktrees/factory/backend   # or main clone

# Install SDK in editable mode
pip install -e sdk/

# Test SDK
python -c "
from mutx import MutxClient
client = MutxClient(base_url='http://localhost:8000', token='test')
print(client.agents.list())
"
```

### Known SDK Issues

- `MutxAsyncClient` is not fully async — some methods call `httpx.AsyncClient` methods without `await`. See `#114`. Use `MutxClient` (sync) for reliability, or only await methods confirmed to be truly async.

---

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- `ci.yml` — lint, type-check, pytest, coverage gates
- `autonomous-shipping.yml` — auto-merges green PRs, auto-closes failing ones

Ship criteria (all must be true simultaneously):
- GREEN CI (all checks passing)
- CONFLICT-FREE (rebased onto latest `main`)
- NON-DRAFT
- POLICY-CLEAN (no `needs-improvement` label)

---

## Docker Compose Path Issue (Known Issue #115)

Bootstrap scripts may still reference the old root-level `docker-compose.yml`. The canonical path is now `infrastructure/docker/docker-compose.yml`.

**Workaround for broken `make dev`:**
```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

This will be fixed in `#115`.
