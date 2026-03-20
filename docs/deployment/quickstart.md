---
description: Canonical assistant-first onboarding for hosted operators and local contributors.
icon: bolt
---

# Quickstart

This is the canonical operator quickstart for MUTX.

Every supported lane ends in the same success state:

1. You have a stored authenticated session in `~/.mutx/config.json`.
2. You have deployed the `Personal Assistant` starter template.
3. You can inspect that assistant from the CLI, TUI, or browser control plane.

For full repo setup details, see [Local Developer Bootstrap](./local-developer-bootstrap.md).

## Hosted operator

Use this when you already have access to a MUTX control plane.

### 1. Install the CLI

Fastest macOS path:

```bash
curl -fsSL https://mutx.dev/install.sh | bash
```

Source install:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev,tui]"
```

### 2. Run guided setup

```bash
mutx setup hosted --open-tui
```

The CLI will:

* prompt for your API URL if needed
* authenticate your operator account
* deploy `Personal Assistant`
* optionally open `mutx tui`

### 3. Verify the deployment

```bash
mutx doctor
mutx assistant overview
```

Expected result:

* `Authenticated: yes`
* assistant overview returns a deployed `Personal Assistant`
* gateway/session state begins to appear once the runtime is active

## Local contributor

Use this when you are working on the MUTX repo itself.

### 1. Install local dependencies

```bash
git clone https://github.com/mutx-dev/mutx-dev.git
cd mutx-dev

npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev,tui]"
```

If `.env` does not exist, `scripts/dev.sh` will create it from `.env.example` and generate a local `JWT_SECRET`.

### 2. Start the local stack

Detached local stack:

```bash
make dev-up
```

Follow logs in another terminal when you need them:

```bash
make dev-logs
```

Stop the stack:

```bash
make dev-stop
```

The legacy one-command foreground mode still exists:

```bash
make dev
```

### 3. Register and deploy the starter assistant

```bash
mutx setup local --open-tui
```

If you want a fully non-interactive local smoke path:

```bash
mutx setup local \
  --email test@local.dev \
  --password TestPass123! \
  --name "Local Operator" \
  --assistant-name "Personal Assistant" \
  --no-input
```

### 4. Verify the local control plane

```bash
mutx doctor
mutx assistant overview
mutx tui
```

Useful URLs:

* site and app shell: `http://localhost:3000`
* API: `http://localhost:8000`
* API docs: `http://localhost:8000/docs`

## API contract

The public contract remains mounted under `/v1/*`.

### Register or log in

```bash
BASE_URL=http://localhost:8000/v1

curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'
```

### Deploy the starter assistant in one action

```bash
curl -X POST "$BASE_URL/templates/personal_assistant/deploy" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Personal Assistant","replicas":1}'
```

### Inspect assistant state

```bash
curl "$BASE_URL/assistant/overview" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/sessions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Validation

Targeted local validation:

```bash
./scripts/test.sh
```

Frontend verification:

```bash
npm run lint
npm run build
```
