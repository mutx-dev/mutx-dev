---
description: Install, configure, authenticate, operate, and release the MUTX CLI + TUI.
icon: terminal
---

# CLI Command Reference

The MUTX CLI distribution lives at repo root and installs the `mutx` entrypoint from `pyproject.toml`.

## Install

Editable local install with the operator TUI:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev,tui]"
```

Homebrew install from the third-party tap:

```bash
brew tap mutx-dev/homebrew-tap
brew install mutx
```

The tap formula is expected to smoke-test the package with `mutx status`, not a networked command.

## Configuration

The CLI stores configuration in `~/.mutx/config.json` and reuses the existing `CLIConfig` shape from [`cli/config.py`](../cli/config.py):

```json
{
  "api_url": "http://localhost:8000",
  "api_key": null,
  "refresh_token": null
}
```

You can override the API URL per command:

```bash
mutx --api-url http://localhost:8000 status
```

Or with an environment variable:

```bash
export MUTX_API_URL=http://localhost:8000
```

## First-Time Local Auth Flow

Register through the current `/v1/*` API contract:

```bash
curl -X POST http://localhost:8000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'
```

Then log in with the CLI:

```bash
mutx login --email you@example.com
mutx whoami
mutx status
```

## Operator TUI

Launch the first-party Textual shell with:

```bash
mutx tui
```

The first release is intentionally operator-focused and small:

* Agents: list, detail, deploy, logs
* Deployments: list, detail, events, logs, metrics, restart, scale, delete

Key bindings:

* `r` refresh the active pane
* `d` deploy the selected agent
* `x` restart the selected deployment
* `s` scale the selected deployment
* `backspace` delete the selected deployment
* `q` quit

If no local auth is stored, the TUI still launches and shows the local CLI state instead of crashing.

## Commands

### Authentication

| Command | Description |
| ------- |-------------|
| `mutx status` | Show API URL and auth state without a network call |
| `mutx login --email <email>` | Login to MUTX (prompts for password) |
| `mutx logout` | Clear local tokens |
| `mutx whoami` | Show current user info |
| `mutx tui` | Launch the operator TUI |

### Agents

| Command | Description |
| ------- |-------------|
| `mutx agents list` | List all agents |
| `mutx agents create --name <name>` | Create a new agent |
| `mutx agents status <agent_id>` | Get agent detail |
| `mutx agents logs <agent_id>` | Get agent logs |
| `mutx agents deploy <agent_id>` | Deploy an agent |
| `mutx agents stop <agent_id>` | Stop a running agent |
| `mutx agents delete <agent_id>` | Delete an agent |

### Deployments

| Command | Description |
| ------- |-------------|
| `mutx deploy list` | List all deployments |
| `mutx deploy create --agent-id <id>` | Create a deployment |
| `mutx deploy events <deployment_id>` | Get deployment events |
| `mutx deploy logs <deployment_id>` | Get deployment logs |
| `mutx deploy metrics <deployment_id>` | Get deployment metrics |
| `mutx deploy scale <deployment_id>` | Scale deployment replicas |
| `mutx deploy restart <deployment_id>` | Restart a deployment |
| `mutx deploy delete <deployment_id>` | Delete a deployment |

### Other Groups

Additional command groups remain available for API keys, ClawHub, config, and webhooks. Their implementations still live under `cli/commands/`.

## Smoke Validation

Local editable install and command smoke:

```bash
pip install -e ".[dev,tui]"
mutx status
mutx --help
```

Local stack validation:

```bash
make dev
make test-auth
mutx login --email test@local.dev --password TestPass123!
make seed
mutx agents list --limit 10
mutx deploy list --limit 10
mutx tui
```

Targeted contract coverage:

```bash
pytest tests/test_cli_auth_and_tui.py tests/test_cli_agents_contract.py tests/test_cli_deploy_contract.py
```

## Release Truth

* The CLI distribution version is the root [`pyproject.toml`](../pyproject.toml) version.
* The recommended CLI git tag format is `cli-vX.Y.Z`.
* The Homebrew tap formula should point at the matching `cli-vX.Y.Z` source archive and use `mutx status` as its non-network test.
* The SDK has its own package metadata under [`sdk/pyproject.toml`](../sdk/pyproject.toml); do not treat SDK and CLI release tags as the same thing.
