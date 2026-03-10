# Debugging

This guide reflects the current stack and route surface.

## Container and Service Logs

```bash
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
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
curl http://localhost:8000/agents
curl http://localhost:8000/deployments
curl http://localhost:8000/agents/YOUR_AGENT_ID
curl http://localhost:8000/agents/YOUR_AGENT_ID/logs?limit=50
curl http://localhost:8000/agents/YOUR_AGENT_ID/metrics?limit=50
```

## Auth Debugging

Register and log in again if you want to validate the auth flow end to end:

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'

curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"StrongPass1!"}'
```

## Database Checks

```bash
docker-compose exec postgres pg_isready -U mutx
docker-compose exec postgres psql -U mutx -d mutx -c "SELECT now();"
```

If the API is degraded, compare the running DB host to your `.env` `DATABASE_URL`.

## CLI Debugging

```bash
mutx status
mutx whoami
mutx agents list --limit 5
mutx deploy list --limit 5
```

If a CLI command fails unexpectedly, compare it against the route implementations in:

- `cli/commands/agents.py`
- `cli/commands/deploy.py`
- `src/api/routes/`

## Frontend Checks

```bash
npm run lint -- --file app/layout.tsx
npm run build
```

## Playwright Note

```bash
npx playwright test --list
```

Current Playwright specs target `https://mutx.dev`, not localhost.
