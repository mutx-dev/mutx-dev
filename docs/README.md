---
description: Best entry point for setup, platform references, and operator docs.
icon: book
---

# MUTX Docs

Use this section when you want the code-accurate view of setup, runtime surfaces, and current gaps.

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
      <td><strong>Setup and local flow</strong></td>
      <td>Get from clone to a working stack with the shortest validated path.</td>
      <td><a href="deployment/quickstart.md">quickstart.md</a></td>
      <td><a href="../public/landing/victory-core.png">victory-core.png</a></td>
    </tr>
    <tr>
      <td><strong>API and integration reference</strong></td>
      <td>Read the live `/v1/*` contract, auth model, and public resource docs.</td>
      <td><a href="api/">api</a></td>
      <td><a href="../public/landing/wiring-bay.png">wiring-bay.png</a></td>
    </tr>
    <tr>
      <td><strong>Platform architecture</strong></td>
      <td>Understand the shape behind the app, backend, CLI, SDK, and infrastructure.</td>
      <td><a href="architecture/">architecture</a></td>
      <td><a href="../public/landing/running-agent.png">running-agent.png</a></td>
    </tr>
    <tr>
      <td><strong>v1.3 release notes</strong></td>
      <td>Read the current public release posture, supported surfaces, and download path.</td>
      <td><a href="releases/v1.3.md">v1.3.md</a></td>
      <td><a href="../public/landing/docs-surface.png">docs-surface.png</a></td>
    </tr>
    <tr>
      <td><strong>Troubleshooting and support</strong></td>
      <td>Recover quickly when local setup, auth, or route assumptions drift.</td>
      <td><a href="troubleshooting/">troubleshooting</a></td>
      <td><a href="../public/landing/docs-surface.png">docs-surface.png</a></td>
    </tr>
  </tbody>
</table>

- `mutx.dev` = public marketing site and product narrative
- `mutx.dev/releases` = public release summary and signed desktop artifact handoff
- `docs.mutx.dev` = canonical documentation and API truth surface
- `app.mutx.dev/dashboard` = operator-facing dashboard surface
- `app.mutx.dev/control/*` = operator demo surface

## Start Here

- [Overview](https://github.com/mutx-dev/mutx-dev/blob/main/README.md)
- [Quickstart](./deployment/quickstart.md)
- [v1.4 Release Notes](./releases/v1.4.md)
- [v1.5 Release Checklist](./releases/v1.5-checklist.md)
- [Project Status](./project-status.md)
- [Roadmap](https://github.com/mutx-dev/mutx-dev/blob/main/roadmap.md)

## By Area

### Setup And Workflow

- [CLI Guide](./cli.md)
- [Deployment](./deployment/README.md)
- [Local Developer Bootstrap](./deployment/local-developer-bootstrap.md)

### Platform References

- [API Reference](./api/reference.md)
- [API Overview](./api/index.md)
- [Architecture](./architecture/README.md)
- [Autonomy](./autonomy/README.md)
- [MUTX Infrastructure](https://github.com/mutx-dev/mutx-dev/blob/main/infrastructure.md)
- [Python SDK](https://github.com/mutx-dev/mutx-dev/blob/main/sdk.md)

### Troubleshooting

- [Troubleshooting](./troubleshooting/README.md)
- [Common Issues](./troubleshooting/common-issues.md)
- [Debugging](./troubleshooting/debugging.md)
- [FAQ](./troubleshooting/faq.md)

### Supporting Context

- [Platform Overview](./overview.md)
- [Surface Matrix](./surfaces.md)
- [App and Dashboard](./app-dashboard.md)
- [v1.3 Release Checklist](./releases/v1.3-checklist.md)
- [Manifesto](https://github.com/mutx-dev/mutx-dev/blob/main/manifesto.md)
- [Technical Whitepaper](https://github.com/mutx-dev/mutx-dev/blob/main/whitepaper.md)

## Truth rules

When docs and code disagree, trust the code:

- `src/api/routes/` for backend behavior
- `app/api/` for browser-facing proxy behavior
- `app/` for site and app surfaces
- `cli/` for terminal workflows
- `sdk/mutx/` for SDK behavior

Current hosted/documented split:

- `mutx.dev` is the public landing site
- `mutx.dev/releases` is the public release summary for the current desktop build
- `docs.mutx.dev` should explain the product and link to the current truth
- `app.mutx.dev/dashboard` is the current operator shell
- `app.mutx.dev/control/*` is the demo shell
- `app/api/` contains the browser-facing same-origin proxies and dashboard fetch layer

## GitBook sync rules

The published docs site is synced from this repository.

- GitHub is the canonical source for synced docs content.
- `.gitbook.yaml` pins GitBook to the repo root and uses `README.md` plus `SUMMARY.md`.
- Do not create or rename README pages from the GitBook UI.
- Keep sidebar changes in `SUMMARY.md`, not in ad hoc GitBook-only content.

If a doc drifts, update the doc or remove the claim.
