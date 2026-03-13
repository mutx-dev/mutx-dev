# Changelog and Status

This page centralizes where to track MUTX changes and live status for demos and integrations.

## Status Sources

- API health: `GET https://api.mutx.dev/health`
- API readiness: `GET https://api.mutx.dev/ready`
- Website availability: `https://mutx.dev`
- App availability: `https://app.mutx.dev`
- Docs availability: `https://docs.mutx.dev`

## Changelog Sources

- GitHub releases: `https://github.com/fortunexbt/mutx-dev/releases`
- Merged pull requests: `https://github.com/fortunexbt/mutx-dev/pulls?q=is%3Apr+is%3Amerged`
- OpenAPI contract diff: compare revisions of [`docs/api/openapi.json`](./api/openapi.json)

## Contract Notes (Current)

- FastAPI routes are unversioned (`/auth`, `/agents`, `/deployments`, etc.); no global `/v1` prefix.
- Ingestion routes are mounted at `/ingest/*`.
- Webhook destination management is mounted at `/webhooks/*`.
- Deployment event history is available at `GET /deployments/{deployment_id}/events`.

## Related Planning Docs

- [Project Status](./project-status.md)
- [Roadmap](../ROADMAP.md)
- [API Reference](./api/reference.md)
