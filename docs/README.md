---
description: Best entry point for setup, platform references, and operator docs.
icon: book
---

# MUTX Docs

This is the code-accurate documentation hub for MUTX.

Use this directory to understand what exists now, how to get started, and how the three public surfaces relate:

<table data-view="cards"><thead><tr><th>Title</th><th data-card-target data-type="content-ref">Target</th></tr></thead><tbody><tr><td>Fastest local setup</td><td><a href="deployment/quickstart.md">quickstart.md</a></td></tr><tr><td>Full local developer bootstrap</td><td><a href="deployment/local-developer-bootstrap.md">local-developer-bootstrap.md</a></td></tr><tr><td>API and integration reference</td><td><a href="contracts/api/">api</a></td></tr><tr><td>Platform architecture</td><td><a href="architecture/">architecture</a></td></tr><tr><td>Troubleshooting and support</td><td><a href="troubleshooting/">troubleshooting</a></td></tr></tbody></table>

- `mutx.dev` = public marketing site and product narrative
- `docs.mutx.dev` = canonical documentation and API truth surface
- `app.mutx.dev` = operator-facing app shell and browser proxy surface

## Start Here

### Product surfaces
- [Platform Overview](./overview.md) - what MUTX is and how the public surfaces split
- [Quickstart](./quickstart.md) - local bootstrap for API and web
- [Local Developer Bootstrap](./deployment/local-developer-bootstrap.md) - full clone-to-validation local setup
- [App and Dashboard](./app-dashboard.md) - what the current app surface does today
- [API Overview](./api/index.md) - live route groups and auth model
- [Project Status](./project-status.md) - what is real, rough, and next

### Core API docs
- [Authentication](./api/authentication.md)
- [API Keys](./api/api-keys.md)
- [Agents](./api/agents.md)
- [Deployments](./api/deployments.md)
- [Webhooks and Ingestion](./api/webhooks.md)
- [OpenAPI spec](./api/openapi.json)

### Architecture and operations
- [Architecture Overview](./architecture/overview.md)
- [Agent Runtime](./architecture/agent-runtime.md)
- [Infrastructure Overview](./architecture/infrastructure.md)
- [Security Architecture](./architecture/security.md)
- [CLI Guide](./cli.md)
- [Deployment Quickstart](./deployment/quickstart.md)
- [Local Developer Bootstrap](./deployment/local-developer-bootstrap.md)

### Supporting context
- [Changelog and Status](./project-status.md)
- [Troubleshooting FAQ](./troubleshooting/faq.md)
- [Roadmap](../ROADMAP.md)
- [Top-level README](../README.md)
- [Manifesto](../MANIFESTO.md)
- [Technical Whitepaper](../WHITEPAPER.md)

## Truth rules

When docs and code disagree, trust the code:

- `src/api/routes/` for backend behavior
- `app/api/` for browser-facing proxy behavior
- `app/` for site and app surfaces
- `cli/` for terminal workflows
- `sdk/mutx/` for SDK behavior

Current hosted/documented split:

- `mutx.dev` is the public landing site
- `docs.mutx.dev` should explain the product and link to the current truth
- `app.mutx.dev` is the operator-facing preview shell backed by Next.js route handlers under `app/api/`

If a doc drifts, update the doc or remove the claim.
