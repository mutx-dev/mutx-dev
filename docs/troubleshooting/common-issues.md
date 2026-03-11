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
docker-compose up -d postgres
docker-compose exec postgres pg_isready -U mutx
```

## CLI login works, but agent creation fails

Current cause: `mutx agents create` does not supply the `user_id` that `POST /agents` currently requires.

Use the API directly for creation:

```bash
curl -X POST http://localhost:8000/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Support Bot",
    "config":"{\"model\":\"gpt-4\"}",
    "user_id":"YOUR_USER_ID"
  }'
```

## `mutx deploy create` returns route errors

Current cause: that command still targets an older `/api/v1/...` path.

Use the API or `mutx agents deploy` instead:

```bash
curl -X POST http://localhost:8000/agents/YOUR_AGENT_ID/deploy
```

## Playwright fails against localhost

Current cause: `playwright.config.ts` points to `https://mutx.dev`.

Use it as a production smoke suite unless you first rewrite the config and tests for local URLs.

```bash
npx playwright test --list
```

## SDK or docs mention `/v1`

The current FastAPI app does not mount a `/v1` prefix.

Use:

- `http://localhost:8000/auth/...`
- `http://localhost:8000/agents/...`
- `http://localhost:8000/deployments/...`
- `http://localhost:8000/webhooks/...`

## Waitlist works locally, but email does not send

Waitlist persistence works without Resend. Email delivery is optional.

If `RESEND_API_KEY` is unset, signups can still be stored in Postgres.

## Docker stack starts, but tests are unavailable in containers

That is expected with the current images.

- `Dockerfile.api` installs `requirements.txt`, not dev extras
- `package.json` has no `test` script

Prefer host-side verification:

```bash
npm run lint
npm run build
python3 -m pytest --collect-only -q
```
