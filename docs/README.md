# MUTX Docs

This is the contributor-facing documentation hub for MUTX.

Use this directory when you want the code-accurate view of how the platform is structured, how to run it, and where the current gaps are.

## Start Here

- [Manifesto](../MANIFESTO.md) - product thesis, principles, and why MUTX exists
- [Technical Whitepaper](../WHITEPAPER.md) - deeper technical framing and architecture narrative
- [Top-level README](../README.md) - project overview and entry points
- [Project Status](./project-status.md) - what is real, what is rough, and where contributors can help next
- [Roadmap](../ROADMAP.md) - priority sequencing for the next layer of work

## Quick Links

### Core Platform
- [Architecture Overview](./architecture/overview.md) - system layout and target direction
- [API Overview](./api/index.md) - route groups, auth shape, and request conventions
- [CLI Guide](./cli.md) - terminal workflows and command behavior
- [Deployment Quickstart](./deployment/quickstart.md) - local bootstrap and hosted setup

### Infrastructure And Ops
- [Infrastructure Overview](./architecture/infrastructure.md) - provisioning and hosting model
- [Docker Deployment](./deployment/docker.md) - containerized workflows
- [Railway Deployment](./deployment/railway.md) - hosted deployment notes
- [Security Architecture](./architecture/security.md) - boundaries, auth, and ops posture

### Troubleshooting
- [Common Issues](./troubleshooting/common-issues.md)
- [Debugging Guide](./troubleshooting/debugging.md)
- [FAQ](./troubleshooting/faq.md)

## Reality Check

The most important rule in this repo is simple:

- trust `src/api/routes/` for API behavior
- trust `cli/` for CLI behavior
- trust `sdk/mutx/` for SDK behavior
- trust `app/` and `app/api/` for website and app-surface behavior

If a doc and the code disagree, the code wins and the doc should be updated.
