---
description: Install, configure, authenticate, and use the CLI against live routes.
icon: terminal
---

# CLI Command Reference

The CLI is a Click application defined in `cli/` and installed from the repo root.

## Install

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev]"
```

## Configuration

The CLI stores configuration in `~/.mutx/config.json`.

Default local config values come from `cli/config.py`:

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

The CLI can log in, but it does not currently register users.

Create a user first via the API:

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'
```

Then log in with the CLI:

```bash
mutx login --email you@example.com
mutx whoami
mutx status
```

## Commands

### Authentication

| Command | Description |
| ------- |-------------|
| `mutx status` | Show API URL and auth state |
| `mutx login --email <email>` | Login to mutx.dev (prompts for password) |
| `mutx logout` | Clear local tokens |
| `mutx whoami` | Show current user info |

### Agents

| Command | Description |
| ------- |-------------|
| `mutx agents list` | List all agents |
| `mutx agents create --name <name>` | Create a new agent |
| `mutx agents status <agent_id>` | Get agent status |
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

### API Keys

| Command | Description |
| ------- |-------------|
| `mutx api-keys list` | List all API keys |
| `mutx api-keys create --name <name>` | Create a new API key |
| `mutx api-keys revoke <key_id>` | Revoke an API key |
| `mutx api-keys rotate <key_id>` | Rotate an API key |

### ClawHub

| Command | Description |
| ------- |-------------|
| `mutx clawhub list` | List trending skills |
| `mutx clawhub install --agent-id <id> --skill-id <id>` | Install a skill to an agent |
| `mutx clawhub uninstall --agent-id <id> --skill-id <id>` | Uninstall a skill from an agent |

### Webhooks

| Command | Description |
| ------- |-------------|
| `mutx webhooks list` | List all webhooks |
| `mutx webhooks get <webhook_id>` | Get webhook details |
| `mutx webhooks deliveries <webhook_id>` | Get webhook delivery history |

## Example Session

```bash
# Check local setup
mutx status

# Log in after registering via API
mutx login --email you@example.com

# Confirm identity
mutx whoami

# List current agents
mutx agents list --limit 10

# List current deployments
mutx deploy list --limit 10

# Create a deployment for an owned agent
mutx deploy create --agent-id YOUR_AGENT_ID --replicas 1

# Restart a failed deployment
mutx deploy restart YOUR_DEPLOYMENT_ID

# Fetch webhook delivery history
mutx webhooks deliveries YOUR_WEBHOOK_ID --limit 10
```

## When in Doubt

If CLI behavior and docs diverge, inspect:

* `cli/main.py`
* `cli/commands/agents.py`
* `cli/commands/deploy.py`
* `cli/config.py`
