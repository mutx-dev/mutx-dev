# MUTX

**MUTX is an open-source control plane for deploying and operating AI agents like systems, not demos.**

It brings the core surfaces into one repo: a FastAPI control plane, a browser operator shell, a Python CLI, a first-party Textual TUI, a Python SDK, and the infrastructure lane behind deployment and runtime operations.

![MUTX architecture at a glance](docs/assets/readme-architecture.svg)

## Quickstart

Canonical quickstart: [docs/deployment/quickstart.md](docs/deployment/quickstart.md)

Fastest hosted operator path on macOS:

```bash
curl -fsSL https://mutx.dev/install.sh | bash
mutx setup hosted --open-tui
mutx doctor
mutx assistant overview
```

Canonical local contributor path:

```bash
git clone https://github.com/mutx-dev/mutx-dev.git
cd mutx-dev

npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev,tui]"

make dev-up
mutx setup local --open-tui
mutx doctor
```

The first supported deployment is always `Personal Assistant`.

## What Is Live Today

* FastAPI control plane mounted under `/v1/*`
* starter template catalog with `personal_assistant`
* assistant overview, sessions, health, channels, and skills routes
* Python CLI with `setup`, `doctor`, `auth`, `agent`, `deployment`, `assistant`, `api-key`, and `webhook` surfaces
* `mutx tui`, built with Textual inside the CLI package
* shared auth and config in `~/.mutx/config.json`
* browser control-plane shell under `app/dashboard`
* docs at [docs.mutx.dev](https://docs.mutx.dev)

## Assistant-First Operator Loop

MUTX now assumes the first thing an operator wants is a deployed assistant, not an empty dashboard.

The default flow is:

1. install or start MUTX
2. authenticate
3. deploy `Personal Assistant`
4. connect channels and skills
5. operate it from the web control plane, CLI, or TUI

## CLI And Config

`mutx` and `mutx tui` share the same local config:

```json
{
  "api_url": "http://localhost:8000",
  "access_token": null,
  "refresh_token": null,
  "assistant_defaults": {
    "template": "personal_assistant",
    "runtime": "openclaw",
    "model": "openai/gpt-5"
  }
}
```

Core commands:

```bash
mutx setup hosted
mutx setup local
mutx doctor
mutx assistant overview
mutx tui
```

The older flat commands such as `mutx login`, `mutx whoami`, and `mutx status` still exist for compatibility, but the canonical onboarding path is now `mutx setup`.

## Local Development

Truthful local bootstrap:

```bash
git clone https://github.com/mutx-dev/mutx-dev.git
cd mutx-dev

npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev,tui]"

make dev-up
mutx setup local --open-tui
make dev-logs
make dev-stop
```

Local URLs:

* site and app shell: `http://localhost:3000`
* API: `http://localhost:8000`
* API docs: `http://localhost:8000/docs`

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

* CLI versioning lives in the root `pyproject.toml`
* CLI release tags use `cli-vX.Y.Z`
* Homebrew points at the matching CLI release tarball
* user-visible changes are tracked in [CHANGELOG.md](CHANGELOG.md)

Release docs:

* [docs/deployment/cli-release.md](docs/deployment/cli-release.md)
* [docs/changelog-status.md](docs/changelog-status.md)

## Contributing

High-leverage areas:

* assistant-first onboarding and templates
* OpenClaw runtime integration
* browser control-plane panels
* CLI and TUI alignment with live `/v1/*` routes
* docs drift control

Start here:

* [CONTRIBUTING.md](CONTRIBUTING.md)
* [docs/project-status.md](docs/project-status.md)
* [ROADMAP.md](ROADMAP.md)

## Docs

* [docs/cli.md](docs/cli.md)
* [docs/deployment/quickstart.md](docs/deployment/quickstart.md)
* [docs/architecture/overview.md](docs/architecture/overview.md)
* [docs/contracts/api/index.md](docs/contracts/api/index.md)

Hosted docs: [docs.mutx.dev](https://docs.mutx.dev)

## License

[MIT](LICENSE)
