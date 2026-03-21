---
description: Canonical assistant-first onboarding for hosted operators and local contributors.
icon: bolt
---

# Quickstart

This is the canonical operator quickstart for MUTX.

Every supported lane ends in the same success state:

1. You have a stored authenticated session in `~/.mutx/config.json`.
2. You have deployed the `Personal Assistant` starter template against a dedicated OpenClaw assistant binding.
3. MUTX is tracking that provider runtime under `~/.mutx/providers/openclaw`.
4. You can inspect that assistant from the CLI, TUI, or browser control plane.

For full repo setup details, see [Local Developer Bootstrap](./local-developer-bootstrap.md).

## Hosted operator

Use this when you already have access to a MUTX control plane.

### 1. Install the CLI

Fastest macOS path:

```bash
curl -fsSL https://mutx.dev/install.sh | bash
```

🦞 The installer now hands off to a MUTX provider wizard. OpenClaw is the first enabled provider, and the wizard can install it, resume upstream onboarding, and return you to MUTX with the runtime already tracked.

Source install:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev,tui]"
```

### 2. Run guided setup

```bash
mutx setup hosted --provider openclaw --install-openclaw --open-tui
```

The CLI will:

* prompt for your API URL if needed
* authenticate your operator account
* detect an existing OpenClaw runtime and import its binary/home paths into MUTX tracking
* install OpenClaw if it is missing
* hand off to upstream `openclaw onboard --install-daemon` when needed
* write the provider manifest and bindings under `~/.mutx/providers/openclaw`
* leave local OpenClaw gateway keys in place on the operator machine
* deploy `Personal Assistant`
* optionally open `mutx tui`

### 3. Verify the deployment

```bash
mutx doctor
mutx assistant overview
mutx runtime inspect openclaw
```

Expected result:

* `Authenticated: yes`
* assistant overview returns a deployed `Personal Assistant`
* `mutx runtime inspect openclaw` shows the tracked provider manifest, binding, and last-seen sync state
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

### 3. Bootstrap and deploy the starter assistant

```bash
mutx setup local --provider openclaw --install-openclaw --open-tui
```

If you want a fully non-interactive local smoke path:

```bash
mutx setup local \
  --name "Local Operator" \
  --provider openclaw \
  --install-openclaw \
  --assistant-name "Personal Assistant" \
  --no-input
```

### 4. Verify the local control plane

```bash
mutx doctor
mutx assistant overview
mutx runtime inspect openclaw
mutx tui
```

Useful URLs:

* site and app shell: `http://localhost:3000`
* API: `http://localhost:8000`
* API docs: `http://localhost:8000/docs`

## API contract

The public contract remains mounted under `/v1/*`.

### Bootstrap a local operator token pair

```bash
BASE_URL=http://localhost:8000/v1

curl -X POST "$BASE_URL/auth/local-bootstrap" \
  -H "Content-Type: application/json" \
  -d '{"name":"Local Operator"}'
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
