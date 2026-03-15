
<p align="center">
  <img src="https://github.com/fortunexbt/mutx-dev/blob/main/public/logo.png" width="140" alt="MUTX logo"/>
</p>

<h1 align="center">MUTX</h1>

<p align="center">
  <strong>The control plane for AI agents.</strong>
</p>

<p align="center">
  Deploy, operate, and govern agents like production systems.
</p>

---

# MUTX

MUTX is an **open-source control plane for AI agents**.

Most agent frameworks focus on prompts, reasoning loops, or local orchestration.  
MUTX focuses on the **operational layer** required to run agents as production systems.

This includes:

- agent deployment
- lifecycle management
- orchestration and scheduling
- observability and debugging
- governance and policy controls
- CLI, API, and SDK interfaces

The goal is simple: treat agents the same way modern teams treat backend services.

---

# The Problem

Most AI agents today are deployed like scripts.

That works for demos, but breaks quickly in real systems.

Once agents interact with APIs, credentials, background jobs, or external services, teams need infrastructure that answers questions like:

- What agents are running?
- Where are they deployed?
- What permissions do they have?
- What changed between runs?
- Why did something fail?
- How do we monitor and debug it?

MUTX exists to provide that layer.

---

# The Idea

Modern software has clear operational primitives.

Web applications   → Vercel  
Containers         → Kubernetes  
AI agents          → MUTX  

MUTX is building the infrastructure layer for deploying and operating agents safely at scale.

---

# Project Structure

mutx-dev/
├── control-plane/       # FastAPI backend services  
├── cli/                 # MUTX operator CLI  
├── sdk/                 # Python SDK  
├── agents/              # agent templates and roles  
├── infrastructure/      # Docker, Terraform, deployment configs  
├── docs/                # documentation source  
└── scripts/             # bootstrap and developer tooling  

---

# Quickstart

Clone the repository:

```bash
git clone https://github.com/fortunexbt/mutx-dev
cd mutx-dev
```

Start the local development stack:

```bash
./scripts/dev.sh
```
---

# Documentation

Full documentation:

https://docs.mutx.dev

Key entry points:

- Quickstart: https://docs.mutx.dev/docs/deployment/quickstart
- Architecture: https://docs.mutx.dev/docs/architecture/overview
- API Reference: https://docs.mutx.dev/docs/contracts/api
- CLI Guide: https://docs.mutx.dev/docs/cli

---

# Contributing

Contributions are welcome.

Start here:

https://docs.mutx.dev/contributing

---

# License

MIT License

https://github.com/fortunexbt/mutx-dev/blob/main/LICENSE
