---
description: Install, configure, and operate MUTX through the assistant-first CLI and TUI.
icon: terminal
---

# CLI Command Reference

The MUTX CLI distribution lives at repo root and installs the `mutx` entrypoint from `pyproject.toml`.

## Install

Fastest macOS path:

```bash
curl -fsSL https://mutx.dev/install.sh | bash
```

That script keeps the package-lane chatter quiet, force-links `mutx` if an older shim is already present, verifies the assistant-first command surface, and then hands onboarding off to the CLI itself. If the packaged CLI is behind the installer, it overlays a fresh runtime into `~/.mutx` before continuing.

🦞 The setup handoff now enters a MUTX-owned provider wizard. OpenClaw is the first enabled runtime provider, and MUTX tracks the real upstream OpenClaw home rather than relocating it.

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

The tap formula is expected to smoke-test the package with non-networked command help such as `mutx --help`, `mutx setup --help`, and `mutx doctor --help`.

If Homebrew says `mutx` is installed but not linked, there is usually an older `mutx` shim already present in `/opt/homebrew/bin`. Relink the Homebrew binary with:

```bash
brew link --overwrite mutx
hash -r
which mutx
```

If you want to inspect the conflict before overwriting:

```bash
brew link --overwrite mutx --dry-run
```

If `mutx` still fails with `ModuleNotFoundError: No module named 'cli'`, your shell is still resolving the stale wrapper rather than the Homebrew-managed executable.

## Configuration

The CLI stores configuration in `~/.mutx/config.json` and reuses the existing `CLIConfig` shape from [`cli/config.py`](../cli/config.py):

```json
{
  "api_url": "http://localhost:8000",
  "access_token": null,
  "refresh_token": null,
  "assistant_defaults": {
    "provider": "openclaw",
    "template": "personal_assistant",
    "runtime": "openclaw",
    "model": "openai/gpt-5"
  }
}
```

Config precedence is:

1. CLI flag
2. `MUTX_API_URL`
3. config file
4. default

You can override the API URL per command:

```bash
mutx --api-url http://localhost:8000 doctor
```

Or with an environment variable:

```bash
export MUTX_API_URL=http://localhost:8000
```

## Canonical Setup Flow

Hosted operator:

```bash
mutx setup hosted --provider openclaw --install-openclaw --open-tui
```

Local contributor:

```bash
mutx setup local --provider openclaw --install-openclaw --open-tui
```

Hosted setup authenticates against the configured control plane. Local setup bootstraps a trusted local operator session on `http://localhost:8000`, deploys `Personal Assistant`, and can open the TUI without asking for email or password.

Both lanes now:

* keep MUTX in charge of the flow
* detect an existing OpenClaw install and import its binary/home paths into MUTX tracking
* install OpenClaw on demand
* resume upstream `openclaw onboard --install-daemon` when needed
* track the runtime in `~/.mutx/providers/openclaw`
* sync a last-seen provider snapshot back to the control plane for the web dashboard
* keep local OpenClaw gateway keys on the operator machine instead of uploading them

## Core Commands

### Setup + health

| Command | Description |
| ------- | ----------- |
| `mutx setup hosted` | Authenticate against a hosted control plane and deploy `Personal Assistant` |
| `mutx setup local` | Bootstrap a local operator session and deploy `Personal Assistant` |
| `mutx doctor` | Show config source, auth state, API reachability, provider runtime health, and assistant summary |
| `mutx runtime list` | List local provider runtimes tracked under `~/.mutx/providers` |
| `mutx runtime inspect <provider>` | Inspect the local manifest plus the last synced remote snapshot |
| `mutx runtime resync <provider>` | Push the local provider snapshot back to the API/dashboard |

### Auth

| Command | Description |
| ------- | ----------- |
| `mutx auth login` | Login to MUTX |
| `mutx auth register` | Create a user account |
| `mutx auth logout` | Clear local tokens |
| `mutx auth whoami` | Show current user info |
| `mutx auth status` | Show local auth state |

### Assistants

| Command | Description |
| ------- | ----------- |
| `mutx assistant overview` | Show the current Personal Assistant summary |
| `mutx assistant sessions` | List known assistant sessions |
| `mutx assistant channels --agent-id <id>` | Show assistant channel bindings |
| `mutx assistant health --agent-id <id>` | Show assistant gateway health |
| `mutx assistant skills list --agent-id <id>` | List available and installed skills |
| `mutx assistant skills install --agent-id <id> --skill-id <skill>` | Install a skill |
| `mutx assistant skills remove --agent-id <id> --skill-id <skill>` | Remove a skill |

### Agents + deployments

| Command | Description |
| ------- | ----------- |
| `mutx agent list` | List agents |
| `mutx agent create --template personal_assistant` | Create the starter assistant without the one-shot setup flow |
| `mutx agent deploy <agent_id>` | Deploy an agent |
| `mutx deployment list` | List deployments |
| `mutx deployment create --agent-id <id>` | Create a deployment |

### Compatibility commands

The older flat commands remain available for compatibility:

* `mutx login`
* `mutx logout`
* `mutx whoami`
* `mutx status`
* legacy `agents` and `deploy` groups

## Operator TUI

Launch the first-party Textual shell with:

```bash
mutx tui
```

The TUI now centers the assistant-first operator path:

* `Setup`: auth state, provider cards, wizard steps, runtime pointers, and starter deployment entrypoint
* `Assistant`: assistant overview, status, and deployment context
* `Deployments`: deployment inventory and controls
* `Control Plane`: sessions and gateway detail

Key bindings:

* `r` refresh the active pane
* `d` deploy the default assistant from setup
* `x` restart the selected deployment
* `s` scale the selected deployment
* `backspace` delete the selected deployment
* `q` quit

If no local auth is stored, the TUI still launches and shows the local CLI state instead of crashing.

## Smoke Validation

Local editable install and command smoke:

```bash
pip install -e ".[dev,tui]"
mutx doctor --output json
mutx --help
```

Local stack validation:

```bash
make dev-up
mutx setup local --name "Local Operator" --provider openclaw --install-openclaw --no-input
mutx doctor
mutx assistant overview
mutx runtime inspect openclaw
mutx tui
```

Targeted contract coverage:

```bash
pytest tests/test_cli_auth_and_tui.py tests/test_cli_setup_and_doctor.py
```

## Release Truth

* The CLI distribution version is the root [`pyproject.toml`](../pyproject.toml) version.
* The recommended CLI git tag format is `cli-vX.Y.Z`.
* The Homebrew tap formula should point at the matching `cli-vX.Y.Z` source archive and use `mutx --help` as its non-network test.
* The SDK has its own package metadata under [`sdk/pyproject.toml`](../sdk/pyproject.toml); do not treat SDK and CLI release tags as the same thing.
