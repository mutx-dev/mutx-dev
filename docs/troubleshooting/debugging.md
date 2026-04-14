---
description: Practical commands for inspecting services, auth, data, and validation flow.
icon: bug
---

# Debugging

This guide reflects the current stack and route surface.

## Container and Service Logs

```bash
docker compose -f infrastructure/docker/docker-compose.yml logs -f api
docker compose -f infrastructure/docker/docker-compose.yml logs -f frontend
docker compose -f infrastructure/docker/docker-compose.yml logs -f postgres
docker compose -f infrastructure/docker/docker-compose.yml logs -f redis
```

## API Health Checks

```bash
curl http://localhost:8000/
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

Use `/ready` when you want to know whether the database is actually available.

## Inspect Agents and Deployments

```bash
curl http://localhost:8000/v1/agents
curl http://localhost:8000/v1/deployments
curl http://localhost:8000/v1/agents/YOUR_AGENT_ID
curl http://localhost:8000/v1/agents/YOUR_AGENT_ID/logs?limit=50
curl http://localhost:8000/v1/agents/YOUR_AGENT_ID/metrics?limit=50
```

## Auth Debugging

Register and log in again if you want to validate the auth flow end to end:

```bash
curl -X POST http://localhost:8000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'

curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"StrongPass1!"}'
```

## Database Checks

```bash
docker compose -f infrastructure/docker/docker-compose.yml exec postgres pg_isready -U mutx
docker compose -f infrastructure/docker/docker-compose.yml exec postgres psql -U mutx -d mutx -c "SELECT now();"
```

If the API is degraded, compare the running DB host to your `.env` `DATABASE_URL`.

## CLI Debugging

```bash
mutx status
mutx whoami
mutx agents list --limit 5
mutx deploy list --limit 5
mutx tui
```

If a CLI command fails unexpectedly, compare it against the route implementations in:

* `cli/commands/agents.py`
* `cli/commands/deploy.py`
* `src/api/routes/`

## Frontend Checks

```bash
npm run test:app
npm run build
```

Use `npm run test:app` for the current app-level Jest coverage under `tests/unit/`. Do not rely on ad hoc `next lint --file ...` commands here; the repo's trusted baseline is `scripts/test.sh` plus targeted unit or Playwright runs.

## Playwright Note

```bash
npm run build
npx playwright test --list
npx playwright test tests/website.spec.ts -g "no console errors or remote Guild asset requests"
PLAYWRIGHT_REUSE_EXISTING_SERVER=1 npx playwright test tests/website.spec.ts -g "homepage"
```

Current Playwright smoke coverage runs locally via the checked-in config. Build first when `.next/standalone` is missing, then use `npx playwright test --list` to confirm discovery and run the smallest matching spec or grep target. Local runs now start a fresh standalone server by default so the suite fails closed against stale worktree servers; only set `PLAYWRIGHT_REUSE_EXISTING_SERVER=1` when you intentionally want to reuse an already running standalone server.

## Trusted Validation Baseline

```bash
bash scripts/test.sh
```

That script is the current repo-native validation baseline and now includes:

* Python lint and format checks
* Python compile checks
* full API pytest suite
* OpenAPI type generation
* app-level frontend unit tests
* production build verification
* targeted Playwright smoke coverage
