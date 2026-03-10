# AGENTS.md

Guidance for agentic coding agents working in `/Users/fortune/mutx.dev`.

## Scope

- This repo is a mixed codebase: Next.js marketing/product surface, FastAPI backend, Python CLI, Python SDK, Docker, Terraform, and Ansible.
- Prefer source code and config over prose docs when they disagree.
- The worktree may already be dirty. Do not revert unrelated user changes.

## Rule Files

- No `.cursorrules` file was found.
- No files were found under `.cursor/rules/`.
- No `.github/copilot-instructions.md` file was found.
- This file is the closest thing to agent-specific repo guidance right now.

## Repo Map

- `app/`: Next.js 14 App Router frontend.
- `app/(marketing)/`: marketing homepage and waitlist experience.
- `app/app/`: app-facing product surface shown via host rewrite.
- `app/api/`: Next.js server routes for website forms.
- `components/`: shared React components.
- `lib/`: server-side helpers like Postgres waitlist persistence.
- `src/api/`: FastAPI backend, database layer, models, services, integrations.
- `cli/`: Click-based Python CLI.
- `sdk/`: Python SDK package.
- `infrastructure/terraform/`: infra provisioning.
- `infrastructure/ansible/`: server provisioning and deployment playbooks.
- `tests/`: Playwright smoke tests.

## Ground Truth Before Editing

- The current `README.md` and parts of `docs/` overstate how much of the platform is fully wired up.
- Some CLI and SDK docs reference endpoints that do not exist yet.
- The FastAPI app exposes plain routes like `/auth`, `/agents`, and `/deployments`; it does not mount a `/v1` API prefix.
- `app.mutx.dev` behavior is implemented by `middleware.ts`, which rewrites host-based traffic into `app/app/`.
- Waitlist persistence is real and backed by Postgres in `lib/waitlist.ts` and `lib/db.ts`.
- The backend auto-creates tables on startup in `src/api/database.py`; Alembic exists but the migration story is light.

## Setup Commands

### Frontend

```bash
npm install
npm run dev
npm run build
npm run lint
```

### Backend API

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev]"
cp .env.example .env
uvicorn src.api.main:app --reload --port 8000
```

### CLI

```bash
source .venv/bin/activate
pip install -e .
mutx status
mutx login --email you@example.com
```

### SDK

```bash
source .venv/bin/activate
pip install -e "./sdk[dev]"
python3 -c "from mutx import MutxClient; print(MutxClient)"
```

### Docker / Full Stack

```bash
docker-compose up
docker-compose up -d postgres redis
docker-compose -f docker-compose.production.yml up -d --build
docker-compose ps
docker-compose logs -f api
```

### Infra

```bash
terraform -chdir=infrastructure/terraform init
terraform -chdir=infrastructure/terraform plan
ansible-playbook -i infrastructure/ansible/inventory.ini infrastructure/ansible/playbooks/provision.yml
```

## Lint, Format, and Test Commands

### Frontend Lint

```bash
npm run lint
npm run lint -- --file app/layout.tsx
npm run lint -- --file components/WaitlistForm.tsx
```

### Frontend Build

```bash
npm run build
```

### Playwright E2E

```bash
npx playwright test
npx playwright test tests/website.spec.ts
npx playwright test tests/website.spec.ts:4
npx playwright test -g "no console errors"
npx playwright test --list
```

- Important: current Playwright tests hit `https://mutx.dev` directly, not localhost.
- Treat them as smoke/QA tests against the live site unless you first rewrite the tests.

### Python Lint / Format

```bash
ruff check src/api cli sdk
ruff check src/api/routes/auth.py
black src/api cli sdk
black src/api/routes/auth.py
```

- `pyproject.toml` sets Python line length to 100.
- `sdk/pyproject.toml` enables Ruff import sorting rules.

### Python Tests

```bash
python3 -m pytest
python3 -m pytest path/to/test_file.py
python3 -m pytest path/to/test_file.py::test_name -q
python3 -m pytest --collect-only -q
```

- Root `pyproject.toml` configures `pytest`, but there are currently no committed root `test_*.py` files.
- In a fresh environment, `pytest` may not be installed until you run `pip install -e ".[dev]"`.

### Migrations / DB Bootstrapping

```bash
alembic upgrade head
./scripts/setup.sh
```

- `scripts/setup.sh` also installs deps, builds Docker services, starts Postgres/Redis, and runs migrations.
- Be cautious: startup schema creation in `src/api/database.py` is doing real work today.

## Known Workflow Gaps

- `scripts/test.sh` is partially stale: it calls `pytest tests/` even though `tests/` currently contains Playwright specs, and it calls `npm run test` even though no `test` script exists in `package.json`.
- Some docs say `pip install -e ./cli`, but `cli/` is not a standalone Python package.
- Some docs and SDK examples use endpoint shapes that do not match the FastAPI routes in `src/api/routes/`.
- If you update docs, align them to actual code rather than preserving older claims.

## Code Style: General

- Preserve the split between marketing frontend (`app/(marketing)`), app surface (`app/app`), website API routes (`app/api`), and FastAPI backend (`src/api`).
- Make minimal, targeted changes. Do not do repo-wide reformatting unless asked.
- Follow the local style of the file you are editing when the repo is inconsistent.
- Prefer descriptive names over clever names.
- Avoid introducing new dependencies unless there is a strong reason.
- Keep environment-variable usage centralized where possible.

## Code Style: TypeScript / Next.js

- Use TypeScript everywhere practical; `tsconfig.json` has `strict: true`.
- Prefer explicit prop types and function signatures.
- Avoid `any`; use unions, `unknown`, or shared types instead.
- Use PascalCase for components and types.
- Use camelCase for variables, functions, and local helpers.
- Use `UPPER_SNAKE_CASE` for top-level constants only when they are true constants.
- Import order in app code is typically: framework/external, then local alias imports from `@/`.
- Prefer `@/` path aliases over deep relative imports in frontend code.
- Use named exports for reusable components unless the file is a page/layout/route default export.
- Add `'use client'` only when hooks, browser APIs, or client-only libraries require it.
- Keep Tailwind classes inline with JSX; this codebase does not use a separate styling abstraction for most UI.
- Reuse existing design tokens like `bg-background`, `text-foreground`, and CSS variables from `app/globals.css`.
- Preserve the current visual language: dark surfaces, restrained blue/amber/emerald accents, rounded panels, subtle gradients, and Space Grotesk typography.
- In Next.js route handlers, validate inputs early and return `NextResponse.json(...)` with explicit status codes.
- In client forms, maintain the existing `loading` / `success` / `error` state pattern when extending form UX.

## Code Style: Python API

- Use 4-space indentation and keep lines within the Black/Ruff 100-character target.
- Prefer type hints on public functions, service methods, and model fields.
- Use snake_case for modules, functions, and variables.
- Use PascalCase for classes, Pydantic models, SQLAlchemy models, and enums.
- Use `UPPER_SNAKE_CASE` for enum members and module constants.
- In `src/api/`, prefer absolute imports like `from src.api...` at package boundaries.
- Package-relative imports are already used in a few service/integration modules; do not churn them unless you have a reason.
- For new Pydantic v2 models, prefer `model_config = ConfigDict(...)`.
- When editing older Pydantic models that still use `class Config`, preserve nearby style unless you are already modernizing that file.
- Keep FastAPI route handlers thin: validate input, fetch dependencies, call services, return schemas.
- Put reusable business logic in `services/`, not directly in route handlers.
- Raise `HTTPException` for expected client and auth failures.
- Return generic client-facing error messages where appropriate; log internal details server-side.
- Use structured logging via `logging.getLogger(__name__)` rather than ad hoc prints.
- Be careful with blocking calls inside async functions.
- Preserve SQLAlchemy async patterns: `AsyncSession`, `await session.execute(...)`, `await session.commit()`, `await session.refresh(...)`.

## Code Style: Python SDK and CLI

- SDK methods currently lean on `response.raise_for_status()`; follow that pattern for HTTP failures.
- Keep SDK return types small and ergonomic, with thin wrapper classes over API payloads.
- Keep CLI output human-readable and concise using `click.echo`.
- For CLI failures, print actionable messages to stderr rather than raw stack traces.
- Match existing command naming and option style when adding commands.

## Error Handling Patterns

- Frontend server routes: validate, branch early, return JSON errors with explicit HTTP status.
- Frontend client components: show friendly error text, do not leak raw exceptions to the UI.
- FastAPI routes: use `HTTPException` for user-facing failures.
- Services and integrations: log operational detail, surface typed or structured failures upward.
- SDK: let HTTP status failures raise.
- CLI: catch API failures and translate them into plain English.

## When You Change Behavior

- Update the closest docs or examples if the user asked for docs alignment.
- If you change commands, check `README.md`, `docs/`, and scripts for drift.
- If you change API routes or payloads, review the SDK and CLI for compatibility.
- If you change waitlist or contact flows, review both `app/api/...` routes and the React forms that call them.
- If you change host routing, review `middleware.ts` and both `app/(marketing)` and `app/app` entrypoints.

## Suggested Validation Checklist

- Frontend UI change: run `npm run lint` and, if relevant, `npm run build`.
- Frontend route/API change: test the page or handler manually and run targeted lint.
- Playwright change: run a targeted `npx playwright test ...` command and remember it currently targets production.
- Backend Python change: run `ruff check` on touched files and `black` if formatting drift appears.
- New Python tests: run `python3 -m pytest path/to/test_file.py::test_name -q`.
- API/database change: hit `/health` and `/ready` after booting the app.

## Practical Defaults

- Trust code over docs.
- Preserve file-local style.
- Avoid unrelated cleanup.
- Keep claims in docs honest.
- When in doubt, make the smallest correct change and leave clear validation notes.
