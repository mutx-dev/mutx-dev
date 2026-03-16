# Contributing

Thanks for helping improve `mutx.dev`.

## Before You Start

- Read `README.md`, `docs/README.md`, `ROADMAP.md`, and `docs/project-status.md`.
- Trust the code over older docs when they disagree.
- Keep changes scoped. This repo spans web, API, CLI, SDK, Docker, Terraform, and Ansible.

## Local Setup

Use the canonical quickstart in `docs/deployment/quickstart.md`.

### Quick Start (Makefile)

For rapid local development, use the Makefile targets:

```bash
make help              # Show available targets
make dev               # Start local dev stack (Docker Compose)
make test-auth         # Register test user, login, get token (one-command)
make test-api          # Run API health tests
make test              # Run full test suite
make lint              # Run linters
```

This starts the FastAPI backend on http://localhost:8000 with API docs at http://localhost:8000/docs.

## What To Work On

The best starting points live in:

- `ROADMAP.md`
- `docs/project-status.md`
- open issues created from those docs

Good contribution shapes:

- API contract fixes
- CLI and SDK alignment
- dashboard/product surface improvements
- docs drift cleanup
- backend tests and CI improvements

## Pull Requests

- Prefer small PRs by area.
- Link an issue when there is one.
- Explain what changed and why.
- Include the validation commands you ran.
- Update the closest docs when behavior changes.
- Do not bundle unrelated cleanup with the main change.

### Updating the Changelog

When your change affects users, update [CHANGELOG.md](CHANGELOG.md):

1. Add your change under the `[Unreleased]` section
2. Use the appropriate type:
   - **Added**: New features
   - **Changed**: Changes to existing functionality
   - **Fixed**: Bug fixes
   - **Security**: Security-related changes
3. Be descriptive but concise

Example:
```markdown
### Added
- New `/agents/list` endpoint for bulk agent retrieval
```

## Validation

Use the smallest relevant validation set for your change.

### Frontend

```bash
npm run lint
npm run build
```

### Python API, CLI, and SDK

```bash
ruff check src/api cli sdk
black --check src/api cli sdk
python3 -m compileall src/api cli sdk/mutx
```

### Playwright

```bash
npx playwright test --list
```

Important: current Playwright specs target `https://mutx.dev`, not localhost.

## Release Process

For maintainers releasing new versions:

1. **Update versions** in:
   - `package.json` (frontend/app)
   - `pyproject.toml` (CLI/SDK)

2. **Update CHANGELOG.md**:
   - Move `[Unreleased]` items to a new version section
   - Add release date
   - Create GitHub Release with the notes

3. **Run validation**:
   ```bash
   npm run release:check
   ```

4. **Tag and publish**:
   - Frontend: `git tag v1.0.0 && git push origin v1.0.0`
   - CLI: `git tag cli-v0.1.0 && git push origin cli-v0.1.0`

See [docs/changelog-status.md](docs/changelog-status.md) for full release documentation.

## Source Of Truth

When behavior is unclear, inspect:

- `src/api/routes/`
- `cli/commands/`
- `sdk/mutx/`
- `docker-compose.yml`
- `docker-compose.production.yml`

## Questions And Support

See `SUPPORT.md`.
