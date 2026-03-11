# mutx.dev: Production Infrastructure for Agentic AI

**Deploy, run, observe, and govern AI agents like you deploy services.**

Agentic AI is easy to prototype but notoriously hard to operate at scale. We are building the "missing layer" for agentic workflows, providing the operational rigor required to take agentic projects from demo to production.

## Why mutx.dev?

Agentic AI introduces unique failure modes—from cost runaways and prompt injection to tool abuse and integration fragility. We solve this by providing:

*   **Isolation as Default:** Dedicated environments (VPC/firewall) for your agents.
*   **Operational Primitives:** Robust retries, idempotency, budgeting, and rate limiting.
*   **Policy-as-Code:** Enforceable access control and tool usage policies at the platform boundary.
*   **Observable Governance:** Full audit logs and correlated traces from model to tool.
*   **Protocol Openness:** First-class support for the Model Context Protocol (MCP).

## Key Capabilities

| Capability | Focus |
| :--- | :--- |
| **Control Plane** | Multi-tenant SaaS for registry, deployment, and governance. |
| **Data Plane** | Per-customer environment for isolated agent runtimes and data. |
| **Observability** | Correlated logs, traces, and metrics across model and tool calls. |
| **Security** | Zero-trust architecture, egress proxies, and secrets management. |

## Documentation & Resources

*   **[Read the Manifesto](MANIFESTO.md)** - Our core philosophy and mission.
*   **[Architecture Overview](docs/architecture/overview.md)** - How we solve production agent challenges.
*   **[Quickstart](docs/deployment/quickstart.md)** - Get up and running in minutes.
*   **[Technical Whitepaper](docs/Technical\ Whitepaper\ Blueprint\ for\ mutx.dev.pdf)** - Deep dive into our architectural decisions.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/fortunexbt/mutx.dev.git
cd mutx.dev

# Setup environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev]"
npm install
cp .env.example .env

# Run locally
./dev.sh
```

---

*Built for production-grade agentic AI. Designed for operational trust.*
