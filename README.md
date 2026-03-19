<p align="center">
  <img src="https://github.com/fortunexbt/mutx-dev/blob/main/public/logo.png" width="140" alt="MUTX logo"/>
</p>

<h1 align="center">MUTX</h1>

<p align="center">
  <strong>The control plane for AI agents.</strong>
</p>

<p align="center">
  Deploy, operate, and govern agents like production systems.
</p>

## What MUTX Is

MUTX is an open-source control plane for running AI agents as durable systems instead of throwaway scripts.

The current monorepo includes:

- a FastAPI control plane under `src/api/`
- a Next.js site and app surface under `app/`
- a Python CLI and first-party terminal UI under `cli/`
- a Python SDK under `sdk/`
- local bootstrap, Docker, and infrastructure tooling under `scripts/` and `infrastructure/`

Current control-plane API routes are mounted under `/v1/*`.

## What You Can Do Today

- create and inspect agents
- create and operate deployments
- inspect deployment logs, events, and metrics
- use the Python CLI from source
- launch the first-party operator TUI with `mutx tui`
- install the CLI via a third-party Homebrew tap

## Install The CLI

### From source

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev,tui]"
```

Smoke commands:

```bash
mutx --help
mutx status
mutx tui
```

The CLI stores local config in `~/.mutx/config.json`:

```json
{
  "api_url": "http://localhost:8000",
  "api_key": null,
  "refresh_token": null
}
```

### From Homebrew

The intended install path is the third-party tap:

```bash
brew tap mutx-dev/homebrew-tap
brew install mutx
```

The formula is expected to use a non-network smoke test such as `mutx status`.

## Operator TUI

Launch the first-party terminal UI with:

```bash
mutx tui
```

The current operator-focused scope is intentionally small:

- auth/session state
- agents list, detail, deploy, logs
- deployments list, detail, events, logs, metrics
- safe actions with confirmation: restart, scale, delete

The TUI reuses the existing CLI config and auth/session flow. It does not maintain a separate session store.

## Local Quick Start

### Fastest repo-native path

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

### If you prefer direct API checks

Register a user:

```bash
curl -X POST http://localhost:8000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'
```

Log in:

```bash
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"StrongPass1!"}'
```

Then use the returned token with:

- `GET /v1/auth/me`
- `GET /v1/agents`
- `GET /v1/deployments`

## Common Commands

### Local development

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
mutx --help
mutx status
mutx whoami
mutx agents list --limit 10
mutx deploy list --limit 10
mutx tui
```

### Validation

```bash
./scripts/test.sh
```

Smaller CLI-focused validation:

```bash
pytest tests/test_cli_auth_and_tui.py tests/test_cli_agents_contract.py tests/test_cli_deploy_contract.py
python3 -m compileall src/api cli sdk/mutx
```

## Repository Layout

```text
mutx-dev/
├── app/                  # Next.js site and app routes
├── cli/                  # Python CLI and Textual TUI
├── docs/                 # Documentation source
├── infrastructure/       # Docker, Terraform, Ansible, monitoring
├── scripts/              # Local bootstrap and validation helpers
├── sdk/                  # Python SDK
├── src/api/              # FastAPI control plane
└── tests/                # Python, frontend, and contract tests
```

## Release Truth

- the CLI distribution version lives in the root `pyproject.toml`
- the recommended CLI tag format is `cli-vX.Y.Z`
- the Python SDK version lives separately in `sdk/pyproject.toml`
- the Homebrew tap should track the CLI release archive, not frontend/site tags

For the detailed CLI/tap release flow, see [docs/deployment/cli-release.md](docs/deployment/cli-release.md).

## Docs

- CLI guide: [docs/cli.md](docs/cli.md)
- quickstart: [docs/deployment/quickstart.md](docs/deployment/quickstart.md)
- local bootstrap: [docs/deployment/local-developer-bootstrap.md](docs/deployment/local-developer-bootstrap.md)
- release notes and tagging: [docs/changelog-status.md](docs/changelog-status.md)
- architecture overview: [docs/architecture/overview.md](docs/architecture/overview.md)
- API contract docs: [docs/contracts/api/index.md](docs/contracts/api/index.md)

Hosted docs are available at [docs.mutx.dev](https://docs.mutx.dev).

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
