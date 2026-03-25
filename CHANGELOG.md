# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.3] - 2026-03-25

### Fixed
- Release validation no longer trips on committed CLI lint/format drift
- Generated OpenAPI and frontend API type artifacts are now in sync with the committed API surface, unblocking the release gate

## [1.2.2] - 2026-03-25

### Fixed
- CLI release validation now uses the same Node 24 and `npm ci --legacy-peer-deps` install lane as main CI, so `cli-v*` tags can complete the release pipeline

## [1.2.1] - 2026-03-25

### Changed
- `mutx update` now supports the installer-managed Homebrew and source-overlay install lane instead of only git checkouts
- CLI release tags now publish the Homebrew tap automatically by regenerating and pushing `mutx-dev/homebrew-tap`

### Fixed
- `mutx tui` no longer crashes when upstream session data contains duplicate session ids with different keys
- Homebrew packaging now tracks tagged CLI release archives instead of a drifting raw commit snapshot

## [1.2.0] - 2026-03-25

### Added
- **Faramesh Governance Engine** - Core auto-installed governance component for agent decision-making
- **Credential Broker** - Multi-backend secret management (Vault, AWS Secrets, GCP Secret Manager, Azure Key Vault, 1Password, Infisical)
- **Governance Webhooks** - Event streaming for decisions, approvals, and denials with FPL `notify` directive routing
- **Faramesh Supervision** - Production agent supervision via `faramesh run` with auto-restart and health checks
- **SPIFFE/SPIRE Identity** - Workload identity provider for secure agent authentication
- **Observability Dashboard** - Agent run tracking with MutxRun/MutxStep schema (agent-run standard)
- **AARM Security Layer** - Security evaluation, approvals, receipts, and sessions
- **Textual-based `mutx tui`** operator shell for agents and deployments
- **Shared CLI service layer** under `cli/services/*` for auth, agents, and deployments
- **Homebrew tap** scaffold with `Formula/mutx.rb` and non-network `mutx status` formula test guidance
- **`mutx update`** command to update MUTX from git without reinstallation
- **`mutx governance`** CLI with subcommands: status, decisions, pending, metrics, tail, start, approve, deny, kill, policy, credential, webhook, supervise
- **Dashboard navigation** for observability, analytics, sessions, and API keys

### Changed
- Root CLI distribution versioning now tracks the root `pyproject.toml` and `cli-vX.Y.Z` tags
- CLI docs, quickstart, and debugging notes now reflect the `/v1/*` API contract and the TUI install flow
- TUI now loads governance and observability data on mount
- Migrated to ESLint 9 flat config and Next.js 16.x
- Upgraded to Next.js 16.2.1 with Turbopack
- Fixed python-jose version constraint (3.5.0)

### Fixed
- Import errors: moved `InvalidCredentialsError` and `CLIServiceError` to `cli.errors`
- Removed unused variables flagged by ruff
- Fixed version constraints for langchain ecosystem (openai>=1.68.2, pydantic 2.x compatible)
- Fixed npm peer dependency conflicts with ESLint 10

### Security
- Fixed CodeQL security findings
- Fixed security vulnerabilities in Python and Node.js dependencies
- Added Cloudflare Turnstile to Book a Call buttons

## [1.1.0] - 2026-03-22

### Added
- MUTX-owned installer and setup wizard that keeps the first-run flow inside the MUTX shell instead of bouncing users through raw subprocess prompts
- OpenClaw provider runtime support across the installer, CLI, TUI, API snapshot sync, and dashboard setup surfaces
- Local runtime registry under `~/.mutx/providers/openclaw` for tracked manifests, bindings, wizard state, and pointer files to upstream OpenClaw assets
- Assistant-first runtime commands such as `mutx runtime list`, `mutx runtime inspect openclaw`, and `mutx runtime open openclaw --surface tui|configure`
- Managed localhost control-plane bootstrap under `~/.mutx/runtime/local-control` for the Docker-backed local lane
- Provider-aware onboarding and runtime snapshot APIs for surfacing honest last-seen local state in hosted control-plane views
- Demo validation coverage for the real Docker-backed stack boot path

### Changed
- Quickstart now centers a single primary install command: `curl -fsSL https://mutx.dev/install.sh | bash`
- Hosted and local setup both run through the same assistant-first bootstrap path, with OpenClaw install, import, onboarding, tracking, binding, deploy, and verification steps
- The TUI now prefers the control-plane workflow after setup and uses a smaller MUTX banner plus calmer first-run surfaces
- Landing page, quickstart copy, and dashboard setup screens now explain the OpenClaw flow as a MUTX-managed provider experience instead of a loose external prerequisite
- CLI release and packaging expectations now align around the root Python distribution, `cli-vX.Y.Z` tags, and a third-party Homebrew tap

### Fixed
- Local Docker demo boot no longer collides with stale fixed container names; the stack now uses project-scoped compose names
- Demo validation now applies Alembic migrations before API readiness checks and waits on `/ready` instead of a weaker health probe
- API migration boot now uses the correct sync PostgreSQL driver path for `psycopg`
- The `user_settings` migration now matches the real UUID user schema instead of creating an invalid foreign-key type mismatch in PostgreSQL
- Local development JWT defaults now satisfy runtime validation so the demo stack can boot without manual secret patching
- Installer, local bootstrap, and OpenClaw tracking flows now produce cleaner recovery behavior when existing local state is present

### Notes
- Current repository footprint: 1,352 commits, 741 tracked files, 25 FastAPI route modules, 86 CLI/TUI files, and 246 test files in this checkout.
- `v1.1` is meant to describe the real shipped operator surface in the repo today, not just the short delta from the previous `v1` release note.

## [1.0.0] - 2024-01-01

### Added
- Frontend application with Next.js 15
- API surface with FastAPI backend
- CLI tool for agent deployment and management
- SDK for programmatic access
- Desktop application (Electron)
- Mobile applications (iOS/Android with Capacitor)
- Docker and infrastructure deployment configs

### API Routes
- `/auth` - Authentication endpoints
- `/agents` - Agent management
- `/deployments` - Deployment management
- `/ingest/*` - Data ingestion endpoints
- `/webhooks/*` - Webhook destination management

### Fixed
- Initial stable release

## [0.1.0] - 2023-06-01

### Added
- Initial CLI alpha release
- Basic agent deployment capabilities
- Python SDK with core functionality

---

## Release Types

We use the following release types in our changelog:

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Features that have been removed
- **Fixed**: Bug fixes
- **Security**: Security-related changes

## Versioning

This project uses [Semantic Versioning](https://semver.org/). Given a version number `MAJOR.MINOR.PATCH`:

- **MAJOR** (X.0.0): Incompatible API changes, major refactoring
- **MINOR** (1.X.0): New backwards-compatible functionality
- **PATCH** (1.0.X): Backwards-compatible bug fixes

### Component Versions

| Component | Current Version | Location |
|-----------|-----------------|----------|
| Frontend/App | 1.0.0 | `package.json` |
| CLI distribution | 1.2.3 | root `pyproject.toml` |
| Python SDK | 0.1.0 | `sdk/pyproject.toml` |
| API | Matches frontend | `package.json` |

## How We Release

1. **Development**: Features are developed in feature branches
2. **Pull Request**: Changes are submitted via PR and reviewed
3. **Merge**: Merged changes land in `main`
4. **Version Bump**: Maintainers update version numbers in relevant files
5. **Release**: A GitHub Release is created with changelog notes
6. **Deployment**: CI/CD pipelines deploy to staging/production

See [docs/changelog-status.md](./docs/changelog-status.md) for status sources and live endpoints.
