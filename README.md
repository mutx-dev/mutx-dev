<p align="center">
  <img src="public/logo-new.png" alt="MUTX logo" width="160" />
</p>

<h1 align="center">MUTX: The Industrial Control Plane for AI Agents</h1>

<p align="center">
  <strong>Stop prototyping chatbots. Start deploying autonomous, stateful operators.</strong>
</p>

<p align="center">
  <a href="https://github.com/fortunexbt/mutx-dev"><strong>Explore the Repo</strong></a> ·
  <a href="https://mutx.dev"><strong>Live Preview</strong></a> ·
  <a href="https://docs.mutx.dev"><strong>Read Docs</strong></a>
</p>

---

## 🚀 The Thesis
Most agent frameworks are just wrappers around LLM API calls. **MUTX is the backbone.**

We are building the **industrial-grade operating system** for enterprise AI agents. If you believe agents will handle the world's backend processes, MUTX is the infrastructure they rely on. We don't just host your prompts—we provide the control plane, orchestration, and monitoring stack required to move agents from local scripts to high-stakes, 24/7 autonomous operations.

> **"If this looks like your kind of infrastructure, there is real work waiting. MUTX is the control plane people will actually build on."**

---

## 🏛️ The Infrastructure Gap

| Capability | The SaaS Wrapper Trap | MUTX Industrial Infrastructure |
| :--- | :--- | :--- |
| **Architecture** | Multi-tenant, shared cluster | **Single-tenant, bare-metal VPC** |
| **Persistence** | Ephemeral, timeout-capped | **24/7 autonomous runtime** |
| **Observability** | Console logs | **Unified metrics/tracing/alerts** |
| **Economics** | Predatory token-markup | **BYOK / Zero Margin** |

---

## 🏗️ Architecture At A Glance

```mermaid
graph LR
    subgraph "Control Plane"
        API[FastAPI Control Plane]
        DB[(Postgres + Redis)]
        API --> DB
    end
    subgraph "Developer Experience"
        CLI[Python CLI]
        SDK[Python SDK]
    end
    subgraph "Operator Surface"
        Web[Next.js Dashboard]
    end
    subgraph "Infrastructure"
        Infra[Docker + Terraform + Ansible]
    end

    CLI --> API
    SDK --> API
    Web --> API
    API --> Infra
```

---

## 🛠️ Developer-First Ergonomics

### The Operator Terminal
```bash
# Provision a hardened VPC for your agent swarm
$ mutx deploy --config ./agents/production.json --region us-east-1

# Monitor observability across global clusters
$ mutx status --agent-id 8829-44-202
```

### The SDK Interface
```python
from mutx import MutxClient

# Connect to your dedicated control plane
client = MutxClient(api_key="mutx_live_xxx")

# Spin up a specialized, persistent operator
agent = client.agents.create(
    name="Financial-Reconciliation-Bot",
    config='{"model": "gpt-4o-mini", "temp": 0.1}',
)

# Trigger a mission-critical task asynchronously
task = agent.run_task(
    instruction="Reconcile daily ledger against Stripe and Bank APIs",
    priority="high"
)
print(f"Autonomous agent operating: {task.id}")
```

---

## 🗺️ Roadmap & Maturity

| Phase | Focus | Status |
| :--- | :--- | :--- |
| **NOW** | Auth/Ownership, CLI/SDK Alignment, Dashboard UX | 🔥 In Progress |
| **NEXT** | Typed Agent Config, Lifecycle History, Webhook Surface | 🏗️ Planning |
| **LATER** | Traces API, Vector/RAG, Quota Enforcement | 🔭 Backlog |

---

## 🤝 Contributor Lanes
MUTX is at the stage where strong contributors can leave a visible mark on the product.

- **`area:web`**: Build a real, authenticated dashboard.
- **`area:api`**: Harden ownership and schema coverage.
- **`area:cli/sdk`**: Perfect the operator ergonomics.
- **`area:infra`**: Hardening deployment loops and monitoring.

---

## 🏁 Quickstart

```bash
# 1. Install dependencies
npm install
pip install -r requirements.txt

# 2. Start infra & services
docker-compose up -d postgres redis
uvicorn src.api.main:app --reload --port 8000
npm run dev
```

---

*MUTX: Building the backbone of the agentic economy.*
