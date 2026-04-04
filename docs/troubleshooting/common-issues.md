---
description: Known setup, auth, deploy, and testing issues that match the repo today.
icon: circle-info
---

# Common Issues

This guide focuses on issues that match the current repo state.

## API stays degraded or `/ready` returns `503`

The most common cause is a bad `DATABASE_URL`.

Check `.env`:

```bash
DATABASE_URL=postgresql://mutx:mutx_password@localhost:5432/mutx
```

Then confirm Postgres is up:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres
docker compose -f infrastructure/docker/docker-compose.yml exec postgres pg_isready -U mutx
```

## CLI login works, but agent creation fails

Current cause: older docs and examples may still suggest a client-supplied `user_id`, but the backend now derives ownership from auth.

Use the CLI or the authenticated API shape instead:

```bash
curl -X POST http://localhost:8000/v1/agents \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Support Bot",
    "config":"{\"model\":\"gpt-4\"}"
  }'
```

## `mutx deploy create` returns route errors

This should no longer happen on current mainline: `mutx deploy create` now targets `POST /v1/deployments`.

If you still see route errors, reinstall the CLI from the current repo checkout and retry:

```bash
source .venv/bin/activate
pip install -e ".[tui]"
mutx deploy create --agent-id YOUR_AGENT_ID --replicas 1
```

## Playwright fails against localhost

Current cause: missing build output for the standalone app server. The checked-in Playwright config targets localhost, but it expects `.next/standalone/server.js` to exist.

Build first, then inspect or run the suite:

```bash
npm run build
npx playwright test --list
```

## SDK or docs mention unversioned routes

The current FastAPI app uses the `/v1/*` contract.

Use:

* `http://localhost:8000/v1/auth/...`
* `http://localhost:8000/v1/agents/...`
* `http://localhost:8000/v1/deployments/...`
* `http://localhost:8000/v1/webhooks/...`

## Waitlist works locally, but email does not send

Waitlist persistence works without Resend. Email delivery is optional.

If `RESEND_API_KEY` is unset, signups can still be stored in Postgres.

## Docker stack starts, but tests are unavailable in containers

That is expected with the current images.

* backend images install `requirements.txt`, not the full dev extra set
* `package.json` now exposes `npm test`, but container images still do not guarantee the full local validation toolchain

Prefer host-side verification:

```bash
./scripts/test.sh
```
