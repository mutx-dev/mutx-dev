# CLI Guide

The CLI is a Click application defined in `cli/` and installed from the repo root.

## Install

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
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

## Commands That Map Cleanly to Current Routes

| Command | Status | Notes |
|--------|--------|-------|
| `mutx status` | reliable | shows API URL and auth state |
| `mutx login` | reliable | uses `/auth/login` |
| `mutx logout` | reliable | clears local tokens and tells you how to confirm the resulting CLI state |
| `mutx whoami` | reliable | uses `/auth/me` |
| `mutx agents list` | reliable | uses `GET /agents` |
| `mutx agents status` | reliable | uses `GET /agents/{id}` |
| `mutx agents logs` | reliable | uses `GET /agents/{id}/logs` |
| `mutx agents deploy` | reliable | uses `POST /agents/{id}/deploy` |
| `mutx agents delete` | reliable | uses `DELETE /agents/{id}` |
| `mutx deploy list` | reliable | uses `GET /deployments` |
| `mutx deploy create` | reliable | uses `POST /deployments` |
| `mutx deploy events` | reliable | uses `GET /deployments/{id}/events` |
| `mutx deploy scale` | reliable | uses `POST /deployments/{id}/scale` |
| `mutx deploy delete` | reliable | uses `DELETE /deployments/{id}` |

`mutx agents create` now relies on authenticated ownership instead of a client-supplied `user_id`.

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
```

## When in Doubt

If CLI behavior and docs diverge, inspect:

- `cli/main.py`
- `cli/commands/agents.py`
- `cli/commands/deploy.py`
- `cli/config.py`
