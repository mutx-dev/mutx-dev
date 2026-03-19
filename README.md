# MUTX

**MUTX is an open-source control plane for running AI agents like durable systems instead of disposable demos.**

It brings the pieces operators actually need into one repo: a FastAPI control plane, a Next.js web surface, a Python CLI, a first-party terminal UI, a Python SDK, and the infrastructure lane behind deployment and runtime operations.

![MUTX architecture at a glance](docs/assets/readme-architecture.svg)

## Fastest Start

If you are on macOS and just want the fastest guided path into MUTX, copy-paste this:

```bash
curl -fsSL https://mutx.dev/install.sh | bash
```

That bootstrap script will:

- tap `mutx-dev/homebrew-tap`
- install or upgrade `mutx`
- relink the Homebrew binary if an older `/opt/homebrew/bin/mutx` shim already exists
- run `mutx status`
- walk you through API URL and login setup
- offer to open `mutx tui`

If you skip login, you can still open the TUI later in local-only mode and inspect the current config/auth state without crashing.

## Why MUTX Exists

Most agent projects are still optimized for demos:

- weak ownership and auth boundaries
- fragile deploy flows
- poor observability once something is live
- too much manual glue between app code, runtime state, and infrastructure
- no honest operator surface when the dashboard is still incomplete

The repo's own status and architecture docs point at the same pressure: agent systems need clearer control-plane boundaries, better deployment lifecycle handling, and faster operator feedback loops than a chat box or one-off script can provide.

MUTX is the answer to that problem set:

- a control plane for auth, agents, deployments, webhooks, health, and ingest
- an operator workflow through `mutx` and `mutx tui`
- a path toward single-tenant runtime isolation, zero-trust networking, self-healing services, and dedicated infrastructure per customer

## What Ships Today

The repo already contains real, working surfaces. It also has some deliberately marked aspirational areas. That distinction matters.

| Surface | Truth today | Status |
| --- | --- | --- |
| `mutx.dev` | Public product narrative and entry point | Supported |
| `docs.mutx.dev` | Canonical docs and API reference | Supported |
| FastAPI control plane | Auth, agents, deployments, API keys, webhooks, ingest, health | Supported in repo |
| Python CLI | Auth, status, agents, deployments, webhooks, API keys, config | Supported in repo |
| `mutx tui` | Operator-focused terminal UI for agents and deployments | Supported in repo |
| `app.mutx.dev` | Operator-facing app shell with real reads, but still incomplete as a full dashboard | Aspirational |

Current API truth is versioned under **`/v1/*`**.

## What MUTX Is Building Toward

The current repo is already useful locally, but the architecture docs are clear about the larger target system:

- dedicated customer environments instead of shared agent sprawl
- zero-trust networking and stronger runtime isolation
- self-healing supervision for connected agents
- observability that includes logs, lifecycle events, metrics, and health
- BYOK-style operation and no token markup as a product principle
- infrastructure that is provisioned, not hand-assembled

That is the important distinction in this repo:

- **today**: the control plane, local stack, CLI, and TUI are real and usable
- **next**: the full hosted operator experience and deeper runtime guarantees keep getting pushed toward the architecture target

## The Operator Surface

The first-party operator interface now exists in two forms:

- the Python CLI: `mutx`
- the terminal UI: `mutx tui`

The TUI is intentionally dense, keyboard-first, and small in scope. It is built with Textual inside the existing CLI package and reuses the same config and auth state as the click commands.

### `mutx tui` currently supports

- auth and session state visibility
- agent list and detail views
- agent deploy and agent log inspection
- deployment list and detail views
- deployment events, logs, and metrics
- safe actions with confirmation: restart, scale, delete
- refreshable panes and operator-first navigation

### Shared config and auth

The CLI and TUI both use `~/.mutx/config.json`:

```json
{
  "api_url": "http://localhost:8000",
  "api_key": null,
  "refresh_token": null
}
```

That means `mutx status`, `mutx whoami`, `mutx agents ...`, and `mutx tui` all operate on the same stored session.

## Architecture And Infra

MUTX is not just a CLI wrapper around a few endpoints. The repo spans the full lane from surface to infrastructure:

- **Web**: Next.js marketing site and app shell under `app/`
- **Control plane**: FastAPI services under `src/api/`
- **Operator tooling**: Python CLI and Textual TUI under `cli/`
- **SDK**: Python SDK under `sdk/`
- **Infra**: Docker, Terraform, Ansible, monitoring, and deployment assets under `infrastructure/`
- **Docs and contracts**: architecture, API, troubleshooting, and release docs under `docs/`

The current high-level platform model is:

- Next.js surfaces in front
- a FastAPI control plane in the middle
- PostgreSQL and Redis in the data layer
- Terraform and Ansible for provisioning and host setup

For the bigger system design, see [docs/architecture/overview.md](docs/architecture/overview.md).

## Install

### From source

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev,tui]"
```

Smoke check:

```bash
mutx --help
mutx status
mutx tui
```

### From Homebrew

The CLI is distributed through the third-party tap:

```bash
brew tap mutx-dev/homebrew-tap
brew install mutx
```

If Homebrew reports that `mutx` is installed but not linked, you likely already have an older `mutx` shim in `/opt/homebrew/bin/mutx` from a previous source or manual install. In that case, relink the Homebrew-managed binary:

```bash
brew link --overwrite mutx
hash -r
which mutx
```

If you want to inspect the overwrite first:

```bash
brew link --overwrite mutx --dry-run
```

After install:

```bash
mutx --help
mutx status
mutx tui
```

If `mutx` still resolves to a stale wrapper and raises `ModuleNotFoundError: No module named 'cli'`, verify that `which mutx` points at the Homebrew-linked path under `/opt/homebrew/bin/mutx` and not an older script.

One-command guided install on macOS:

```bash
curl -fsSL https://mutx.dev/install.sh | bash
```

## Local Quickstart

If you want the fastest truthful local path:

```bash
git clone https://github.com/mutx-dev/mutx-dev.git
cd mutx-dev

npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev,tui]"

make dev
make test-auth
mutx login --email test@local.dev --password TestPass123!
make seed
mutx tui
```

Local URLs:

- site/app: `http://localhost:3000`
- API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

If you want a lower-level API-first path, start with [docs/deployment/quickstart.md](docs/deployment/quickstart.md).

## Common Commands

### Local stack

```bash
make help
make dev
make dev-stop
make test-auth
make seed
make test-api
make test-api-auth
```

### CLI and TUI

```bash
mutx status
mutx whoami
mutx agents list --limit 10
mutx deploy list --limit 10
mutx tui
```

### TUI keys

- `r` refresh the active pane
- `d` deploy the selected agent
- `x` restart the selected deployment
- `s` scale the selected deployment
- `backspace` delete the selected deployment
- `q` quit

Full CLI reference lives in [docs/cli.md](docs/cli.md).

## Repo Map

```text
mutx-dev/
├── app/                  # Next.js marketing site and app shell
├── cli/                  # Python CLI and Textual operator TUI
├── docs/                 # Docs, architecture, contracts, troubleshooting
├── infrastructure/       # Docker, Terraform, Ansible, monitoring
├── scripts/              # Local bootstrap and validation helpers
├── sdk/                  # Python SDK
├── src/api/              # FastAPI control plane
└── tests/                # Python, frontend, and contract tests
```

## Changelog And Release Truth

The repo now tracks multiple release lanes, and the README should be explicit about that:

- frontend and hosted app releases use the main app version flow
- the CLI distribution version lives in the root `pyproject.toml`
- CLI release tags use **`cli-vX.Y.Z`**
- the Homebrew formula should point at the matching CLI tag archive

Current user-visible CLI highlights are tracked in [CHANGELOG.md](CHANGELOG.md). Recent additions include:

- the first-party `mutx tui` operator shell
- a shared CLI service layer under `cli/services/*`
- third-party Homebrew installation through `mutx-dev/homebrew-tap`
- docs aligned to the live `/v1/*` control-plane contract

For the release runbook, see [docs/deployment/cli-release.md](docs/deployment/cli-release.md) and [docs/changelog-status.md](docs/changelog-status.md).

## Validation

Repo-wide validation:

```bash
./scripts/test.sh
```

CLI and TUI focused validation:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev,tui]"

mutx --help
mutx status
python -m pytest tests/test_cli_auth_and_tui.py tests/test_cli_agents_contract.py tests/test_cli_deploy_contract.py
```

## Contributions Requested

MUTX is already broad enough that contribution quality matters more than contribution size.

High-leverage areas from the repo's own status docs:

- route auth and ownership enforcement in the API
- stronger dashboard reads and write flows in the app surface
- CLI and SDK alignment with the live FastAPI contract
- backend route coverage and more truthful CI
- infrastructure validation and operational confidence loops
- docs drift control and better examples

Good first reading:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [docs/project-status.md](docs/project-status.md)
- [ROADMAP.md](ROADMAP.md)
- [docs/surfaces.md](docs/surfaces.md)

The repo also includes an explicit autonomous shipping model in [docs/autonomy/operating_model.md](docs/autonomy/operating_model.md) for small, reviewed, testable changes without giving unattended agents direct production power.

## Documentation

- [docs/README.md](docs/README.md)
- [docs/cli.md](docs/cli.md)
- [docs/deployment/quickstart.md](docs/deployment/quickstart.md)
- [docs/deployment/local-developer-bootstrap.md](docs/deployment/local-developer-bootstrap.md)
- [docs/architecture/overview.md](docs/architecture/overview.md)
- [docs/contracts/api/index.md](docs/contracts/api/index.md)
- [docs/troubleshooting/faq.md](docs/troubleshooting/faq.md)

Hosted docs: [docs.mutx.dev](https://docs.mutx.dev)

## License

[MIT](LICENSE)
