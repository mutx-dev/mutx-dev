# Quickstart

This quickstart is for the current repo as it exists now: Next.js frontend plus FastAPI control plane.

## What you will run

- Next.js site/app surface on port `3000`
- FastAPI control plane on port `8000`
- Postgres and Redis via Docker Compose

## 1. Canonical local bootstrap (repo root)

```bash
./scripts/dev.sh
```

Or use the convenient Makefile targets for common operations:

```bash
make dev          # Start local dev stack (Docker Compose)
make dev-stop     # Stop dev stack
make test-api     # Run API health tests
make test-auth    # Register test user, login, get token (one-command)
```

**One-command auth setup** (no manual curl needed):
```bash
make test-auth
```
This registers a test user, logs in, and displays your access token with example authenticated requests.

This is the supported local bootstrap entrypoint. It uses `infrastructure/docker/docker-compose.yml` explicitly, creates `.env` from `.env.example` when needed, and starts PostgreSQL, Redis, API, and frontend containers.

## 2. Manual split-process workflow (optional)

If you prefer host processes for API and web:

```bash
npm install
pip install -r requirements.txt
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres redis
uvicorn src.api.main:app --reload --port 8000
npm run dev
```

Backend truth checks:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

Then use:

- `http://localhost:3000` for the marketing site shape
- `http://localhost:3000/app` for the app shell preview
- `http://localhost:3000/api/*` for the Next.js same-origin proxy layer

## 3. Register or log in

Use either the browser flows or direct API calls.

```bash
BASE_URL=http://localhost:8000

curl -X POST "$BASE_URL/auth/register"   -H "Content-Type: application/json"   -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'

curl -X POST "$BASE_URL/auth/login"   -H "Content-Type: application/json"   -d '{"email":"you@example.com","password":"StrongPass1!"}'
```

## 4. Inspect real resources

```bash
curl "$BASE_URL/agents?limit=10&skip=0"   -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/deployments?limit=10"   -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/api-keys"   -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Same-origin browser proxies

The app surface uses Next.js route handlers as browser-facing proxies.

Current live examples in `app/api/` include:

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/me`
- `/api/dashboard/agents`
- `/api/dashboard/deployments`
- `/api/dashboard/health`
- `/api/api-keys`
- `/api/api-keys/[id]`
- `/api/api-keys/[id]/rotate`

These are not a second backend. They proxy to the FastAPI control plane and shape browser/session behavior.

## Regenerate API docs when routes change

```bash
python3 scripts/generate_openapi.py
npm run generate-types
```

## Demo Validation

Verify the frontend demo path works locally:

```bash
npm run demo:validate
```

This starts the Next.js dev server, validates critical routes, and reports pass/fail:

- `/` - Marketing homepage
- `/app` - Operator dashboard shell
- `/contact`, `/privacy-policy` - Static pages

The script exits with code 0 on success, 1 on failure. Use it in CI or pre-demo checks.
