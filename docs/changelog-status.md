# Changelog and Release Notes

This page covers where to track MUTX changes, release processes, and live status for demos and integrations.

## Status Sources

- API health: `GET https://api.mutx.dev/health`
- API readiness: `GET https://api.mutx.dev/ready`
- Website availability: `https://mutx.dev`
- App availability: `https://app.mutx.dev`
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
   - `package.json` (frontend/app version)
   - `pyproject.toml` (CLI/SDK version)

2. **Update CHANGELOG.md**:
   - Move items from `[Unreleased]` to the new version section
   - Add the release date
   - Use appropriate version type (Major/Minor/Patch)

3. **Create GitHub Release**:
   - Tag format: `v1.0.0` (frontend) or `cli-v0.1.0` (Python CLI)
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
# Build and publish to PyPI
python -m build
twine upload dist/*
```

## Versioning

This project uses [Semantic Versioning](https://semver.org/):

| Component | Version Location |
|-----------|------------------|
| Frontend/App | `package.json` |
| CLI/SDK (Python) | `pyproject.toml` |

See [CHANGELOG.md](../CHANGELOG.md#versioning) for details on versioning scheme.

## Contract Notes (Current)

- FastAPI routes are unversioned (`/auth`, `/agents`, `/deployments`, etc.); no global `/v1` prefix.
- Ingestion routes are mounted at `/ingest/*`.
- Webhook destination management is mounted at `/webhooks/*`.
- Deployment event history is available at `GET /deployments/{deployment_id}/events`.

## Related Planning Docs

- [Project Status](./project-status.md)
- [Roadmap](../ROADMAP.md)
- [API Reference](./api/reference.md)
- [Contributing](../CONTRIBUTING.md)
