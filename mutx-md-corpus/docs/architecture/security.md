---
description: Security posture, zero-trust model, BYOK direction, and audit controls.
icon: shield-halved
---

# Security

> Note: parts of this document describe the intended security posture, not only the currently wired implementation. For example, current Terraform and Ansible still expose some ports and do not yet match every target-state claim below.

This document describes the security architecture of mutx.dev, including zero-trust principles, BYOK model, EvalView guardrails, and network isolation.

***

## Security Philosophy

mutx.dev operates on a **zero-trust** security model with the following principles:

1. **Never trust, always verify** — Every request is authenticated and authorized
2. **Assume breach** — Design for lateral movement prevention
3. **Least privilege** — Minimum necessary access at all layers
4. **Explicit verification** — Validate at every step
5. **Automate security** — Machine-speed detection and response

***

## Zero-Trust Model

### Zero-Trust Network Architecture (ZTNA)

Traditional perimeter security is insufficient. mutx.dev implementsZTNA using Tailscale:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         Zero-Trust Network Access (ZTNA)                         │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                            PUBLIC INTERNET                                 │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                             │
│                      ┌─────────────┴─────────────┐                               │
│                      │   Target: Tailscale-first │                               │
│                      │   access posture          │                               │
│                      └─────────────┬─────────────┘                               │
│                                    │                                             │
│                                    │ WireGuard Tunnel                            │
│                                    ▼                                             │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                          TAILSCALE MESH                                    │  │
│  │                                                                           │  │
│  │   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐        │  │
│  │   │   Client    │◀──────▶│   Control   │◀──────▶│   Tenant   │        │  │
│  │   │  (User)     │         │   Plane     │         │   VPC      │        │  │
│  │   │             │         │             │         │             │        │  │
│  │   │  - Auth     │         │  - API      │         │  - Agents  │        │  │
│  │   │  - mTLS     │         │  - Policy   │         │  - Databases│        │  │
│  │   └─────────────┘         └─────────────┘         └─────────────┘        │  │
│  │                                                                           │  │
│  │   Key: WireGuard encryption, mTLS, short-lived certificates              │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Tailscale Implementation

From `infrastructure/ansible/playbooks/provision.yml:116`:

```yaml
- name: Install and configure Tailscale
  block:
    - name: Install Tailscale
      ansible.apt:
        name: tailscale
        state: present

    - name: Start Tailscale
      command: tailscale up --auth-key {{ tailscale_auth_key }} --operator root

    - name: Enable Tailscale service
      systemd:
        name: tailscaled
        enabled: yes
        state: started
```

### ZTNA Features

| Feature                    | Implementation               | Benefit                     |
| -------------------------- | ---------------------------- | --------------------------- |
| **WireGuard Encryption**   | All traffic encrypted        | Data in transit protection  |
| **mTLS**                   | Service-to-service auth      | Identity verification       |
| **Port minimization goal** | Tailscale-first access model | Reduced attack surface      |
| **Short-lived Certs**      | Automatic rotation           | Credential theft prevention |
| **Network Isolation**      | Per-tenant VPCs              | Lateral movement prevention |

***

## Bring Your Own Key (BYOK)

### BYOK Architecture

mutx.dev implements a true BYOK model where customers retain control of their AI API keys:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        BYOK Architecture                                         │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                           TENANT VPC                                      │  │
│  │                                                                           │  │
│  │   ┌─────────────────────────────────────────────────────────────────┐    │  │
│  │   │                    HashiCorp Vault                               │    │  │
│  │   │                                                                  │    │  │
│  │   │   ┌─────────────────────────────────────────────────────────┐   │    │  │
│  │   │   │                  Secrets Engine                          │   │    │  │
│  │   │   │                                                           │   │    │  │
│  │   │   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │   │    │  │
│  │   │   │   │ OPENAI_KEY  │  │ANTHROPIC_KEY│  │ OTHER_KEYS │      │   │    │  │
│  │   │   │   │ (Encrypted) │  │ (Encrypted) │  │(Encrypted) │      │   │    │  │
│  │   │   │   └─────────────┘  └─────────────┘  └─────────────┘      │   │    │  │
│  │   │   │                                                           │   │    │  │
│  │   │   │   Policy: Tenant-only access                              │   │    │  │
│  │   │   │   Audit: All access logged                               │   │    │  │
│  │   │   └─────────────────────────────────────────────────────────┘   │    │  │
│  │   └─────────────────────────────────────────────────────────────────┘    │  │
│  │                                    │                                         │  │
│  │                           ┌────────┴────────┐                               │  │
│  │                           │                 │                               │  │
│  │                           ▼                 ▼                               │  │
│  │   ┌──────────────────────────────────────────────────────────────┐       │  │
│  │   │                     Agent Pod                                 │       │  │
│  │   │   ┌────────────────────────────────────────────────────────┐  │       │  │
│  │   │   │  Vault Agent Sidecar                                   │  │       │  │
│  │   │   │  - Token renewal                                       │  │       │  │
│  │   │   │  - Secret injection                                    │  │       │  │
│  │   │   │  - mTLS                                                │  │       │  │
│  │   │   └────────────────────────────────────────────────────────┘  │       │  │
│  │   │                                                            │       │  │
│  │   │   ┌────────────────────────────────────────────────────────┐  │       │  │
│  │   │   │  LangChain Agent                                       │  │       │  │
│  │   │   │  - Vault token via env                                │  │       │  │
│  │   │   │  - Calls LLM provider directly                        │  │       │  │
│  │   │   │  - Key never logged or exposed                        │  │       │  │
│  │   │   └────────────────────────────────────────────────────────┘  │       │  │
│  │   └──────────────────────────────────────────────────────────────┘       │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### BYOK Benefits

| Benefit                | Description                          |
| ---------------------- | ------------------------------------ |
| **Zero Markup**        | Pay only provider rates, no markup   |
| **Key Control**        | Keys stored in tenant's Vault        |
| **Audit Trail**        | All API calls logged                 |
| **Provider Diversity** | Use any LLM provider                 |
| **Compliance**         | Keys never touch mutx infrastructure |

### Vault Configuration

Keys are stored in HashiCorp Vault with:

* **Encryption**: AES-256 at rest
* **Access Control**: Tenant-specific policies
* **Audit Logging**: All secret access recorded
* **Token TTL**: Short-lived tokens (15 min)
* **No Root Access**: Mutx cannot access tenant keys

***

## EvalView Guardrails

EvalView is mutx.dev's hypervisor-level security layer that acts as a local LLM judge to validate all inputs and outputs.

### Guardrail Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        EvalView Guardrails                                      │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                      INPUT → EVALVIEW → OUTPUT                           │  │
│  │                                                                           │  │
│  │   ┌───────────┐      ┌───────────────────┐      ┌───────────┐             │  │
│  │   │  Client   │─────▶│    EvalView       │─────▶│   Agent   │             │  │
│  │   │  Request  │      │    Guardrail      │      │  Process  │             │  │
│  │   └───────────┘      └─────────┬─────────┘      └───────────┘             │  │
│  │                               │                                          │  │
│  │                               ▼                                          │  │
│  │                    ┌───────────────────────┐                            │  │
│  │                    │   Local LLM Judge     │                            │  │
│  │                    │                       │                            │  │
│  │                    │  ┌─────────────────┐  │                            │  │
│  │                    │  │ Input Validator │  │                            │  │
│  │                    │  │                 │  │                            │  │
│  │                    │  │ - Prompt        │  │                            │  │
│  │                    │  │   Injection     │  │                            │  │
│  │                    │  │ - PII Detection│  │                            │  │
│  │                    │  │ - Toxic Content│  │                            │  │
│  │                    │  └─────────────────┘  │                            │  │
│  │                    │                       │                            │  │
│  │                    │  ┌─────────────────┐  │                            │  │
│  │                    │  │ Output Filter  │  │                            │  │
│  │                    │  │                 │  │                            │  │
│  │                    │  │ - Sanitization │  │                            │  │
│  │                    │  │ - PII Redaction│  │                            │  │
│  │                    │  │ - Safe Content │  │                            │  │
│  │                    │  └─────────────────┘  │                            │  │
│  │                    │                       │                            │  │
│  │                    │  ┌─────────────────┐  │                            │  │
│  │                    │  │ Anomaly Detector│  │                            │  │
│  │                    │  │                 │  │                            │  │
│  │                    │  │ - Behavioral   │  │                            │  │
│  │                    │  │   Patterns     │  │                            │  │
│  │                    │  │ - Rate Limits  │  │                            │  │
│  │                    │  │ - Intent Drift │  │                            │  │
│  │                    │  └─────────────────┘  │                            │  │
│  │                    └───────────────────────┘                            │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Security Layers

#### 1. Input Validation

| Check                | Method                 | Action                    |
| -------------------- | ---------------------- | ------------------------- |
| **Prompt Injection** | Pattern matching + LLM | Reject malicious payloads |
| **PII Detection**    | NER + Regex            | Mask sensitive data       |
| **Toxic Content**    | Classifier             | Block harmful requests    |
| **Length Limits**    | Token count            | Truncate or reject        |
| **Encoding**         | Sanitization           | Strip dangerous chars     |

#### 2. Output Filtering

| Check                    | Method          | Action                   |
| ------------------------ | --------------- | ------------------------ |
| **PII Redaction**        | Regex patterns  | Replace with \[REDACTED] |
| **Safe Content**         | Classifier      | Filter harmful outputs   |
| **Injection Prevention** | Output encoding | Escape special chars     |
| **Token Limits**         | Token count     | Truncate responses       |

#### 3. Anomaly Detection

| Check                | Behavior                | Action          |
| -------------------- | ----------------------- | --------------- |
| **Request Velocity** | > 100 req/min per agent | Rate limit      |
| **Output Length**    | > 10x normal            | Flag for review |
| **Error Rate**       | > 50% errors            | Pause agent     |
| **Behavioral Drift** | Intent mismatch         | Alert + log     |

### Guardrail Response

```python
# EvalView response structure
{
    "allowed": true,
    "checks": [
        {
            "name": "prompt_injection",
            "passed": true,
            "confidence": 0.95
        },
        {
            "name": "pii_detection",
            "passed": true,
            "findings": []
        },
        {
            "name": "toxic_content",
            "passed": true,
            "confidence": 0.99
        }
    ],
    "latency_ms": 150,
    "model": "local-guard-v1"
}
```

If any check fails:

```python
{
    "allowed": false,
    "reason": "prompt_injection_detected",
    "details": "Potential jailbreak attempt detected",
    "confidence": 0.87,
    "action": "block"
}
```

***

## Network Isolation

### Isolation Layers

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         Network Isolation Layers                                │
│                                                                                  │
│  LAYER 1: VPC ISOLATION                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                                 │
│  │  Tenant A  │ │  Tenant B  │ │  Tenant C  │  ← Separate VPCs               │
│  │  10.0.1.0  │ │  10.0.2.0  │ │  10.0.3.0  │                                 │
│  └─────────────┘ └─────────────┘ └─────────────┘                                 │
│           │             │             │                                          │
│           ▼             ▼             ▼                                          │
│  LAYER 2: SECURITY GROUPS                                                       │
│  ┌─────────────────────────────────────────┐                                   │
│  │  sg-agent   │  sg-database  │  sg-mgmt  │  ← Security Group Rules          │
│  │  (Agents)   │  (DBs)        │  (Mgmt)   │                                   │
│  └─────────────────────────────────────────┘                                   │
│           │             │             │                                          │
│           ▼             ▼             ▼                                          │
│  LAYER 3: SUBNET ACCESS                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  10.0.1.0/24 (App)  →  10.0.1.128/25 (Data)                             │   │
│  │  Only agent subnet can access data subnet                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│           │             │             │                                          │
│           ▼             ▼             ▼                                          │
│  LAYER 4: FIREWALL (UFW)                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Allow: 22 (SSH)    │  5432 (PG)  │  6379 (Redis)  │  8080 (API)        │   │
│  │  Deny: All else                                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Firewall Configuration

From `infrastructure/ansible/playbooks/provision.yml:145`:

```yaml
- name: Configure UFW firewall
  ufw:
    state: enabled
    policy: deny

- name: Add UFW rules
  ufw:
    rule: "{{ item.rule }}"
    port: "{{ item.port }}"
    comment: "{{ item.comment }}"
  loop:
    - { rule: allow, port: "22", comment: "SSH" }
    - { rule: allow, port: "5432", comment: "PostgreSQL" }
    - { rule: allow, port: "6379", comment: "Redis" }
    - { rule: allow, port: "8080", comment: "Agent API" }
```

### SSH Hardening

```yaml
- name: SSH hardening - Disable password authentication
  lineinfile:
    path: /etc/ssh/sshd_config
    regexp: "^PasswordAuthentication"
    line: "PasswordAuthentication no"

- name: SSH hardening - Disable root login
  lineinfile:
    path: /etc/ssh/sshd_config
    regexp: "^PermitRootLogin"
    line: "PermitRootLogin no"

- name: SSH hardening - Use only SSHv2
  lineinfile:
    path: /etc/ssh/sshd_config
    regexp: "^Protocol"
    line: "Protocol 2"
```

### Intrusion Prevention

fail2ban is configured to protect against brute force:

```yaml
- name: Configure fail2ban
  template:
    src: fail2ban.j2
    dest: /etc/fail2ban/jail.local
  vars:
    fail2ban_bantime: 3600      # 1 hour ban
    fail2ban_findtime: 600       # Within 10 minutes
    fail2ban_maxretry: 3         # After 3 attempts
```

***

## Authentication & Authorization

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Authentication Flow                                       │
│                                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                   │
│  │    User      │────▶│   Dashboard   │────▶│  mutx API    │                   │
│  │  (Browser)   │     │  (Next.js)    │     │  (FastAPI)   │                   │
│  └──────────────┘     └──────────────┘     └──────┬───────┘                   │
│                                                      │                           │
│                                                      ▼                           │
│                                            ┌─────────────────┐                   │
│                                            │  Auth Service  │                   │
│                                            │                 │                   │
│                                            │  JWT + bcrypt  │                   │
│                                            │  OAuth2 ready  │                   │
│                                            └────────┬────────┘                   │
│                                                     │                            │
│                                                     ▼                            │
│                                            ┌─────────────────┐                   │
│                                            │  PostgreSQL    │                   │
│                                            │  (Users/Tokens)│                   │
│                                            └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Token Management

| Token Type        | Lifetime     | Storage           |
| ----------------- | ------------ | ----------------- |
| **Access Token**  | 15 min       | JWT (stateless)   |
| **Refresh Token** | 7 days       | HttpOnly cookie   |
| **API Key**       | User-defined | Vault (encrypted) |

### Authorization Model

* **Role-Based Access Control (RBAC)**
* **API Key scopes**: `read`, `write`, `admin`
* **Resource-level permissions**: Tenant → Agent → Tool

***

## Compliance & Audit

### Audit Logging

All security-relevant events are logged:

| Event                 | Logged To       | Retention |
| --------------------- | --------------- | --------- |
| Login attempts        | Auditd + Vault  | 1 year    |
| API key access        | Vault audit     | 1 year    |
| Agent creation        | PostgreSQL      | 90 days   |
| Agent execution       | PostgreSQL      | 90 days   |
| Configuration changes | Terraform state | 7 years   |
| Network access        | Tailscale logs  | 30 days   |

### Security Monitoring

* **Real-time alerts**: Critical events trigger PagerDuty
* **SIEM integration**: Exportable logs (JSON)
* **Compliance reports**: SOC2-ready evidence

***

## Summary

| Layer        | Technology           | Protection            |
| ------------ | -------------------- | --------------------- |
| **Network**  | VPC, Tailscale ZTNA  | Isolation, encryption |
| **Firewall** | UFW, security groups | Port filtering        |
| **Auth**     | JWT, OAuth2          | Identity verification |
| **Secrets**  | HashiCorp Vault      | Key protection        |
| **Runtime**  | EvalView Guardrails  | I/O validation        |
| **Monitor**  | fail2ban, auditd     | Intrusion detection   |

***

## Related Documentation

* [Architecture Overview](overview.md)
* [Infrastructure](infrastructure.md)
* [Agent Runtime](agent-runtime.md)
