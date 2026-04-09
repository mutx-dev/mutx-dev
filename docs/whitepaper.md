---
description: Technical architecture and design reference for the MUTX control plane.
icon: file-lines
---

# MUTX Technical Whitepaper

> Reflects v1.4. 201 commits, 437 Python files, 306 TypeScript modules, 130 test files, 19,815-line OpenAPI specification.

## Abstract

MUTX is a source-available control plane for deploying, operating, and governing AI agents in production.

The gap between agent demos and agent systems is not a reasoning problem. It is a control-plane problem. Teams prototype agents in an afternoon and spend months wrestling with identity, deployment lifecycle, session management, observability, access control, secret brokering, policy enforcement, and operator ergonomics. These are infrastructure problems, and they require infrastructure answers.

This paper describes the MUTX implementation: what it is, how it is structured, what tradeoffs it makes, and what is running in production today.

---

## 1. The Problem

Agent software fails in production for predictable reasons:

| Failure mode | What breaks | Why it matters |
| --- | --- | --- |
| Identity drift | No clear ownership of agents and deployments | Cannot safely manage shared environments |
| Deployment ambiguity | "Run this agent" has no durable system record | Lifecycle, restart, rollback become informal |
| Secret sprawl | API keys and tokens in ad hoc env vars | Security posture degrades immediately |
| Weak observability | Logs exist but not as part of an operator workflow | Debugging is expensive and reactive |
| No governance | Agents act without policy boundaries | Compliance failures, budget overruns, trust erosion |
| Surface drift | Website, API, CLI, SDK, docs disagree | Platform trust erodes |

The result: many teams have an agent demo. Very few have an agent system.

MUTX exists to close the gap between demo and system.

---

## 2. Design Principles

**Control plane first.** Model the system around the agent, not just the agent itself. The plane is the product.

**Honest contracts.** The API, CLI, SDK, docs, and web surfaces describe the same product. When they disagree, the code is canonical.

**Governance by default.** Every agent action is loggable, policied, and auditable. Not bolted on — built into the security layer.

**Operator usability.** Support the people running the system, not only the people coding against it. That means a TUI, a dashboard, and a CLI that all expose the same operations.

**Open interfaces.** Source-available under BUSL-1.1 with Apache-2.0 conversion. Interoperable, inspectable, contributor-friendly.

**Incremental hardening.** Improve by tightening guarantees, not by adding disconnected surface area.

---

## 3. System Architecture

```
+----------------------------------------------------------+
|                       SURFACES                           |
|   Landing Site  |  Dashboard  |  CLI + TUI  |  SDK       |
+----------------------------------------------------------+
|                    GOVERNANCE LAYER                       |
|   Faramesh (FPL)  |  RBAC + OIDC  |  Audit Trail         |
+----------------------------------------------------------+
|                   CONTROL PLANE API                       |
|   FastAPI /v1/*  |  Postgres  |  Redis  |  OpenTelemetry |
+----------------------------------------------------------+
|                   RUNTIME LAYER                           |
|   LangChain  |  CrewAI  |  AutoGen  |  Custom            |
+----------------------------------------------------------+
|                   INFRASTRUCTURE                          |
|   Docker Compose  |  Railway  |  Terraform  |  Helm/K8s  |
+----------------------------------------------------------+
```

### 3.1 Codebase at a glance

| Component | Lines of code | Files | Language |
| --- | --- | --- | --- |
| **Control Plane API** (`src/api/`) | 25,233 | 437 Python files total | Python (FastAPI, SQLAlchemy, Pydantic) |
| **Operator Dashboard** (`app/`) | 25,366 | 57 pages, 119 components, 66 API routes | TypeScript (Next.js App Router) |
| **CLI + TUI** (`cli/`) | 14,324 | 23 commands, 5 TUI modules | Python (Click, Textual) |
| **Python SDK** (`sdk/mutx/`) | 7,866 | 26 resource modules | Python (httpx) |
| **Tests** (`tests/`) | 30,543 | 130 test files | Python (pytest, Playwright) |
| **Infrastructure** (`infrastructure/`) | 6,055 | 12 Helm templates, 10 Terraform, 13 Ansible playbooks, 19 Docker configs | YAML, HCL, Shell |
| **Scripts** (`scripts/`) | 15,985 | Build, deploy, release, smoke-test pipelines | Python, Shell, TypeScript |

### 3.2 Operator surfaces

| Surface | Path / URL | Implementation |
| --- | --- | --- |
| Public site | `mutx.dev` | Next.js App Router with ISR |
| Dashboard | `app.mutx.dev/dashboard` | 57 authenticated pages |
| Control demo | `app.mutx.dev/control/*` | Live browser demo of control-plane API |
| Browser proxies | `app/api/` | 66 same-origin route handlers |
| CLI | `mutx` | Click command groups (23 commands) |
| TUI | `mutx tui` | Textual cockpit (5 screen modules) |
| SDK | `pip install mutx` | 26 typed resource modules |
| macOS app | `mutx.dev/download/macos` | Capacitor-signed desktop operator |

---

## 4. Control Plane API

The FastAPI backend mounts all public routes under `/v1/*`, with root probes at `/`, `/health`, `/ready`, and `/metrics`.

### 4.1 Route families (32 route modules, 136 paths, 170 operations)

```
agents          deployments       sessions         runs
api_keys        webhooks          budgets          templates
analytics       monitoring        usage            observability
auth            security          rag              clawhub
runtime         onboarding        swarms           leads
assistant       scheduler         governance       audit
governance_credentials  governance_supervision  telemetry
policies        approvals         ingest           newsletter
agent_runtime   monitoring
```

OpenAPI snapshot: [`docs/api/openapi.json`](docs/api/openapi.json) — 19,815 lines, full schema coverage.

### 4.2 Resource model (24 database models)

```python
# src/api/models/models.py — 633 lines

class User(Base):           # Identity, plan, role, email
class Agent(Base):          # name, status, config, type, user_id
class Deployment(Base):     # agent_id, replicas, region, version, status
class DeploymentVersion(Base):   # Versioned config snapshots
class DeploymentEvent(Base):     # Append-only event log
class Session(Base):        # agent_id, status, started_at, ended_at
class AgentRun(Base):       # Execution records with traces
class AgentRunTrace(Base):  # OpenTelemetry trace capture
class APIKey(Base):         # Prefixed mutx_live_*, hashed server-side
class Webhook(Base):        # Event subscriptions
class WebhookDeliveryLog(Base):  # Delivery receipts
class UsageEvent(Base):     # Metered usage tracking
class AnalyticsEvent(Base): # Product analytics
class AgentLog(Base):       # Structured agent logs
class AgentMetric(Base):    # Time-series metrics
class AgentResourceUsage(Base): # CPU/memory/token consumption
class Lead(Base):           # CRM funnel
class WaitlistSignup(Base): # Early access queue
```

The ORM layer uses SQLAlchemy 2.0 async with `AsyncSession` and `mapped_column` type annotations. PostgreSQL-native types (UUID, ARRAY) are used in production; a polymorphic `ArrayType` shim provides SQLite compatibility for local development.

### 4.3 Database layer

17 Alembic migrations track schema evolution. The engine (`src/api/database.py`, 387 lines) handles:

- **Async engine creation** with configurable SSL modes (`disable`, `prefer`, `require`, `verify-ca`, `verify-full`)
- **Runtime schema repair** — detects missing columns from model definitions and auto-creates them, with metrics and logging
- **SSL fallback** — catches SSL rejection errors and retries with `prefer` mode
- **Connection lifecycle** — lifespan-managed `init_db` / `dispose_engine` hooks

### 4.4 Middleware stack (5 layers)

```
Request → TrustedHost → CORS → Tracing → Auth → Rate Limit → Route Handler
```

**Tracing middleware** (`src/api/middleware/tracing.py`) — Extracts `TRACEPARENT`/`TRACESTATE` headers using `TraceContextTextMapPropagator`, injects `trace_id` and `span_id` into `request.state` for downstream access.

**Auth middleware** (`src/api/middleware/auth.py`, 346 lines) — Dual-token resolution:
1. JWT verification via `verify_access_token()` (OIDC-compatible)
2. API key fallback via `verify_api_key()` (hashed lookup, prefix-matched `mutx_live_*`)
3. Role-based gating via `require_role()` (DEVELOPER, ADMIN, AUDIT_ADMIN)
4. Email verification enforcement on configured routes

---

## 5. Governance Engine

MUTX integrates [Faramesh](https://faramesh.dev) for deterministic agent governance through the [FPL (Faramesh Policy Language)](https://github.com/faramesh/fpl-lang).

### 5.1 Security layer architecture

The governance stack is implemented in `src/security/` (8 modules):

```
src/security/
  mediator.py    (317 lines) — Action Mediation Layer
  policy.py      (465 lines) — Policy Engine
  context.py     — Context accumulator for intent signals
  approvals.py   — Human-in-the-loop approval routing
  compliance.py  — Compliance evidence generation
  receipts.py    — Execution receipts and audit trail
  telemetry.py   — Security event telemetry
```

The **Action Mediator** intercepts tool invocations and normalizes them to a canonical `NormalizedAction` format:

```python
@dataclass
class NormalizedAction:
    tool_name: str
    parameters: dict[str, Any]
    action_hash: str          # SHA-256 of (tool + sorted params)
    category: ActionCategory   # safe, moderate, dangerous, critical
    risk_score: float          # 0.0 - 1.0
```

The **Policy Engine** evaluates normalized actions against rules and context:

```python
class PolicyDecision(str, Enum):
    ALLOW = "allow"
    DENY = "deny"
    MODIFY = "modify"           # Strip/redact parameters before execution
    REQUIRE_APPROVAL = "require_approval"  # Escalate to human
```

### 5.2 Faramesh supervisor

`src/api/services/faramesh_supervisor.py` (637 lines) manages supervised agent processes:

- Auto-patches 13 frameworks at runtime: LangGraph, CrewAI, AutoGen, Pydantic AI, LlamaIndex, Hayject, AgentKit, AgentOps, Braintrust, Helicone, Weave, AG2, Mem0
- Manages process lifecycle: STARTING → RUNNING → STOPPING → STOPPED (with FAILED and RESTARTING states)
- Communicates via Unix domain socket at `/tmp/faramesh.sock`
- Enforces FPL policies per-agent with configurable profiles

### 5.3 Authority levels (R0–R3)

| Level | Scope | Human role |
| --- | --- | --- |
| R0 | Read-only: classify, search, summarize | Validates process |
| R1 | Draft preparation: suggestions, form completion | Approves final send |
| R2 | Workflow state: reminders, task creation, alerts | Reviews non-economic decisions |
| R3 | Low-risk pre-approved operational actions | Confirms orders, payments, critical comms |

### 5.4 Credential broker

`src/api/services/credential_broker.py` (863 lines) provides on-demand credential injection with TTL management:

**Backends:** HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, 1Password, Infisical.

Agents never see raw credentials. The broker decrypts values server-side using `encrypt_secret_value` / `decrypt_secret_value`, injects them as ephemeral environment variables for the duration of a tool call, then clears them.

### 5.5 SPIFFE identity

`src/api/services/spiffe_identity.py` (256 lines) integrates SPIFFE/SPIRE for workload identity:

- SVID-based agent authentication
- mTLS between agents and governance services
- Identity sources: SPIRE, Kubernetes service accounts, environment variables, static

---

## 6. Self-Healing and Observability

### 6.1 Self-healer

`src/api/services/self_healer.py` (718 lines) provides autonomous deployment recovery:

```python
class RecoveryAction(str, Enum):
    RESTART = "restart"
    ROLLBACK = "rollback"
    SCALE_UP = "scale_up"
    SCALE_DOWN = "scale_down"
    RECREATE = "recreate"
```

Configuration:
- Consecutive failure threshold (default: 3)
- Health check interval (default: 10s)
- Retry delay with exponential backoff
- Automatic rollback on persistent failure
- Recovery audit trail with status tracking (PENDING → IN_PROGRESS → SUCCESS/FAILED/PARTIAL)

### 6.2 OpenTelemetry integration

All spans follow `mutx.<operation>` naming (e.g., `mutx.agent.execute`, `mutx.tool.execution`, `mutx.session.start`).

Standard attributes: `agent.id`, `session.id`, `trace.id` propagated across services.

SDK usage (`sdk/mutx/telemetry.py`):
```python
from mutx.telemetry import init_telemetry, span, trace_context

init_telemetry("my-agent", endpoint="http://collector:4317")

with span("mutx.agent.execute", {"agent.id": agent_id}) as sp:
    sp.set_attribute("session.id", session_id)
```

---

## 7. Authentication and Access Control

**RBAC** — `require_role()` gates on approvals (DEVELOPER/ADMIN), security (ADMIN), policies (ADMIN), and audit (ADMIN/AUDIT_ADMIN) routes.

**OIDC Token Validation** — JWKS fetcher with TTL cache, JWT signature validation, `iss`/`aud`/`exp` claim checks. Compatible with Okta, Auth0, Azure AD, and Keycloak. Configured via `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_JWKS_URI` environment variables.

**API keys** — First-class resources: prefixed (`mutx_live_...`), hashed server-side, one-time plaintext exposure on creation.

---

## 8. SDK Architecture

The Python SDK (`sdk/mutx/`, 7,866 lines) provides typed access to every control-plane resource:

```python
from mutx import MutxClient

client = MutxClient(api_key="mutx_live_...")

# 26 resource modules
client.agents          client.deployments    client.sessions
client.runs            client.api_keys       client.webhooks
client.budgets         client.analytics      client.observability
client.security        client.governance     client.approvals
client.swarms          client.templates      client.scheduler
client.ingest          client.leads          client.runtime
client.onboarding      client.clawhub        client.usage
```

### 8.1 Agent runtime client

`sdk/mutx/agent_runtime.py` (937 lines) provides the agent-side SDK:

```python
from mutx import create_agent_client

client = create_agent_client(
    agent_id="my-agent",
    api_key="mutx_live_...",
    base_url="https://api.mutx.dev"
)

# Register, heartbeat, report metrics, receive commands
await client.register()
await client.heartbeat()
await client.report_metrics({"latency_ms": 42, "tokens_used": 1500})
```

### 8.2 Guardrails middleware

`sdk/mutx/guardrails.py` (371 lines) provides client-side content filtering:

- **PII detection** — Regex-based detection of emails, phone numbers, SSNs, credit cards
- **Toxicity detection** — HTTP-based toxicity scoring
- **Custom regex blocking** — Configurable pattern matching
- **Composite guardrails** — Stack multiple checks with configurable actions (block, warn, allow)

```python
from mutx.guardrails import GuardrailMiddleware, PIIGuardrail, RegexGuardrail

guardrails = GuardrailMiddleware([
    PIIGuardrail(action="block"),
    RegexGuardrail(pattern="internal-only", action="warn"),
])

result = guardrails.check("user input here")
# GuardrailResult(passed=True, triggered_rule=None, action="allow", message="OK")
```

### 8.3 Policy client

`sdk/mutx/policy.py` (207 lines) — watches and hot-reloads guardrail policies from the control plane:

```python
from mutx.policy import MutxPolicyClient

policy_client = MutxPolicyClient(
    base_url="https://api.mutx.dev",
    api_key="mutx_live_...",
    profile="strict"  # strict | standard | permissive
)

# Auto-refreshes policies every 30s
await policy_client.start()
```

---

## 9. CLI and TUI

### 9.1 CLI (`cli/`, 14,324 lines)

23 command groups mounted under `mutx`:

```
mutx agent        mutx agents        mutx deploy
mutx deployment   mutx auth          mutx api-keys
mutx budgets      mutx governance    mutx observability
mutx runtime      mutx security      mutx scheduler
mutx webhooks     mutx usage         mutx config
mutx clawhub      mutx assistant     mutx onboard
mutx doctor       mutx setup         mutx tui
mutx update
```

Built on Click with async support. Each command group maps 1:1 to a control-plane route family.

### 9.2 TUI (`cli/tui/`)

Textual-based operator cockpit with 5 screen modules:

```
cli/tui/
  app.py       — Application entry point
  cockpit.py   — Main dashboard view
  screens.py   — Screen definitions
  renderers.py — Custom renderers
  models.py    — Data models
```

Provides real-time agent status, deployment health, metrics, and session monitoring from the terminal.

---

## 10. Infrastructure

### 10.1 Deployment modes

| Mode | Configuration | Use case |
| --- | --- | --- |
| Docker Compose | `infrastructure/docker/docker-compose.yml` (220 lines) | Local development, 9 services |
| Railway | `railway.json` + 3 service configs | Hosted application services |
| Terraform + Ansible | 10 TF files + 13 Ansible playbooks | Cloud provisioning (DigitalOcean) |
| Helm chart | 12 templates under `infrastructure/helm/mutx/` | Kubernetes (HA) |

### 10.2 Docker Compose stack

```
PostgreSQL 16   Redis 7       Backend API (FastAPI)
Frontend (Next.js)  Nginx     Prometheus    Grafana
OTel Collector
```

All services include health checks, volume persistence, and network isolation.

### 10.3 Kubernetes / Helm

Production-grade Helm chart at `infrastructure/helm/mutx/`:

```
templates/
  _helpers.tpl      configmap.yaml    deployment.yaml
  hpa.yaml          ingress.yaml      service.yaml
  tests/
```

- `values.yaml` (dev), `values.prod.yaml` (HA), `values.staging.yaml` overlays
- Auto-generated secrets, configurable replicas, resource limits (default: 256Mi–1Gi)
- HPA with CPU-based autoscaling (2–10 replicas)

### 10.4 Monitoring

Prometheus + Grafana configs under `infrastructure/`. The API exposes `/metrics` for scraping. OTel Collector provides distributed trace export.

---

## 11. Build Roadmap

### Priority 0 (90-day critical path)

1. OpenTelemetry-native observability (event spine, not vanity dashboard)
2. Append-only audit store + trace capture
3. Enterprise SSO + RBAC (OIDC: Okta, Auth0, Keycloak, Google)
4. Real-time guardrails middleware (block/warn/steer/require_approval)
5. LangChain adapter (one excellent adapter before five mediocre ones)

### Priority 1

- Live policy service with hot reload (versioned API + rollback)
- Human-in-the-loop approval workflows (Slack/email routing)
- Ollama/local model adapter
- MCP tool exposure, thin A2A handoff

### Priority 2

- Compliance evidence exports (SOC2, HIPAA, GDPR templates)
- Privacy router / data residency
- CrewAI, AutoGen, Google ADK adapters
- Kubernetes operator

---

## 12. What Ships Today

### Control plane (v1.4)

- 32 route modules, 136 API paths, 170 operations under `/v1/*`
- 24 SQLAlchemy models, 17 Alembic migrations
- RBAC enforcement with OIDC token validation (JWKS cache)
- OpenTelemetry distributed tracing across all services
- Kubernetes Helm chart for production deployment

### Governance

- Faramesh integration (FPL policy language, session budgets, credential brokering, ambient guards)
- Action Mediator → Policy Engine pipeline with 4 decision types (allow, deny, modify, require_approval)
- Credential broker supporting 6 secret backends
- SPIFFE/SPIRE workload identity integration
- Self-healing deployment recovery (718 lines, 6 recovery actions)
- R0–R3 authority levels with human confirmation gates

### SDK

- 26 typed resource modules covering the full API surface
- Agent runtime client (937 lines) with registration, heartbeat, metrics, command reception
- Client-side guardrails middleware (PII, toxicity, regex, composite)
- Policy hot-reload client with configurable profiles

### Operator surfaces

- 57 authenticated dashboard pages, 119 components, 66 API routes
- 23 CLI commands, Textual TUI cockpit
- Signed macOS desktop app
- 19,815-line OpenAPI specification

### Infrastructure

- Docker Compose (9 services, health-checked)
- Terraform + Ansible (10 + 13 files)
- Helm chart (12 templates, HPA, ingress)
- Prometheus + Grafana monitoring

---

## 13. Documentation Truth Rule

The canonical order of truth:

1. **Mounted code** in `src/api/`, `app/api/`, `app/dashboard/`, `app/control/`, `cli/`, `sdk/mutx/`
2. **Generated OpenAPI snapshot** in `docs/api/openapi.json`
3. **Prose documentation** in `README.md`, `docs/`, and this whitepaper

The published GitBook site is a presentation layer over repo truth, not a parallel source.

---

## 14. Built On

- **[agent-run](https://github.com/builderz-labs/agent-run)** — Agent observability standard. MUTX Observability Schema is based on agent-run with renamed types (MutxRun, MutxStep, MutxCost).
- **[AARM](https://github.com/aarm-dev/docs)** — Autonomous Action Runtime Management specification. MUTX implements AARM components (Action Mediation, Policy Engine, Approval Service, Telemetry Exporter).
- **[Faramesh](https://github.com/faramesh/faramesh-core)** — Pre-execution governance engine. MUTX uses Faramesh as the AARM-compliant policy enforcement backend.
- **[Mission Control](https://github.com/builderz-labs/mission-control)** — Dashboard inspiration and agent fleet management concepts.

---

## 15. Conclusion

MUTX is a governed control plane for agent systems — 406K+ lines of production code, 170 API operations, 24 database models, 6 secret backends, 13 framework auto-patches, and a governance stack that makes deterministic policy decisions before agent actions execute.

The value is not in claiming every piece is finished. The value is that MUTX already models the right surfaces — identity, deployment, governance, observability, access control, and honest operator contracts — while the market is still arguing about prompts.

If agent software becomes real infrastructure, the valuable layer is the one that makes it deployable, operable, observable, and governable.

That is the layer MUTX is building.

**Deploy agents like services. Operate them like systems. Govern them like infrastructure.**
