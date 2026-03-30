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

* `app/`: Next.js 14 App Router frontend.
* `app/api/`: Next.js route handlers that proxy or handle website requests.
* `components/`: shared React UI components.
* `lib/`: shared TypeScript utilities; currently `lib/utils.ts` only.
* `src/api/`: FastAPI backend, models, services, middleware, and integrations.
* `cli/`: Click-based Python CLI.
* `sdk/mutx/`: Python SDK package.
* `tests/api/`: pytest API tests.
* `tests/website.spec.ts`: Playwright smoke tests.
* `infrastructure/`: Terraform, Ansible, monitoring, and related Make targets.

## Ground Truth And Known Drift

* Trust source code and config over README/docs when they disagree.
* FastAPI public control-plane routes are mounted under `/v1/*`, with root probes at `/`, `/health`, `/ready`, and `/metrics`.
* `docs/api/AGENTS.md` is stale: `POST /agents` no longer accepts `user_id` from the request body, and auth dependencies are attached.
* Parts of older docs still drift; check `src/api/main.py`, `src/api/routes/`, and `docs/api/openapi.json` before copying examples.
* Frontend linting is currently broken: `next lint` and direct `eslint` both fail with the checked-in ESLint 10 plus `.eslintrc.json` setup.
* `npm run build` works because it uses `next build --no-lint`.
* `tests/conftest.py` is stale against `src/api/models/models.py`; pytest collects tests, but runtime execution currently fails because fixtures still pass `username` and `hashed_password` to `User`.
* `tests/website.spec.ts` hits `https://mutx.dev` directly; treat Playwright as production smoke testing unless you rewrite it.
* `scripts/test.sh` runs the current trusted validation baseline instead of `npm test`, which does not exist in `package.json`.

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

* `npm run build` performs a production build and type validation, but skips lint via `--no-lint`.
* `npm run lint` is the intended lint command, but it currently fails with the checked-in dependency/config combination.
* There is no reliable single-file frontend lint command until ESLint is migrated to flat config or downgraded.

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
* Current reality: collection works, but execution is failing because fixtures do not match the current `User` model.

**Playwright smoke tests**

```bash
npx playwright test
npx playwright test tests/website.spec.ts
npx playwright test tests/website.spec.ts:4
npx playwright test -g "no console errors"
npx playwright test --list
```

* `tests/website.spec.ts` is the only Playwright spec right now.
* The spec hardcodes `https://mutx.dev`, so it exercises production rather than a local dev server.

**Infrastructure**

```bash
make -C infrastructure tf-fmt
make -C infrastructure tf-validate
make -C infrastructure tf-plan-staging
make -C infrastructure ansible-lint
make -C infrastructure monitor-validate
```

* Direct Terraform also works, for example `terraform -chdir=infrastructure/terraform plan ...`.

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
* Watch for route drift: parts of the SDK still default to `/v1` URLs even though the backend currently exposes unversioned routes.

**Tests and validation**

* Pytest tests are class-based `pytest-asyncio` tests using `AsyncClient` with `ASGITransport` and in-memory SQLite fixtures.
* Playwright tests are smoke-style and currently target production.
* There is no `npm test` script in `package.json`.
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
