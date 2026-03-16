# API Reference

This page is the docs-facing API reference entrypoint for MUTX.

## Source of Truth Order

When docs and implementation disagree, use this order:

1. `src/api/routes/*.py`
2. `docs/api/openapi.json` (generated snapshot)
3. Prose docs in `docs/api/*.md`

## Generate Fresh OpenAPI

```bash
/Users/fortune/MUTX/.venv/bin/python scripts/generate_openapi.py
```

Quick route inventory check:

```bash
jq -r '.paths | keys[]' docs/api/openapi.json | sort
```

## Reference Artifacts

- OpenAPI JSON: [`openapi.json`](./openapi.json)
- API overview: [index.md](./index.md)
- Auth and tokens: [authentication.md](./authentication.md)
- API keys: [api-keys.md](./api-keys.md)
- Agents: [agents.md](./agents.md)
- Deployments: [deployments.md](./deployments.md)
- Webhooks and ingestion: [webhooks.md](./webhooks.md)
- Leads: [leads.md](./leads.md)
- Usage: [usage.md](./usage.md)

## Hosted Surfaces

- Marketing site: `https://mutx.dev`
- Docs site: `https://docs.mutx.dev`
- Operator app: `https://app.mutx.dev`
- Direct API base for integrations: `https://api.mutx.dev`
