---
description: Fastest local path from clone to first running MUTX workflow.
icon: bolt
---

# Quickstart

This guide follows the current repo layout and route contracts.

For a full clone-to-validation onboarding flow (including `pnpm`, `.env` details, and local test targets), see [Local Developer Bootstrap](./local-developer-bootstrap.md).

{% stepper %}
{% step %}
### Check prerequisites

You need:

* Node.js 18+
* Python 3.10+
* Docker and Docker Compose
{% endstep %}

{% step %}
### Install dependencies

```bash
git clone https://github.com/fortunexbt/mutx-dev.git
cd mutx-dev

npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev,tui]"
cp .env.example .env
```

Set a local database URL in `.env`:

```bash
DATABASE_URL=postgresql://mutx:mutx_password@localhost:5432/mutx
```
{% endstep %}

{% step %}
### Optional one-command demo validation

Use this when you want a smoke check that boots the stack and validates routes in one run:

```bash
npm run demo:validate
```

This validates API health and the demo-facing routes in one go.
{% endstep %}

{% step %}
### Start the local demo stack

Use the canonical local bootstrap entrypoint from repo root:

```bash
./scripts/dev.sh
```

If you prefer to run services manually, start the local dependencies first:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres redis
uvicorn src.api.main:app --reload --port 8000
```
{% endstep %}

{% step %}
### Start the web app

In another terminal for manual mode (skip this if you launched `./scripts/dev.sh`, because frontend is already running in Compose):

```bash
npm run dev
```

Visit:

* `http://localhost:3000` for the marketing site
* `http://localhost:3000/app` for the app-facing surface
{% endstep %}

{% step %}
### Verify health

```bash
curl http://localhost:8000/
curl http://localhost:8000/health
curl http://localhost:8000/ready
```
{% endstep %}

{% step %}
### Create a local user

```bash
curl -X POST http://localhost:8000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'
```

Log in and save the access token:

```bash
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"StrongPass1!"}'
```
{% endstep %}

{% step %}
### Create and deploy an agent record

Confirm your auth first:

```bash
curl http://localhost:8000/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Create the agent:

```bash
curl -X POST http://localhost:8000/v1/agents \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"My First Agent",
    "description":"Local test agent",
    "config":"{\"model\":\"gpt-4\"}"
  }'
```

Deploy it (either route works; the CLI uses the canonical `/v1/deployments` create flow):

```bash
curl -X POST http://localhost:8000/v1/agents/YOUR_AGENT_ID/deploy

# or
curl -X POST http://localhost:8000/v1/deployments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"YOUR_AGENT_ID","replicas":1}'
```

Inspect the result:

```bash
curl http://localhost:8000/v1/deployments
curl http://localhost:8000/v1/agents/YOUR_AGENT_ID
```
{% endstep %}
{% endstepper %}

## Optional extras

### CLI setup

```bash
source .venv/bin/activate
pip install -e ".[tui]"
mutx status
mutx login --email you@example.com
mutx whoami
mutx tui
```

`mutx deploy create` now targets the current `POST /v1/deployments` route. See `docs/cli.md` for the current support matrix.

### Frontend verification

```bash
npm run lint
npm run build
```

## Optional: validation commands

Quick discovery for the hosted smoke suite:

```bash
npx playwright test --list
```

Full repo validation:

```bash
./scripts/test.sh
```

Important: the checked-in Playwright smoke suite is part of the repo validation path and currently exercises the hosted surface, not a localhost browser flow.
