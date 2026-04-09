# MUTX

> Source-available control plane for deploying and operating AI agents like systems, not demos.

![MUTX dashboard demo](demo.gif)

Most teams can prototype an agent. Very few can run one in production with durable identity, deployment semantics, sessions, health, access control, and honest operator contracts.

MUTX is the layer around the agent system that makes those concerns explicit — not in a whitepaper, in running code.

## What's in the Box

| Component | What it does |
|-----------|-------------|
| **Control Plane API** | FastAPI backend with public routes under `/v1/*` — auth, agents, deployments, sessions, runs, webhooks, budgets, swarms, RAG, and more |
| **Operator Dashboard** | Authenticated browser dashboard at `app.mutx.dev/dashboard` |
| **Landing Site** | `mutx.dev` — product narrative, quickstart, install paths |
| **macOS App** | Signed & notarized desktop operator app via `mutx.dev/download/macos` |
| **CLI + TUI** | `mutx` CLI and `mutx tui` Textual shell — terminal-first operator workflows |
| **Python SDK** | `pip install mutx` — programmatic access to the full control plane |
| **Infrastructure** | Docker Compose for local dev, Terraform + Ansible for cloud, Helm chart for Kubernetes |

## 60-Second Setup

```bash
brew tap mutx-dev/homebrew-tap
brew install mutx
mutx setup hosted
```

That installs the CLI, opens the setup wizard, and deploys your first agent. Choose `Hosted` unless you want the private Docker-backed localhost lane.

```bash
mutx setup local    # Docker-backed local stack
mutx doctor         # Verify everything is wired
```

## Development

```bash
# Local stack (frontend + backend + Postgres + Redis)
make dev-up

# Or run them separately
uvicorn src.api.main:app --reload --port 8000   # backend
npm run dev                                       # frontend
```

| URL | What |
|-----|------|
| `localhost:3000` | Landing site |
| `localhost:3000/dashboard` | Operator dashboard |
| `localhost:3000/control` | Control demo |
| `localhost:8000` | API |
| `localhost:8000/docs` | Swagger UI |

### Validation

```bash
./scripts/test.sh          # full validation suite
npm run build              # frontend build check
npm run typecheck          # TypeScript gate
ruff check src/api cli sdk # Python lint
pytest                     # API tests
npx playwright test        # e2e smoke tests
```

## Architecture

```
mutx.dev ──────────── Next.js landing + releases + download
app.mutx.dev ──────── Dashboard + control demo + browser proxies
src/api/ ──────────── FastAPI control plane (/v1/*)
cli/ ──────────────── Click CLI + Textual TUI
sdk/mutx/ ─────────── Python SDK
infrastructure/ ───── Docker, Terraform, Ansible, Helm, monitoring
agents/ ───────────── Autonomous specialist agent definitions
```

Governance is powered by [Faramesh](https://faramesh.dev) — deterministic policy enforcement, session budgets, phase workflows, credential brokering, and ambient rate limiting. See the [Governance Guide](docs/governance.md).

Auth is RBAC + OIDC. Role-based gates on all routes, JWKS-cached token validation compatible with Okta, Auth0, Azure AD, and Keycloak. See [Authentication](docs/api/authentication.md).

## Go Deeper

- [Manifesto](manifesto.md) — why we build control planes, not demos
- [Technical Whitepaper](whitepaper.md) — long-form architecture framing
- [Roadmap](roadmap.md) — what's next
- [API Reference](docs/api/reference.md) — the public `/v1/*` contract
- [CLI Guide](docs/cli.md) — terminal workflows
- [Python SDK](sdk.md) — programmatic access
- [Contributing](CONTRIBUTING.md) — repo workflow and review guardrails
- [Project Status](docs/project-status.md) — honest current-state tracking

## Built On

MUTX stands on open shoulders:

- **[agent-run](https://github.com/builderz-labs/agent-run)** — agent observability standard (MutxRun, MutxStep, MutxCost)
- **[AARM](https://github.com/aarm-dev/docs)** — Autonomous Action Runtime Management spec (policy engine, approval service, telemetry)
- **[Faramesh](https://github.com/faramesh/faramesh-core)** — pre-execution governance engine
- **[Mission Control](https://github.com/builderz-labs/mission-control)** — dashboard and fleet management concepts

Full attribution in [CREDITS.md](CREDITS.md).

## License

MUTX core is source-available under [BUSL-1.1](LICENSE). Each release converts to Apache-2.0 36 months after publication. The Python SDK is [Apache-2.0](sdk/LICENSE). See [LICENSE-FAQ](LICENSE-FAQ.md) for details.

Commercial hosted, managed, white-labeled, OEM, and embedded use requires a separate license — [hello@mutx.dev](mailto:hello@mutx.dev).
