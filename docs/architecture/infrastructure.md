# Infrastructure

This document describes the infrastructure design for mutx.dev, including VPC architecture, bare-metal provisioning, network topology, and security zones.

---

## VPC Design

### Overview

mutx.dev uses a **multi-tenant VPC architecture** where each customer receives a dedicated Virtual Private Cloud. This ensures complete isolation and eliminates "noisy neighbor" problems.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         mutx.dev Control Plane                                   │
│                         (Railway + Vercel)                                       │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                        mutx API (FastAPI)                                 │  │
│  │   - Agent management                                                      │  │
│  │   - Deployment orchestration                                              │  │
│  │   - Tenant provisioning                                                  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                           │
│                                      │ API Calls                                 │
│                                      ▼                                           │
│                         ┌──────────────────────────┐                              │
│                         │  Terraform Cloud/Local  │                              │
│                         │  Provisioning Engine    │                              │
│                         └────────────┬────────────┘                              │
└──────────────────────────────────────┼───────────────────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
         ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
         │   Tenant VPC A   │ │   Tenant VPC B   │ │   Tenant VPC C   │
         │   (Customer 1)   │ │   (Customer 2)   │ │   (Customer 3)   │
         │   10.0.1.0/24    │ │   10.0.2.0/24    │ │   10.0.3.0/24   │
         └──────────────────┘ └──────────────────┘ └──────────────────┘
```

### VPC Specification

Each tenant VPC is provisioned on DigitalOcean with the following configuration:

| Parameter | Value |
|-----------|-------|
| **Region** | Customer-selected (NYC, SFO, AMS, etc.) |
| **VPC CIDR** | /24 (256 addresses) |
| **Subnets** | 1x /24 (agent tier) |
| **Internet Gateway** | Egress only (no inbound) |
| **DHCP** | Managed (10.0.x.0/24 range) |

---

## Bare-Metal Provisioning

### Provisioning Pipeline

The provisioning pipeline follows a two-stage approach:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   User Request  │ ───▶ │    Terraform    │ ───▶ │    Ansible      │
│  (API/CLI)      │      │   (IaC)         │      │   (Config)      │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                         │                        │
        │                         │                        │
        ▼                         ▼                        ▼
   ┌─────────┐            ┌─────────────┐          ┌─────────────┐
   │ Create  │            │  VPC +      │          │  Docker +   │
   │ Tenant  │            │  Compute    │          │  Services   │
   └─────────┘            └─────────────┘          └─────────────┘
```

### Terraform Configuration

The Terraform provisioning (`infrastructure/ansible/playbooks/provision.yml`) creates:

1. **Droplet** (Compute)
   - Size: Customer-selected (starting 4GB RAM)
   - Image: Ubuntu 22.04 LTS
   - VPC: Tenant VPC

2. **Networking**
   - Private networking enabled
   - Floating IP (optional, for management)

3. **Storage**
   - Volume for data (optional)
   - Snapshots enabled

### Ansible Configuration

After Terraform provisions the compute, Ansible configures:

| Role | Purpose |
|------|---------|
| **docker** | Install Docker, configure daemon |
| **postgresql** | PostgreSQL 15 with pgvector |
| **redis** | Redis with password auth |
| **tailscale** | Zero-trust VPN mesh |
| **ufw** | Firewall rules |
| **fail2ban** | Intrusion prevention |
| **agent** | Deploy agent containers |

### Inventory Structure

```ini
# infrastructure/ansible/inventory.ini
[agents]
agent-01 ansible_host=10.0.1.10 ansible_user=ubuntu
agent-02 ansible_host=10.0.1.11 ansible_user=ubuntu
agent-03 ansible_host=10.0.1.12 ansible_user=ubuntu

[monitoring]
monitor-01 ansible_host=10.0.2.10 ansible_user=ubuntu

[all:vars]
ansible_python_interpreter=/usr/bin/python3
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
```

---

## Network Topology

### Network Diagram

```
                              ┌─────────────────────────────────────┐
                              │         Public Internet             │
                              └─────────────────────────────────────┘
                                           │
                                           │ HTTPS/WSS
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EDGE (Vercel/Railway)                               │
│                         ┌──────────────────────────┐                             │
│                         │  TLS Termination         │                             │
│                         │  DDoS Protection         │                             │
│                         │  CDN (Static Assets)     │                             │
│                         └──────────────────────────┘                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           │ Private Network
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CONTROL PLANE (Railway)                                  │
│                         ┌──────────────────────────┐                             │
│                         │  mutx API (FastAPI)      │                             │
│                         │  PostgreSQL (Metadata)   │                             │
│                         │  Redis (Queue/Cache)     │                             │
│                         └──────────────────────────┘                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           │ Tailscale ZTNA
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TENANT VPC (10.0.1.0/24)                               │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                         Agent Subnet (10.0.1.0/24)                       │  │
│   │                                                                           │  │
│   │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │  │
│   │   │   Agent 01   │    │   Agent 02   │    │   Agent 03   │              │  │
│   │   │   10.0.1.10  │    │   10.0.1.11  │    │   10.0.1.12  │              │  │
│   │   │  ┌────────┐  │    │  ┌────────┐  │    │  ┌────────┐  │              │  │
│   │   │  │Docker  │  │    │  │Docker  │  │    │  │Docker  │  │              │  │
│   │   │  │Agent 10│  │    │  │n8n     │  │    │  │LangChn │  │              │  │
│   │   │  └────────┘  │    │  └────────┘  │    │  └────────┘  │              │  │
│   │   └──────────────┘    └──────────────┘    └──────────────┘              │  │
│   │                                                                           │  │
│   │   ┌────────────────────────────────────────────────────────────────┐     │  │
│   │   │  EvalView Guard (10.0.1.5) - Local LLM Judge                 │     │  │
│   │   │  ┌─────────────────────────────────────────────────────────┐ │     │  │
│   │   │  │  Input Validation  │  Output Sanitization  │ Anomaly    │ │     │  │
│   │   │  │                    │                      │ Detection  │ │     │  │
│   │   │  └─────────────────────────────────────────────────────────┘ │     │  │
│   │   └────────────────────────────────────────────────────────────────┘     │  │
│   │                                                                           │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                     Data Services Subnet (10.0.1.128/25)                │  │
│   │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │  │
│   │   │ PostgreSQL   │    │    Redis     │    │  Vector DB   │              │  │
│   │   │   10.0.1.130 │    │   10.0.1.131 │    │   10.0.1.132 │              │  │
│   │   │  (pgvector)  │    │   (Cache)    │    │  (Embeddings)│              │  │
│   │   └──────────────┘    └──────────────┘    └──────────────┘              │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                     Management Subnet (10.0.2.0/24)                     │  │
│   │   ┌──────────────┐    ┌──────────────┐                                  │  │
│   │   │  Monitoring  │    │  Tailscale   │                                  │  │
│   │   │   10.0.2.10  │    │   Gateway   │                                  │  │
│   │   └──────────────┘    └──────────────┘                                  │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### IP Address Allocation

| Range | Purpose | Hosts |
|-------|---------|-------|
| 10.0.1.0/27 | Reserved | - |
| 10.0.1.32/27 | Agent pool | 30 agents |
| 10.0.1.64/27 | EvalView | 1 guardrail VM |
| 10.0.1.128/27 | Data services | PostgreSQL, Redis, Vector DB |
| 10.0.1.192/26 | Reserved | Future use |
| 10.0.2.0/24 | Management | Monitoring, Tailscale node |

---

## Security Zones

### Zone Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY ZONES                                     │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                           ZONE 0: UNTRUSTED                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Public Internet                                                    │  │  │
│  │  │  - No direct access to tenant resources                            │  │  │
│  │  │  - All traffic through edge + Tailscale                            │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                         │
│                                        ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                           ZONE 1: SEMI-TRUSTED                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Control Plane (Railway)                                           │  │  │
│  │  │  - mutx API                                                        │  │  │
│  │  │  - Tenant management                                               │  │  │
│  │  │  - Terraform orchestration                                         │  │  │
│  │  │  Auth: JWT, API keys                                               │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                         │
│                              Tailscale ZTNA                                     │
│                                        ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                           ZONE 2: TRUSTED                                 │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Tenant VPC (Isolated)                                             │  │  │
│  │  │                                                                     │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │  │  │
│  │  │  │  DMZ Layer  │  │  App Layer  │  │ Data Layer │                 │  │  │
│  │  │  │  (EvalView) │  │  (Agents)   │  │  (DBs)     │                 │  │  │
│  │  │  │             │  │             │  │             │                 │  │  │
│  │  │  │  - Input    │  │  - Agent 10 │  │  - PostgreSQL│                │  │  │
│  │  │  │    filter   │  │  - n8n      │  │  - Redis   │                 │  │  │
│  │  │  │  - Output   │  │  - LangChain│  │  - Vector  │                 │  │  │
│  │  │  │    sanitize│  │             │  │    Store   │                 │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘                 │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Firewall Rules (UFW)

From `infrastructure/ansible/playbooks/provision.yml`:

```yaml
ufw_rules:
  - rule: allow
    port: "22"
    comment: "SSH (restricted via key)"
  - rule: allow
    port: "5432"
    comment: "PostgreSQL (local only)"
  - rule: allow
    port: "6379"
    comment: "Redis (local only)"
  - rule: allow
    port: "8080"
    comment: "Agent API (Tailscale only)"
```

### Network Segmentation

| Component | Zone | Access | Notes |
|-----------|------|--------|-------|
| **EvalView Guard** | DMZ | Agents → Guard → Out | Input/output validation |
| **Agent Containers** | App | Guard → Agent | Tool execution |
| **PostgreSQL** | Data | Agent → DB | Via Unix socket |
| **Redis** | Data | Agent → Redis | Password protected |
| **Tailscale** | Mgmt | All | WireGuard mesh |

---

## Service Communication

### Internal Communication

All inter-service communication within a tenant VPC uses:

1. **Private Networking**: 10.0.x.x addresses
2. **Service Mesh**: Tailscale for encryption
3. **Authentication**: Service-specific tokens

### External Communication

| Direction | Method | Security |
|-----------|--------|----------|
| **Agent → LLM Provider** | HTTPS | API key in Vault |
| **Agent → Vector DB** | Unix socket | Local only |
| **Tenant → Agent** | Tailscale | WireGuard + Auth |
| **Control → Tenant** | Tailscale | mTLS via Tailscale |

---

## Next Steps

- [Agent Runtime](./agent-runtime.md)
- [Security](./security.md)
