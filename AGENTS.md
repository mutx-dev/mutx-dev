---
description: Repo operating notes and ground truth for coding agents working on MUTX.
icon: file-code
---

# AGENTS.md

Repo guidance for agentic coding agents working in `/Users/fortune/MUTX`.

## Rule Files

* No `.cursorrules` file exists.
* No files exist under `.cursor/rules/`.
* No `.github/copilot-instructions.md` file exists.

## Repo Map

* `app/`: Next.js 16 App Router frontend.
* `app/api/`: Next.js route handlers that proxy or handle website requests.
* `components/`: shared React UI components.
* `lib/`: shared TypeScript utilities; currently `lib/utils.ts` only.
* `src/api/`: FastAPI backend, models, services, middleware, and integrations.
* `cli/`: Click-based Python CLI.
* `sdk/mutx/`: Python SDK package.
* `tests/api/`: pytest API tests.
* `tests/website.spec.ts`: Playwright smoke tests.
* `infrastructure/`: Terraform, Ansible, monitoring, and related Make targets.
* `infrastructure/helm/`: Kubernetes Helm chart for MUTX deployment.

## Ground Truth And Known Drift

* Trust source code and config over README/docs when they disagree.
* FastAPI public control-plane routes are mounted under `/v1/*`, with root probes at `/`, `/health`, `/ready`, and `/metrics`.
* RBAC is now enforced on all routes — roles are checked via dependencies in `src/api/routes/`. See `src/api/security.py` for the enforcement layer.
* OIDC token validation exists at `src/api/auth/oidc.py`; configure via `OIDC_ISSUER`, `OIDC_CLIENT_ID`, and `OIDC_JWKS_URI` environment variables.
* `docs/api/AGENTS.md` is stale: `POST /agents` no longer accepts `user_id` from the request body, and auth dependencies are attached.
* Parts of older docs still drift; check `src/api/main.py`, `src/api/routes/`, and `docs/api/openapi.json` before copying examples.
* The repo uses flat-config ESLint via `eslint.config.mjs`; `npm run lint` now checks the repo surface with `eslint . --max-warnings=0`.
* `npm run build` uses plain `next build`.
* Recent repo-level fixes covered `/v1/auth/*` docs drift, the email verification expiry migration backfill guard, the CLI/SDK distribution-name split, and the stale versioning unit export name.
* Playwright runs against the local standalone server from `playwright.config.ts`; build before e2e runs so `.next/standalone` exists.
* `scripts/test.sh` is still the best repo-native baseline, but `package.json` now exposes `npm test` and `npm run typecheck` as explicit frontend entrypoints.

## Setup And Environment

* CI uses Node 20 for frontend checks.
* CI uses Python 3.11 for backend checks; root package requires `>=3.10`, SDK declares `>=3.9`.
* Common bootstrap:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev]"
npm install
cp .env.example .env
```

* Full local stack: `./dev.sh`
* Backend only: `uvicorn src.api.main:app --reload --port 8000`
* Frontend only: `npm run dev`

## Build, Lint, And Test Commands

**Frontend**

```bash
npm run dev
npm run build
npm run generate-types
```

* `npm run build` performs a production build.
* `npm run typecheck` is the explicit frontend TypeScript gate.
* `npm run lint` is repo-wide via `eslint . --max-warnings=0`.

**Python checks**

```bash
ruff check src/api cli sdk
ruff check src/api/routes/agents.py
black --check src/api cli sdk
black src/api/routes/agents.py
python -m compileall src/api cli sdk/mutx
```

* If `ruff` or `black` is missing, install dev extras with `pip install -e ".[dev]"`.

**Pytest API tests**

```bash
./.venv/bin/python -m pytest --collect-only -q
./.venv/bin/python -m pytest
./.venv/bin/python -m pytest tests/api/test_agents.py
./.venv/bin/python -m pytest tests/api/test_agents.py::TestCreateAgent::test_create_agent_success -q
```

* Single-test shape: `path/to/test_file.py::TestClass::test_name`.
* Current reality: collection works; when pytest goes red, check migration head drift and auth docs drift first.

**Playwright smoke tests**

```bash
npx playwright test
npx playwright test tests/website.spec.ts
npx playwright test tests/website.spec.ts:4
npx playwright test -g "no console errors"
npx playwright test --list
```

* Playwright targets the local standalone app server configured in `playwright.config.ts`.
* Build first if `.next/standalone/server.js` is missing.

**Infrastructure**

```bash
make -C infrastructure tf-fmt
make -C infrastructure tf-validate
make -C infrastructure tf-plan-staging
make -C infrastructure ansible-lint
make -C infrastructure monitor-validate
```

* Direct Terraform also works, for example `terraform -chdir=infrastructure/terraform plan ...`.

## Observability

OpenTelemetry is used for distributed tracing across the MUTX platform.

**Span Naming Convention**: All spans should follow the pattern `mutx.<operation>`:
- `mutx.agent.execute` - Agent execution
- `mutx.agent.initialize` - Agent initialization
- `mutx.llm.call` - LLM API calls
- `mutx.tool.execution` - Tool execution
- `mutx.session.start` - Session start
- `mutx.session.end` - Session end

**Standard Attributes**:
- `agent.id` - Unique identifier for the agent
- `session.id` - Session identifier for the interaction
- `trace.id` - Distributed trace identifier

**SDK Usage** (`sdk/mutx/telemetry.py`):
```python
from mutx.telemetry import init_telemetry, span, trace_context, get_tracer

# Initialize with OTLP endpoint
init_telemetry("my-agent", endpoint="http://collector:4317")

# Create spans
with span("mutx.agent.execute", {"agent.id": agent_id}) as sp:
    sp.set_attribute("session.id", session_id)
    # ... work ...

# Propagate trace context
headers = trace_context()  # Returns {"traceparent": "...", "tracestate": "..."}
```

**API Routes**:
- `GET /telemetry/config` - Returns `{otel_enabled, exporter_type, endpoint}`

**Middleware** (`src/api/middleware/tracing.py`):
- Extracts `TRACEPARENT` and `TRACESTATE` headers
- Injects `trace_id` and `span_id` into `request.state`
- Enables distributed trace propagation across services

## Code Style

* Make minimal, targeted changes; do not do repo-wide cleanup unless asked.
* Preserve file-local style when the repo is inconsistent.
* Prefer source code and config over prose docs.
* Keep website/frontend behavior in `app/` and backend control-plane behavior in `src/api/`.
* If you change API routes or payloads, check the CLI, SDK, docs, and tests for drift.

**Imports**

* TypeScript: group external and Next imports before local `@/` imports.
* TypeScript: prefer `@/` aliases over deep relative imports in app code.
* TypeScript: keep type-only imports explicit when useful, for example `import { type Sql } from 'postgres'`.
* Python: prefer stdlib, then third-party, then local imports in new files, but do not churn existing files just to reorder imports.
* Python backend package-boundary imports usually use absolute `from src.api...` imports.
* Avoid wildcard imports.

**TypeScript and Next.js**

* `tsconfig.json` has `strict: true`; prefer explicit props, exported helper signatures, and narrow unions over `any`.
* Use PascalCase for React components and exported types.
* Use camelCase for variables, functions, and local helpers.
* App code usually uses 2-space indentation, single quotes, and no semicolons.
* Some non-app files, especially Playwright specs, use semicolons; preserve the local file style instead of normalizing everything.
* Use default exports for `page.tsx`, `layout.tsx`, and route modules that require them; otherwise prefer named exports.
* Add `'use client'` only when hooks, browser APIs, or client-side libraries require it.
* Keep Tailwind classes inline in JSX; there is no separate styling abstraction here.
* Reuse existing helpers like `cn()` from `lib/utils.ts` instead of reimplementing class merging.
* In `app/api/**/route.ts`, validate early, branch on auth/input quickly, and return `NextResponse.json(...)` with explicit status codes.
* When proxying upstream API calls, preserve upstream status codes when possible and surface concise JSON errors.
* Keep raw exceptions out of user-facing UI; store friendly error strings in component state.

**Python API**

* Use 4-space indentation and keep lines within the 100-character Black/Ruff target.
* Add type hints to public functions, async route handlers, and schema/model-facing code.
* Use snake\_case for modules, functions, variables, and fixtures.
* Use PascalCase for classes, Pydantic schemas, SQLAlchemy models, and enums.
* Prefer Pydantic v2 style with `model_config = ConfigDict(...)` for new schemas.
* SQLAlchemy models use typed `Mapped[...]` and `mapped_column(...)`; follow that pattern in new model fields.
* Keep FastAPI route handlers thin: validate inputs, load dependencies, call services/helpers, and return schemas or serialized payloads.
* Use `HTTPException` for expected 400/401/403/404 cases.
* Use `logging.getLogger(__name__)` for backend logging; do not add ad hoc `print(...)` calls.
* Preserve async DB patterns: `AsyncSession`, `await db.execute(...)`, `await db.commit()`, and `await db.refresh(...)`.
* Be careful with blocking I/O inside async code.

**CLI and SDK**

* CLI commands live under Click groups; follow existing `@click.group` and `@click.command` patterns.
* Keep CLI output concise and human-readable with `click.echo`.
* For CLI failures, prefer actionable `click.echo(..., err=True)` messages over raw tracebacks.
* CLI code currently branches on `response.status_code`; follow that local pattern unless you are intentionally refactoring the file.
* SDK classes are thin wrappers around JSON payloads; keep them small and ergonomic.
* SDK methods generally call `response.raise_for_status()` and then wrap `response.json()` into typed objects; keep that pattern.
* Watch for route drift across the SDK, CLI, and docs; the public backend contract is mounted under `/v1/*`.

**Tests and validation**

* Pytest tests are class-based `pytest-asyncio` tests using `AsyncClient` with `ASGITransport` and in-memory SQLite fixtures.
* Playwright tests are smoke-style and run against the local standalone server.
* `npm test` maps to the Jest unit suite in `tests/unit`.
* Good backend validation: `ruff check src/api/routes/agents.py`, `./.venv/bin/python -m pytest tests/api/test_agents.py::TestCreateAgent::test_create_agent_success -q`, and `python -m compileall src/api`.
* Good frontend validation: `npm run build` and `npx playwright test tests/website.spec.ts -g "homepage loads and has working waitlist"`.
* If you change infra code, use the matching `make -C infrastructure ...` target instead of ad hoc commands when possible.

## CIPHER / OpenCode Operating Model

* CIPHER is the orchestrator: priorities, continuity, roadmap, queue health, and truth checks.
* OpenCode is the executor: code changes, validation, branch management, PR creation, and issue follow-through.
* Canonical repo path: `/Users/fortune/MUTX`
* Preferred OpenCode session: `ses_32248211cffeU1XmfngaGDmd9a`

## OpenCode / Autonomous Execution

* OpenCode is authorized to operate in high-agency mode on this repo.
* Prefer speed, momentum, and continuous shipping over conservative permission friction when the work is recoverable through git history, branches, PRs, or reverts.
* PR-first always. Never merge directly to `main` unless Fortune explicitly asks.
* Every PR should get a comment tagging `@codex please review`.
* Empty queue is a failure state: never allow both open issues and open PRs to hit zero at the same time.
* Zero open PRs while open issues exist is also a failure state: convert the top issue into a live PR or draft PR immediately.
* Backlog creation is incomplete until at least one issue is actively becoming a PR.
* If the queue gets thin, open the next roadmap-backed issues immediately.
* If a merge wave lands, create the next roadmap-backed issues before the queue goes flat.
* If `roadmap.md` is stale, update it like a senior engineer / CTO.
* Update `roadmap.md` after meaningful merge waves, priority changes, newly obvious bottlenecks, or when a roadmap item is effectively complete.
* Fix CI or fix the code, but do not normalize living in red.
* Keep changes small, reviewable, and truthful.
* Do not claim success without matching repo-native validation.
* Prefer the canonical repo path first; if external worktrees are used, keep them purposeful and short-lived.
* Default autonomous loop: inspect → execute → validate → PR → tag `@codex` → report → repeat.

## Reporting Contract

Always report back with:

* Task
* Changed files
* Validation
* PR
* Issue
* Blockers
* Next

## Defaults

* Trust source over docs.
* Prefer the smallest correct change.
* Do not fix unrelated style drift.
* Keep docs honest if you touch them.
* Call out broken scripts or config instead of assuming they work.
