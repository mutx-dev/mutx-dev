# API Reference

This directory is the public API reference for MUTX.

It should always match the mounted FastAPI application, not older GitBook prose.

## Source Of Truth Order

When docs and implementation disagree, use this order:

1. `src/api/main.py` plus `src/api/routes/*.py`
2. `docs/api/openapi.json`
3. Prose docs in `docs/api/*.md`

## Refresh Generated Artifacts

Regenerate the OpenAPI snapshot from the live FastAPI app:

```bash
python scripts/generate_openapi.py
```

Regenerate the TypeScript types that power the app surface:

```bash
npm run generate-types
```

Quick route inventory check:

```bash
jq -r '.paths | keys[]' docs/api/openapi.json | sort
```

## Hosted Surfaces

- Marketing site: `https://mutx.dev`
- Docs site: `https://docs.mutx.dev`
- Operator app: `https://app.mutx.dev`
- Direct API base: `https://api.mutx.dev`

## Reference Artifacts

- API overview: [index.md](./index.md)
- OpenAPI JSON: [`openapi.json`](./openapi.json)
- Authentication: [authentication.md](./authentication.md)
- API keys: [api-keys.md](./api-keys.md)
- Agents: [agents.md](./agents.md)
- Deployments: [deployments.md](./deployments.md)
- Webhooks and ingestion: [webhooks.md](./webhooks.md)
- Leads: [leads.md](./leads.md)

## Publication Rules

- GitHub is the canonical source for `README.md`, `SUMMARY.md`, and `docs/api/*`.
- GitBook should import from GitHub first when sync is reconnected.
- Do not create replacement README pages from the GitBook UI.
