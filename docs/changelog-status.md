# Changelog and Release Notes

This page covers where to track MUTX changes, release processes, and live status for demos and integrations.

## Status Sources

- API health: `GET https://api.mutx.dev/health`
- API readiness: `GET https://api.mutx.dev/ready`
- Website availability: `https://mutx.dev`
- App availability: `https://app.mutx.dev/dashboard`
- Control demo availability: `https://app.mutx.dev/control`
- Docs availability: `https://docs.mutx.dev`

## Changelog

The canonical changelog lives at [CHANGELOG.md](../CHANGELOG.md) in the repository root.

### Changelog Sources

- GitHub releases: `https://github.com/fortunexbt/mutx-dev/releases`
- Merged pull requests: `https://github.com/fortunexbt/mutx-dev/pulls?q=is%3Apr+is%3Amerged`
- OpenAPI contract diff: compare revisions of [`docs/api/openapi.json`](./api/openapi.json)

## Release Process

### Version Bumping

When preparing a release:

1. **Update version numbers** in:
   - `package.json` (frontend/app version, if needed)
   - root `pyproject.toml` (CLI distribution version)
   - `sdk/pyproject.toml` (SDK version, only when shipping the SDK)

2. **Update CHANGELOG.md**:
   - Move items from `[Unreleased]` to the new version section
   - Add the release date
   - Use appropriate version type (Major/Minor/Patch)

3. **Create GitHub Release**:
   - Tag format: `v1.0.0` (frontend/app) or `cli-v0.2.0` (CLI distribution)
   - Include changelog notes for that release

### Release Validation

Run the release check script before publishing:

```bash
# Without Playwright (faster)
npm run release:check

# With Playwright (full validation)
npm run release:check -- --with-playwright
```

Or manually:

```bash
# Lint
npm run lint

# Build
npm run build

# API tests
make test-api
```

### Python CLI Release

```bash
# Build the CLI distribution from repo root
python -m pip install build
python -m build
```

Then update the Homebrew tap formula to the matching `cli-vX.Y.Z` archive and validate the assistant-first CLI surface without touching the network:

```bash
brew tap mutx-dev/homebrew-tap
brew install mutx
mutx --help
mutx setup --help
mutx doctor --help
```

## Versioning

This project uses [Semantic Versioning](https://semver.org/):

| Component | Version Location |
|-----------|------------------|
| Frontend/App | `package.json` |
| CLI distribution | root `pyproject.toml` |
| Python SDK | `sdk/pyproject.toml` |

See [CHANGELOG.md](../CHANGELOG.md#versioning) for details on versioning scheme.

## Contract Notes (Current)

- FastAPI routes are mounted under `/v1/*` in [`src/api/main.py`](../src/api/main.py).
- Ingestion routes are mounted at `/v1/ingest/*`.
- Webhook destination management is mounted at `/v1/webhooks/*`.
- Deployment event history is available at `GET /v1/deployments/{deployment_id}/events`.

## Docs publication notes

- GitHub is the canonical source for synced docs content.
- GitBook publication is rooted at the repo root through `.gitbook.yaml`.
- `README.md` and `SUMMARY.md` are repo-owned docs entrypoints and should not be recreated from the GitBook UI.

## Related Planning Docs

- [Project Status](./project-status.md)
- [Roadmap](../roadmap.md)
- [API Reference](./api/reference.md)
- [Contributing](../CONTRIBUTING.md)
- [CLI Reference](./cli.md)
- [CLI Release Runbook](./deployment/cli-release.md)
