# MUTX

> Open-source control plane for deploying and operating AI agents like systems, not demos.

![MUTX dashboard demo](demo.gif)

Fastest way to get oriented, get running, and go deeper in MUTX.

MUTX keeps the operator surfaces in one repo:

- a FastAPI control plane with public routes mounted under `/v1/*`
- a Next.js landing site at `mutx.dev`
- a real dashboard surface at `app.mutx.dev/dashboard`
- a browser demo surface at `app.mutx.dev/control/*`
- a Python CLI and first-party Textual TUI
- a Python SDK
- local-first setup and bootstrap flows for hosted and localhost operators

Most teams can already prototype an agent. Very few can run one with durable identity, deployment semantics, sessions, health, access control, and honest operator contracts. MUTX is the layer around the agent system that makes those concerns explicit.

## Governance Engine

MUTX integrates [Faramesh](https://faramesh.dev) by [Faramesh Technologies](https://github.com/faramesh/faramesh-core) as its governance engine. Faramesh provides deterministic AI agent governance through the [FPL (Faramesh Policy Language)](https://github.com/faramesh/fpl-lang):

- **Policy enforcement** — Permit, deny, or defer tool calls based on rules
- **Session budgets** — Max spend, daily limits, call counts per session
- **Phase workflows** — Scope tool visibility by workflow stage (intake → execution)
- **Credential brokering** — Strip API keys, inject ephemeral credentials per call
- **Ambient guards** — Rate limiting across session, not just per call

See the [Governance Guide](docs/governance.md) for CLI commands and policy reference.

> Start with [Quickstart](docs/deployment/quickstart.md) if you want proof, not theory.

## Choose Your Path

<table data-view="cards">
  <thead>
    <tr>
      <th>Title</th>
      <th>Description</th>
      <th data-hidden data-card-target data-type="content-ref">Target</th>
      <th data-hidden data-card-cover data-type="files">Cover</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Quickstart</strong></td>
      <td>Install the stack, prove the local path, and create your first operator state.</td>
      <td><a href="docs/deployment/quickstart.md">quickstart.md</a></td>
      <td><a href="public/landing/victory-core.png">victory-core.png</a></td>
    </tr>
    <tr>
      <td><strong>Documentation Hub</strong></td>
      <td>Use the code-accurate docs hub when you want setup, surface, and status truth.</td>
      <td><a href="docs/README.md">README.md</a></td>
      <td><a href="public/landing/docs-surface.png">docs-surface.png</a></td>
    </tr>
    <tr>
      <td><strong>API Overview</strong></td>
      <td>Verify the mounted `/v1/*` contract, auth model, and public route families.</td>
      <td><a href="docs/api/index.md">index.md</a></td>
      <td><a href="public/landing/wiring-bay.png">wiring-bay.png</a></td>
    </tr>
    <tr>
      <td><strong>Architecture Overview</strong></td>
      <td>Read the platform shape behind the website, dashboard, API, CLI, SDK, and infra.</td>
      <td><a href="docs/architecture/overview.md">overview.md</a></td>
      <td><a href="public/landing/running-agent.png">running-agent.png</a></td>
    </tr>
  </tbody>
</table>

## First 15 Minutes

### Prove The Local Path

Run the canonical setup flow first:

```bash
curl -fsSL https://mutx.dev/install.sh | bash
```

That path opens the hosted installer in your terminal. Choose `Hosted` unless you explicitly want the private Docker-backed localhost lane. MUTX can install OpenClaw, import an existing OpenClaw runtime, resume onboarding, track it under `~/.mutx/providers/openclaw`, and return you to the CLI or TUI without leaving the MUTX shell story.

You can also start directly with the explicit commands:

```bash
mutx setup hosted
mutx setup local
mutx doctor
```

Expected result:

1. authenticated operator state is stored in `~/.mutx/config.json`
2. `Personal Assistant` is deployed against a dedicated OpenClaw assistant binding
3. the `personal_assistant` template is visible as the default assistant starter
4. runtime truth is visible from the CLI, TUI, dashboard, and browser demo surfaces

### Inspect The Live Contract

The public FastAPI control-plane contract is mounted under `/v1/*`, with root probes at `/`, `/health`, `/ready`, and `/metrics`.

Use these references:

- [API Overview](docs/api/index.md)
- [API Reference](docs/api/reference.md)
- [OpenAPI Snapshot](docs/api/openapi.json)

### Check Platform Reality

Use [Project Status](docs/project-status.md) to see what is solid, rough, or still placeholder-backed. It tracks the current truth across the web surfaces, API, CLI, SDK, infrastructure, and tests.

### Go Deeper Only Where Needed

Use these pages when you need more than the shortest path:

- [Documentation Hub](docs/README.md)
- [Architecture Overview](docs/architecture/overview.md)
- [Troubleshooting](docs/troubleshooting/README.md)

## By Goal

### I Want To Ship Locally

- [Quickstart](docs/deployment/quickstart.md) for the fastest path from clone to running services
- [CLI Guide](docs/cli.md) for terminal workflows once the stack is up
- [Debugging](docs/troubleshooting/debugging.md) when setup drifts

### I Want To Understand The Product

- [Manifesto](manifesto.md) for the thesis
- [Technical Whitepaper](whitepaper.md) for the long-form architecture framing
- [Project Status](docs/project-status.md) for current-state honesty
- [Roadmap](roadmap.md) for the next high-leverage work

### I Want To Integrate Or Build Against It

- [API Overview](docs/api/index.md) for base URL, auth, and route map
- [API Reference](docs/api/reference.md) for the public source-of-truth docs
- [Python SDK](sdk.md) for programmatic access
- [Architecture Overview](docs/architecture/overview.md) for the system shape behind the APIs

### I Want To Operate Or Contribute

- [Deployment](docs/deployment/README.md) for local and hosted install paths
- [MUTX Infrastructure](infrastructure.md) for infra context and validation
- [Autonomous Agent Team](agents/README.md) for specialist ownership boundaries
- [Contributing](CONTRIBUTING.md) for repo workflow and review guardrails

## Current Surfaces

| Surface | Path / URL | Current role |
| --- | --- | --- |
| Public site | `mutx.dev` / [`app/page.tsx`](app/page.tsx) | Product narrative, quickstart, install path, metadata |
| Operator dashboard | `app.mutx.dev/dashboard` / [`app/dashboard/`](app/dashboard) | Authenticated operator shell backed by live API reads and writes |
| Control demo | `app.mutx.dev/control/*` / [`app/control/[[...slug]]/page.tsx`](app/control/[[...slug]]/page.tsx) | Browser demo of the control-plane surface |
| Browser proxies | [`app/api/`](app/api) | Same-origin route handlers for auth, dashboard, API keys, webhooks, leads, and direct resource proxies |
| Docs | `docs.mutx.dev` / [`docs/`](docs) | Canonical setup, architecture, API, and troubleshooting docs |
| Control plane API | [`src/api/`](src/api) | FastAPI backend with public `/v1/*` routes plus root `/health`, `/ready`, and `/metrics` |
| CLI + TUI | [`cli/`](cli) and root [`pyproject.toml`](pyproject.toml) | Terminal operator workflows |
| SDK | [`sdk/mutx/`](sdk/mutx) | Python client access to the control plane |

## What Ships Today

### Control Plane

- public route families under `/v1/*`
- route groups for `auth`, `assistant`, `agents`, `deployments`, `templates`, `sessions`, `runs`, `usage`, `api-keys`, `webhooks`, `monitoring`, `budgets`, `rag`, `clawhub`, `runtime`, `analytics`, `onboarding`, `swarms`, and `leads`
- root health probes at `/`, `/health`, `/ready`, and `/metrics`
- database initialization, schema repair, and background monitor wiring

### Assistant-First Workflow

- `personal_assistant` starter template
- one-shot deploy flows through `mutx setup hosted` and `mutx setup local`
- assistant overview, session discovery, channel inspection, skill management, and gateway health
- OpenClaw runtime import, tracking, and resync flows

### Operator Surfaces

- authenticated dashboard pages under [`app/dashboard/`](app/dashboard)
- browser demo pages under [`app/control/`](app/control)
- browser proxy handlers under [`app/api/`](app/api)
- `mutx` CLI
- `mutx tui` Textual operator shell

### Delivery And Operations

- installer at [mutx.dev/install.sh](https://mutx.dev/install.sh)
- local dev stack with `make dev-up`
- infrastructure references in Docker, Terraform, Ansible, and monitoring assets

![MUTX architecture at a glance](docs/assets/readme-architecture.svg)

## Shared Local Config

`mutx` and `mutx tui` reuse the same config shape in `~/.mutx/config.json`:

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

## Development

### Local Stack

```bash
make dev-up
make dev-logs
make dev-stop
```

Useful local URLs:

- site and app host: `http://localhost:3000`
- dashboard: `http://localhost:3000/dashboard`
- control demo: `http://localhost:3000/control`
- API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

### Validation

```bash
./scripts/test.sh
npm run build
pytest tests/test_cli_auth_and_tui.py tests/test_cli_setup_and_doctor.py tests/test_docs_drift.py
```

## Keep These Close

- [Documentation Hub](docs/README.md) for the full docs index
- [Troubleshooting](docs/troubleshooting/README.md) for common breakpoints and recovery steps
- [Support](support.md) for escalation paths
- [Security Policy](security.md) for private disclosure
- [Hosted docs](https://docs.mutx.dev) for the published GitBook view

GitBook publication guardrails:

- GitHub stays canonical for synced content.
- GitBook reads `README.md` and `SUMMARY.md` from the repo root through `.gitbook.yaml`.
- Do not create or rename README pages from the GitBook UI.

## License

MUTX is licensed under the [MIT License](LICENSE).
