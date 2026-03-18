<p align="center">
  <img src="https://github.com/fortunexbt/mutx-dev/blob/main/public/logo.png" />
</p>

<p align="center">
  <strong>The control plane for deploying, operating, and governing AI agents.</strong>
</p>

<p align="center">
  Deploy agents like you deploy services.
</p>

<p align="center">
  <a href="https://docs.mutx.dev"><img src="https://img.shields.io/badge/docs-open-black?style=for-the-badge"></a>
  <a href="https://github.com/fortunexbt/mutx-dev"><img src="https://img.shields.io/github/stars/fortunexbt/mutx-dev?style=for-the-badge"></a>
  <a href="https://github.com/fortunexbt/mutx-dev/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-black?style=for-the-badge"></a>
</p>

---

## What is MUTX

MUTX is the **production control plane for AI agents** — deploy, operate, and govern agents like the infrastructure they are.

Think: Vercel → web apps. Kubernetes → containers. MUTX → agents.

Capabilities include:
• Agent lifecycle management
• Deployment with versioning and rollback  
• Budget enforcement and cost controls
• SDK + CLI + API access
• Observability and run traces
• Governance and policy controls

## OpenClaw Integration

MUTX supports two operator entry paths:

- **New OpenClaw deployment** — MUTX spins up and manages OpenClaw-backed agent runtimes with full lifecycle control
- **Link existing workspace** — attach a running OpenClaw workspace and govern it through MUTX's control plane

## Why MUTX vs a dashboard?

Mission Control, LangSmith, and similar tools observe agent sessions — they answer "what are my agents doing right now?"

MUTX controls how agents run: deployment model, access boundaries, budget constraints, and operational contracts. Not a session dashboard — a control plane.

This is the difference between watching your infrastructure and operating it.

---

# Documentation

The full documentation lives at:

→ **https://docs.mutx.dev**

<p align="center">
  <a href="https://docs.mutx.dev">
    <img src="https://docs.mutx.dev/~gitbook/image?url=https%3A%2F%2F2092776695-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FlrUGCvqeS10g6J0hLJNu%252Fuploads%252F0JprPBsUyScuvYUAtdUu%252Fmutx_docs_og_editorial.png%3Falt%3Dmedia%26token%3Dc56634e1-e5d6-4afa-9dbd-d94c8cf71ef7&width=1248&dpr=2&quality=100&sign=cade74dc&sv=2"/>
  </a>
</p>

Start here:

- **Quickstart**  
  https://docs.mutx.dev/docs/deployment/quickstart

- **Architecture overview**  
  https://docs.mutx.dev/docs/architecture/overview

- **API reference**  
  https://docs.mutx.dev/docs/contracts/api

- **CLI guide**  
  https://docs.mutx.dev/docs/cli

---

# Quickstart

Clone the repository:

```bash
git clone https://github.com/fortunexbt/mutx-dev
cd mutx-dev
```

### Canonical Local Bootstrap

Start the local MUTX stack from repo root with:

```bash
./scripts/dev.sh
```

This is the canonical local entrypoint and uses `infrastructure/docker/docker-compose.yml` explicitly.

### Optional Demo Validation

If you want a one-command demo sanity check, run:

```bash
npm run demo:validate
```

This validates:
- API health (`/health`) and readiness (`/ready`),
- Homepage loads (`/`),
- App shell loads (`/app`),
- Static pages load (`/contact`, `/privacy-policy`).

More details in the docs:

https://docs.mutx.dev/docs/deployment/quickstart

---

# Project structure

```
mutx/
 ├── control-plane        # FastAPI control plane
 ├── cli                  # MUTX operator CLI
 ├── sdk                  # Python SDK
 ├── agents               # agent templates and roles
 ├── infrastructure       # deployment and infra
 └── docs                 # GitBook source
```

---

# Architecture

MUTX consists of four main layers:

**Control Plane**  
FastAPI services coordinating agent lifecycle.

**Execution Layer**  
Agent runtimes and worker nodes.

**Interface Layer**  
CLI, SDK, and API access.

**Observability Layer**  
Logs, metrics, and debugging tools.

Full architecture:

https://docs.mutx.dev/docs/architecture/overview

---

# Roadmap

Near-term priorities:

- production agent lifecycle
- scheduling and orchestration
- policy and governance
- observability tooling
- SDK expansion

See:

https://docs.mutx.dev/roadmap

---

# Contributing

Contributions are welcome.

Start here:

- Contributing guide  
  https://docs.mutx.dev/contributing

- Code of conduct  
  https://github.com/fortunexbt/mutx-dev/blob/main/CODE_OF_CONDUCT.md

---

# Security

Security policy:

https://github.com/fortunexbt/mutx-dev/blob/main/SECURITY.md

---

# License

MIT License.

See:

https://github.com/fortunexbt/mutx-dev/blob/main/LICENSE

---

<p align="center">
  <strong>MUTX</strong><br>
  Autonomous infrastructure for the agentic era.
</p>
