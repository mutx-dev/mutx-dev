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

## Recommended path

For most users, the whole quickstart is:

```bash
curl -fsSL https://mutx.dev/install.sh | bash
```

The installer keeps you inside a MUTX wizard in the same terminal.

* Choose `Hosted` unless you explicitly want a private Docker-backed localhost control plane.
* If OpenClaw is already on the machine, MUTX will detect it and offer to import it.
* If OpenClaw is missing, MUTX can install it, resume onboarding, track it under `~/.mutx/providers/openclaw`, and open the TUI.

After setup:

```bash
mutx doctor
mutx assistant overview
mutx runtime inspect openclaw
mutx runtime open openclaw --surface tui
```

Source install:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev,tui]"
```

## Advanced direct commands

### Hosted operator

```bash
mutx setup hosted --install-openclaw --open-tui
```

If OpenClaw is already installed locally and you only want MUTX to adopt it:

```bash
mutx setup hosted --import-openclaw
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

### Verify the deployment

```bash
mutx doctor
mutx assistant overview
mutx runtime inspect openclaw
mutx runtime open openclaw --surface tui
```

Expected result:

* `Authenticated: yes`
* assistant overview returns a deployed `Personal Assistant`
* `mutx runtime inspect openclaw` shows the tracked provider manifest, binding, and last-seen sync state
* gateway/session state begins to appear once the runtime is active

## Local operator

Use this only when you want a private localhost MUTX control plane on your own machine.

```bash
mutx setup local --install-openclaw --open-tui
```

On first run, MUTX can provision a managed localhost stack under `~/.mutx/runtime/local-control`, generate the local `.env`, start the API at `http://localhost:8000`, and then continue into the OpenClaw wizard. Docker is required for this lane.

Import an existing local OpenClaw runtime instead of reinstalling it:

```bash
mutx setup local --import-openclaw
```

If you want a fully non-interactive local smoke path:

```bash
mutx setup local \
  --name "Local Operator" \
  --install-openclaw \
  --assistant-name "Personal Assistant" \
  --no-input
```

### Verify the local control plane

```bash
mutx doctor
mutx assistant overview
mutx runtime inspect openclaw
mutx runtime open openclaw --surface tui
mutx tui
```

Useful URLs:

* site and dashboard: `http://localhost:3000`
* Dashboard: `http://localhost:3000/dashboard`
* API: `http://localhost:8000`
* API docs: `http://localhost:8000/docs`

### Contributor note

If you are working on the MUTX repo itself, the old repo-backed flow still exists:

```bash
make dev-up
mutx setup local --install-openclaw --open-tui
```

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
