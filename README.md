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

# What is MUTX

MUTX is an **industrial control plane for AI agents**.

It lets you deploy, operate, observe, and govern autonomous agents as production systems.

Think:

```
Vercel → for web apps
Kubernetes → for containers
MUTX → for AI agents
```

Capabilities include:

• agent lifecycle management  
• orchestration and scheduling  
• observability and debugging  
• policy and governance  
• CLI + API + SDK access  

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

Run the platform locally:

```bash
make up
```

Create your first agent:

```bash
mutx agent create
```

### Demo Validation

Verify the demo path works locally:

```bash
npm run demo:validate
```

This validates:
- Homepage loads (`/`)
- App shell loads (`/app`)
- Static pages load (`/contact`, `/privacy-policy`)

Success output confirms the demo path is ready for presentation.

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
