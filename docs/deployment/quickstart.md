# Quickstart

This guide follows the current repo layout and route contracts.

## Prerequisites

- Node.js 18+
- Python 3.10+
- Docker and Docker Compose

## 1. Install dependencies

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

## 2. Start local services

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres redis
```

## 3. Start the API

```bash
uvicorn src.api.main:app --reload --port 8000
```

## 4. Start the web app

In another terminal:

```bash
npm run dev
```

Visit:

- `http://localhost:3000` for the marketing site
- `http://localhost:3000/app` for the app-facing surface

## 5. Verify health

```bash
curl http://localhost:8000/
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

## 6. Create a local user

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'
```

Log in and save the access token if you want to use `/auth/me`:

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"StrongPass1!"}'
```

## 7. Create and deploy an agent record

Log in first so you have an access token:

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

Deploy it (either route works; the CLI uses the canonical `/deployments` create flow):

```bash
curl -X POST http://localhost:8000/agents/YOUR_AGENT_ID/deploy

# or
curl -X POST http://localhost:8000/deployments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"YOUR_AGENT_ID","replicas":1}'
```

Inspect the deployment:

```bash
curl http://localhost:8000/deployments
curl http://localhost:8000/agents/YOUR_AGENT_ID
```

## Optional: CLI setup

The CLI installs from the repo root:

```bash
source .venv/bin/activate
pip install -e .
mutx status
mutx login --email you@example.com
mutx whoami
```

`mutx deploy create` now targets the current `POST /deployments` route. See `docs/cli.md` for the current support matrix.

## Optional: frontend verification

```bash
npm run lint
npm run build
```

## Optional: Playwright smoke tests

```bash
npx playwright test --list
```

Important: current Playwright specs target `https://mutx.dev`, not localhost.
