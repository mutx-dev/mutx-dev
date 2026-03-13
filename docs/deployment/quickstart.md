---
description: Fastest local path from clone to first running MUTX workflow.
icon: bolt
---

# Quickstart

This guide follows the current repo layout and route contracts.

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
git clone https://github.com/fortunexbt/mutx.dev.git
cd mutx.dev

npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev]"
cp .env.example .env
```

Set a local database URL in `.env`:

```bash
DATABASE_URL=postgresql://mutx:mutx_password@localhost:5432/mutx
```
{% endstep %}

{% step %}
### Start local services

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres redis
uvicorn src.api.main:app --reload --port 8000
```
{% endstep %}

{% step %}
### Start the web app

In another terminal:

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
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'
```

Log in and save the access token:

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"StrongPass1!"}'
```
{% endstep %}

{% step %}
### Create and deploy an agent record

Confirm your auth first:

```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Create the agent:

```bash
curl -X POST http://localhost:8000/agents \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"My First Agent",
    "description":"Local test agent",
    "config":"{\"model\":\"gpt-4\"}"
  }'
```

Deploy it:

```bash
curl -X POST http://localhost:8000/agents/YOUR_AGENT_ID/deploy
```

Inspect the result:

```bash
curl http://localhost:8000/deployments
curl http://localhost:8000/agents/YOUR_AGENT_ID
```
{% endstep %}
{% endstepper %}

## Optional extras

### CLI setup

```bash
source .venv/bin/activate
pip install -e .
mutx status
mutx login --email you@example.com
mutx whoami
```

{% hint style="warning" %}
`mutx deploy create` still reflects older API assumptions. Prefer `mutx agents deploy` or the direct API route.
{% endhint %}

### Frontend verification

```bash
npm run lint
npm run build
```

### Playwright smoke tests

```bash
npx playwright test --list
```

{% hint style="info" %}
Current Playwright specs target `https://mutx.dev`, not localhost.
{% endhint %}
