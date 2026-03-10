<p align="center">
  <img src="public/logo-new.png" alt="mutx.dev logo" width="128" />
</p>

<h1 align="center">mutx.dev Platform</h1>

<p align="center">
  <strong>Cinematic infrastructure for AI agents that have to survive contact with reality.</strong>
</p>

---

## 🚀 Welcome to mutx-dev

This repository contains the complete **mutx.dev** platform—the control plane, operator surfaces, developer tools, and infrastructure definitions required to deploy and operate stateful AI agents at scale.

## 🏛️ Monorepo Structure

| Surface | Description | Directory |
| :--- | :--- | :--- |
| **Control Plane** | FastAPI backend for auth, agent lifecycle, deployment, and metrics. | `src/api/` |
| **Operator UI** | Next.js frontend (marketing & agent-facing console). | `app/` |
| **CLI** | Python-based terminal interface for agent lifecycles. | `cli/` |
| **SDK** | Python client for programmatic agent management. | `sdk/` |
| **Infrastructure** | Terraform, Ansible, and Docker configuration. | `infrastructure/` |

## 🛠️ Developer Quickstart

### Platform Backend
```bash
# Setup environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start infra
docker-compose up -d postgres redis

# Run API
uvicorn src.api.main:app --reload --port 8000
```

### Frontend
```bash
# Install and develop
npm install
npm run dev
```

## 📖 Deep Documentation

For detailed technical guides, architecture deep-dives, and troubleshooting, please refer to the [Internal Documentation Hub](./docs/README.md).

### Key References
- **[Architecture Overview](./docs/architecture/overview.md)**: How the surfaces connect.
- **[CLI Guide](./docs/cli.md)**: Terminal-first workflow.
- **[Agent Deployment](./docs/api/agents.md)**: Lifecycle management.
- **[Infrastructure](./docs/deployment/docker.md)**: Deployment and provisioning.

## ⚖️ License

MIT. See [LICENSE](./LICENSE).
