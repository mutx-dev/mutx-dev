# Architecture Overview

> Note: this document mixes current implementation details with target architecture. For the most code-accurate view of local routes and workflows, prefer `README.md`, `docs/README.md`, and `src/api/routes/`.

**mutx.dev** is "The Vercel for production AI agents" — a platform that deploys autonomous agents to dedicated VPCs with zero-trust security and zero token markup.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENTS                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │   Web Dashboard │    │   Mobile App    │    │   API Clients (SDK/CLI)     │ │
│  │    (Next.js)    │    │   (React)       │    │                             │ │
│  └────────┬────────┘    └────────┬────────┘    └──────────────┬──────────────┘ │
└───────────┼──────────────────────┼──────────────────────────────┼───────────────┘
            │                      │                              │
            │  HTTPS/WSS          │  HTTPS                       │  HTTPS
            │                      │                              │
            ▼                      ▼                              ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              EDGE LAYER                                           │
│  ┌──────────────────────────────────────────────────────────────────────────────┐ │
│  │  Vercel CDN + Railway Load Balancer                                         │ │
│  │  - TLS termination                                                         │ │
│  │  - Rate limiting                                                            │ │
│  │  - DDoS protection                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              CONTROL PLANE (mutx API)                            │
│  ┌──────────────────────────────────────────────────────────────────────────────┐ │
│  │  FastAPI Backend (Python)                                                   │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐│ │
│  │  │  Auth      │  │  Agents    │  │ Deployments│  │   Webhooks           ││ │
│  │  │  Service   │  │  Service   │  │  Service   │  │   Handler            ││ │
│  │  └────────────┘  └────────────┘  └────────────┘  └──────────────────────┘│ │
│  │                                                                              │ │
│  │  ┌────────────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Core Services                                      │  │ │
│  │  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐ │  │ │
│  │  │  │ Agent Runtime  │  │  Self-Healing  │  │    Monitoring          │ │  │ │
│  │  │  │   Service      │  │    Service     │  │      Service           │ │  │ │
│  │  │  └────────────────┘  └────────────────┘  └────────────────────────┘ │  │ │
│  │  └────────────────────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
│            │                                                                        │
│  ┌─────────┴─────────┐                                                           │
│  │   PostgreSQL      │   Redis Cache                                              │
│  │   (Metadata)      │   (Sessions, Queue)                                       │
│  └───────────────────┘   └─────────────────┘                                      │
└───────────────────────────────────────────────────────────────────────────────────┘
            │
            │ Terraform Provisioning
            ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                         TENANT VPCs (Per-Customer)                                │
│  ┌──────────────────────────────────────────────────────────────────────────────┐ │
│  │  10.0.1.0/24 - Agent Subnet                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Dedicated Agent 10 Cluster                         │  │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │ │
│  │  │  │  Agent 01   │  │  Agent 02   │  │  Agent 03   │  │  Agent N    │   │  │ │
│  │  │  │ (LangChain)│  │ (OpenClaw)  │  │    (n8n)    │  │             │   │  │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │  │ │
│  │  │         │                │                │                │           │  │ │
│  │  │         └────────────────┴────────────────┴────────────────┘           │  │ │
│  │  │                           │                                            │  │ │
│  │  │                    ┌──────┴──────┐                                     │  │ │
│  │  │                    │ EvalView    │ ─── Local LLM Judge               │  │ │
│  │  │                    │  Guardrail  │    (Hypervisor-level security)    │  │ │
│  │  │                    └─────────────┘                                     │  │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                              │ │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────────┐ │ │
│  │  │   PostgreSQL      │  │   Redis           │  │   Tailscale            │ │ │
│  │  │   (pgvector)     │  │   Cache           │  │   ZTNA Mesh            │ │ │
│  │  └────────────────────┘  └────────────────────┘  └────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Control Plane (mutx API)

| Component | Technology | Purpose |
|-----------|------------|---------|
| **API Gateway** | FastAPI | REST/WS endpoints, auth, rate limiting |
| **Agent Runtime** | Python/AsyncIO | Agent lifecycle, execution, tool routing |
| **Self-Healing Service** | Python | Auto-recovery, health checks, version management |
| **Monitoring Service** | Python | Metrics, alerting, uptime tracking |
| **Auth Service** | JWT + bcrypt | Token management, OAuth2 |

### 2. Agent Runtime

The `AgentRuntime` class (`src/api/services/agent_runtime.py:98`) manages:

- **Agent Creation**: Factory pattern for LangChain, OpenClaw, n8n agents
- **Execution**: Async/sync execution with timeout control
- **Tool Routing**: Dynamic tool registration and execution
- **State Management**: Runtime state, execution context, metrics

### 3. Agent Types

| Type | Framework | Use Case |
|------|-----------|----------|
| **LangChain Agent** | LangChain + LangGraph | General-purpose LLM agents |
| **OpenClaw Agent** | OpenClaw | Multi-agent orchestration |
| **n8n Agent** | n8n | Workflow automation |

### 4. Data Layer

- **PostgreSQL**: Metadata, agent configs, pgvector for semantic search
- **Redis**: Caching, session storage, message queue
- **Vector Store**: pgvector embeddings for RAG

---

## Data Flow

### Agent Execution Flow

```
┌──────────┐     ┌──────────┐     ┌───────────────┐     ┌─────────────────┐
│  Client  │────▶│   API    │────▶│ Agent Runtime │────▶│   Tool Handler │
│ Request  │     │  Gateway │     │  (AsyncIO)    │     │  (Tools/RAG)   │
└──────────┘     └──────────┘     └───────┬───────┘     └────────┬────────┘
                                          │                      │
                                          ▼                      ▼
                                   ┌───────────────┐     ┌─────────────────┐
                                   │ EvalView      │◀────│  LLM Provider   │
                                   │ Guardrail     │     │ (OpenAI/Anthropic/
                                   │ (Local Judge) │     │  Ollama)        │
                                   └───────────────┘     └─────────────────┘
                                          │
                                          ▼
                                   ┌───────────────┐
                                   │ Response to   │
                                   │ Client        │
                                   └───────────────┘
```

### Deployment Flow

```
┌──────────┐     ┌──────────────┐     ┌───────────────┐     ┌─────────────────┐
│  User    │────▶│  API Request │────▶│ Terraform     │────▶│  Ansible        │
│ Deploy   │     │  (Create VPC)│     │  Provisioner  │     │  (Configure)   │
└──────────┘     └──────────────┘     └───────┬───────┘     └─────────────────┘
                                               │                    │
                                               ▼                    ▼
                                        ┌──────────────┐   ┌─────────────────┐
                                        │  VPC Created │   │ Agent Deployed  │
                                        │  (DigitalOC) │   │ (Docker + ZTNA) │
                                        └──────────────┘   └─────────────────┘
```

---

## Security Model

### Zero-Trust Architecture

1. **ZTNA Mesh**: Tailscale-based zero-trust networking
   - No exposed ports to public internet
   - WireGuard encrypted tunnels
   - mTLS for service-to-service auth

2. **EvalView Guardrails**: Hypervisor-level security
   - Local LLM judge evaluates all inputs/outputs
   - Prompt injection detection
   - Output sanitization
   - Behavioral anomaly detection

3. **BYOK (Bring Your Own Keys)**
   - Customer provides their own API keys
   - Zero token markup
   - Keys never stored in plaintext (HashiCorp Vault)

4. **Network Isolation**
   - Single-tenant VPCs
   - Firewall rules (UFW)
   - Security groups per subnet
   - No cross-tenant communication

### Security Layers

| Layer | Technology | Protection |
|-------|------------|------------|
| **Network** | Tailscale, UFW, VPC | Port isolation, encrypted tunnels |
| **Application** | JWT, OAuth2 | Authentication, authorization |
| **Data** | Vault, encryption at rest | Secret management, key protection |
| **Runtime** | EvalView, containers | Input/output validation, sandboxing |
| **Monitoring** | Auditd, fail2ban | Intrusion detection, logging |

---

## Infrastructure Provisioning

### Terraform + Ansible Pipeline

1. **Terraform**: Creates VPC, networking, compute
2. **Ansible**: Configures OS, Docker, services

```
┌─────────────────┐
│  Terraform      │
│  ┌───────────┐  │
│  │ VPC       │  │
│  │ Subnets   │  │
│  │ Security  │  │
│  │ Groups    │  │
│  └───────────┘  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Ansible        │
│  ┌───────────┐  │
│  │ Docker    │  │
│  │ PostgreSQL│  │
│  │ Redis    │  │
│  │ Tailscale│  │
│  │ UFW      │  │
│  └───────────┘  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent 10       │
│  Swarm Ready    │
└─────────────────┘
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** | FastAPI, Python, SQLAlchemy, AsyncIO |
| **Database** | PostgreSQL 15, Redis, pgvector |
| **Agents** | LangChain, OpenClaw, n8n, LangGraph |
| **IaC** | Terraform, Ansible |
| **Cloud** | DigitalOcean |
| **Networking** | Tailscale ZTNA |
| **Security** | HashiCorp Vault, UFW, fail2ban |
| **Deploy** | Railway, Vercel |

---

## Next Steps

- [Infrastructure Details](./infrastructure.md)
- [Agent Runtime](./agent-runtime.md)
- [Security](./security.md)
