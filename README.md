# MUTX

**MUTX is an open-source control plane for operating AI agents like systems, not demos.**

It brings the useful surfaces into one repo: a FastAPI control plane, a Next.js site and app shell, a Python CLI, a first-party terminal UI, a Python SDK, and the infrastructure lane behind deployment and runtime operations.

![MUTX architecture at a glance](docs/assets/readme-architecture.svg)

## Quickstart

Fastest macOS path:

```bash
curl -fsSL https://mutx.dev/install.sh | bash
```

That guided installer will:

- tap `mutx-dev/homebrew-tap`
- install or upgrade `mutx`
- relink the Homebrew binary if an older `/opt/homebrew/bin/mutx` shim already exists
- run `mutx status`
- walk API URL and login setup
- ask whether to open `mutx tui`

If you skip login, you can still open the TUI later in local-only mode and inspect the current config state safely.

Manual Homebrew path:

```bash
brew tap mutx-dev/homebrew-tap
brew install mutx
brew link --overwrite mutx
hash -r
```

From source:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev,tui]"
```

## What Is Live Today

- FastAPI control plane under `/v1/*`
- Python CLI with auth, status, agents, deployments, API keys, webhooks, and config
- `mutx tui`, built with Textual inside the CLI package
- shared auth and config in `~/.mutx/config.json`
- docs at [docs.mutx.dev](https://docs.mutx.dev)
- monorepo infra lane under `infrastructure/`

The hosted dashboard is still catching up. The serious operator path today is the control plane, CLI, TUI, docs, and local stack.

## Why MUTX

Most agent stacks still break at the boring but critical layer:

- auth and ownership boundaries
- deployment lifecycle control
- logs, events, and metrics in one operator loop
- truthful tooling when the dashboard is incomplete
- infrastructure that can be operated instead of hand-held

MUTX exists to make that layer explicit.

## Operator Surface

`mutx` and `mutx tui` share the same local config:

```json
{
  "api_url": "http://localhost:8000",
  "api_key": null,
  "refresh_token": null
}
```

Core commands:

```bash
mutx status
mutx login --email you@example.com
mutx whoami
mutx tui
```

`mutx tui` currently supports:

- auth and session visibility
- agent list, detail, deploy, and logs
- deployment list, detail, events, logs, and metrics
- safe actions with confirmation: restart, scale, delete

## Local Development

Truthful local path:

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

- site and app shell: `http://localhost:3000`
- API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Repo Map

```text
mutx-dev/
├── app/             # Next.js site and app shell
├── cli/             # Python CLI and Textual TUI
├── docs/            # Docs, architecture, contracts, troubleshooting
├── infrastructure/  # Docker, Terraform, Ansible, monitoring
├── sdk/             # Python SDK
├── src/api/         # FastAPI control plane
└── tests/           # CLI, contract, and frontend coverage
```

## Release And Changelog

- CLI versioning lives in the root `pyproject.toml`
- CLI release tags use `cli-vX.Y.Z`
- Homebrew points at the matching CLI release tarball
- user-visible changes are tracked in [CHANGELOG.md](CHANGELOG.md)

Release docs:

- [docs/deployment/cli-release.md](docs/deployment/cli-release.md)
- [docs/changelog-status.md](docs/changelog-status.md)

## Contributing

High-leverage areas:

- API auth and ownership enforcement
- dashboard reads and write flows
- CLI and SDK alignment with live `/v1/*` routes
- infrastructure validation
- docs drift control

Start here:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [docs/project-status.md](docs/project-status.md)
- [ROADMAP.md](ROADMAP.md)

## Docs

- [docs/cli.md](docs/cli.md)
- [docs/deployment/quickstart.md](docs/deployment/quickstart.md)
- [docs/architecture/overview.md](docs/architecture/overview.md)
- [docs/contracts/api/index.md](docs/contracts/api/index.md)

Hosted docs: [docs.mutx.dev](https://docs.mutx.dev)

## License

[MIT](LICENSE)
