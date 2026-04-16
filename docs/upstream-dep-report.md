# MUTX Upstream Dependency Report

Last updated: 2026-04-16

## Critical Changes (action needed now)

| Source | Change | Impact | MUTX File | Type |
|--------|--------|--------|-----------|------|
| mission-control v2.0.0 | Task status `awaiting_owner` added to enum | Breaking — any MUTX code consuming task statuses must handle new value | Any task status handling | breaking |
| mission-control v2.0.0 | Webhook retry with circuit breaker, delivery history, verify-docs | Breaking — MUTX webhooks.py (basic CRUD) far behind MC's delivery infra | `src/api/routes/webhooks.py` | breaking |
| mission-control v2.0.0 | Session lifecycle controls (pause/terminate/continue/transcript) | Breaking — MUTX sessions.py has basic CRUD only | `src/api/routes/sessions.py` | breaking |
| mission-control v2.0.0 | Agent sub-routes expanded (comms, evals, message, optimize, sync) | Breaking — MUTX agents.py lacks inter-agent messaging, eval framework, optimization | `src/api/routes/agents.py` | breaking |
| Microsoft AGT | Agent Governance Toolkit released (MIT, 7 packages) | Critical — new industry baseline for agent governance, covers OWASP Agentic AI Top 10 | `src/api/routes/policies.py`, `src/api/routes/security.py` | adopt |
| Faramesh costshield | Pre-execution cost governance module (MIT) | High — standalone budget enforcement for agent tool calls | `src/api/routes/budgets.py` | adopt |

## Mission-Control Backend Delta

**MC version: v2.0.1** (2026-03-18) — jumped from v1.3.0. Major release with 189 commits.

### API Surface: MC 101 endpoints vs MUTX ~55 endpoints

#### MC-Only Route Families (not in MUTX)
| MC Route | Description | Priority |
|----------|-------------|----------|
| `activities/` | Real-time activity feed | Medium |
| `adapters/` | Framework adapters (OpenClaw, CrewAI, LangGraph, AutoGen, Claude SDK) | High |
| `alerts/` | Alert system | Low |
| `backup/` | Backup/restore | Low |
| `channels/` | Agent communication channels | Medium |
| `chat/` | Embedded chat workspace | Medium |
| `claude-tasks/`, `claude/sessions/` | Claude Code task/session bridge | Low |
| `connect/` | Gateway connection management | High |
| `events/` | Event streaming | Medium |
| `frameworks/` | Framework detection/management | Medium |
| `gateway-config/`, `gateways/` | Multi-gateway management (connect, control, discover, health) | High |
| `github/` | GitHub Issues sync | Low |
| `gnap/` | Git-native task persistence | Medium |
| `hermes/` | Hermes agent observability (events, memory, tasks) | High |
| `memory/` | Obsidian-style knowledge graph (context, graph, health, links, process, search) | High |
| `mentions/` | @mention system | Low |
| `nodes/` | Pipeline node management | Medium |
| `notifications/` | Notification system | Medium |
| `pipelines/`, `workflows/` | Pipeline/workflow orchestration | Medium |
| `projects/` | Project management with ticket numbering | Medium |
| `pty/` | PTY terminal integration | Low |
| `quality-review/` | Aegis quality gate system | Medium |
| `security-scan/`, `mcp-audit/` | Security scanning + MCP call auditing | Medium |
| `skills/`, `registry/` | Skills Hub with bidirectional disk↔DB sync + security scanner | High |
| `spawn/` | Agent spawn requests | Medium |
| `standup/` | Automated standup reports | Low |
| `super/` | Multi-tenant superadmin (tenants, provision-jobs, os-users) | Medium |
| `system-monitor/`, `diagnostics/`, `status/` | System monitoring + diagnostics | Low |
| `tokens/` | Token usage tracking | Medium |
| `workload/` | Workload distribution | Low |
| `workspaces/` | Workspace management | Medium |

#### Divergent Routes (exists in both, different shape)
| MC Route | MUTX Route | Delta |
|----------|-----------|-------|
| `cron/` + `schedule-parse/` + `scheduler/` | `scheduler.py` | MC has NL→cron parsing + separate cron management |
| `exec-approvals/` | `approvals.py` | MC has exec-specific approval flow |
| `security-audit/` | `security.py` | MC has dedicated security-audit panel |
| `skills/` + `registry/` | `clawhub.py` | MC has full skills lifecycle; MUTX has install-only |

#### Key Breaking Changes (v1.3.0 → v2.0.0)
1. **B1**: Task status `awaiting_owner` added — MUTX must handle new enum value
2. **B2**: Memory system redesigned — Obsidian-style knowledge surface (6 sub-routes)
3. **B3**: Session controls — pause/terminate/continue/transcript endpoints
4. **B4**: Webhook delivery infra — retry with circuit breaker, delivery history, verify-docs
5. **B5**: Agent sub-routes — comms, evals, message, optimize, sync
6. **B6**: Cron→scheduler divergence — MC has both `/cron/` and `/scheduler/` with NL parsing
7. **B7**: Node >=22 requirement (frontend only, no MUTX backend impact)

#### MC lib/ Utilities Not in MUTX
| Utility | Function |
|---------|----------|
| `skill-sync.ts` | Bidirectional disk↔DB skill sync |
| `skill-registry.ts` | Registry client + security scanner |
| `agent-evals.ts` | 4-layer eval framework (output, trace, component, drift) |
| `models.ts` | Dynamic model catalog |
| `adapters/` (7 files) | Framework adapters (OpenClaw, CrewAI, LangGraph, AutoGen, Claude SDK, generic) |
| `security-events.ts` | Event logger + trust scoring |

## Faramesh & Governance

### Faramesh Org (github.com/faramesh)
- **faramesh-core** v1.2.4 (MIT, Go, 38⭐) — Runtime governance engine: CLI, SDKs, policy engine, credential broker, tamper-evident audit chain
- **fpl-lang** (MIT, Go) — FPL policy DSL: agent-native primitives, mandatory `deny!`, NL compilation, GitOps native
- **costshield** (MIT, Go) — Pre-execution cost governance: session/daily budgets, two-phase accounting, anomaly detection
- **tesseract** — Pre-governance observation engine
- **sverm** — Cross-agent behavioral analysis
- **hub** — Open-source policy pack registry
- **supply-chain** — Supply chain security tooling
- **cloud-sdk** — Auth, plan gating, inter-tool mesh
- Python/Node SDKs, UI, examples, Homebrew tap

### AARM v1.0 (Autonomous Action Runtime Management)
- Spec by Kavya Pearlman / XRSI-aligned researchers
- 5 authorization decisions: ALLOW, DENY, MODIFY, STEP_UP, DEFER
- Framework-agnostic, vendor-neutral runtime security spec
- **Recommendation**: Align MUTX governance layer with AARM's 5-decision model

### Microsoft Agent Governance Toolkit (AGT) — NEW April 2026
- 7 packages: agent-os, agent-mesh, agent-runtime, agent-sre, agent-compliance, agent-marketplace, agent-lightning
- MIT license, Python/TS/Rust/Go/.NET, 9,500+ tests
- Covers all OWASP Agentic AI Top 10
- <0.1ms p99 policy enforcement latency
- **Recommendation**: Evaluate as primary or complementary governance layer

### RPL (Reasoning Policy Language)
- No standalone RPL project exists. FPL and AARM cover the same ground. **Ignore**.

## Dependency Audit

### npm Outdated Packages (26 packages)

| Package | Current | Latest | Severity |
|---------|---------|--------|----------|
| react | 18.3.1 | 19.2.5 | **high** — major version behind |
| react-dom | 18.3.1 | 19.2.5 | **high** — major version behind |
| electron | 39.8.5 | 41.2.1 | **high** — major version behind |
| tailwindcss | 3.4.19 | 4.2.2 | **high** — major version behind |
| lucide-react | 0.323.0 | 1.8.0 | **high** — major version behind |
| tailwind-merge | 2.6.1 | 3.5.0 | **medium** — major version behind |
| sonner | 1.7.4 | 2.0.7 | **medium** — major version behind |
| react-intersection-observer | 9.16.0 | 10.0.3 | **medium** — major version behind |
| typescript | 5.9.3 | 6.0.2 | **medium** — major version behind |
| @types/three | 0.169.0 | 0.183.1 | **low** — type defs |
| resend | 6.9.3 | 6.12.0 | **low** — minor |
| framer-motion | 12.35.2 | 12.38.0 | **low** — minor |
| next | 16.2.3 | 16.2.4 | **low** — patch |
| postcss | 8.5.8 | 8.5.10 | **low** — patch |
| autoprefixer | 10.4.27 | 10.5.0 | **low** — minor |
| eslint | 10.1.0 | 10.2.0 | **low** — minor |
| eslint-config-next | 16.2.1 | 16.2.4 | **low** — patch |
| postgres | 3.4.8 | 3.4.9 | **low** — patch |
| lenis | 1.3.18 | 1.3.23 | **low** — patch |
| ts-jest | 29.4.5 | 29.4.9 | **low** — patch |
| @capacitor/android | 8.2.0 | 8.3.0 | **low** — minor |
| @capacitor/core | 8.2.0 | 8.3.0 | **low** — minor |
| globals | 17.4.0 | 17.5.0 | **low** — minor |
| typescript-eslint | 8.57.2 | 8.58.2 | **low** — patch |
| @types/node | 25.3.5 | 25.6.0 | **low** — type defs |
| @types/pg | 8.18.0 | 8.20.0 | **low** — type defs |

### npm Audit: **0 vulnerabilities** ✅

### Python: venv not at `venv/` — likely at `.venv/` per AGENTS.md. Manual check needed.

## Watch List

| Project | URL | Relevance | Action |
|---------|-----|-----------|--------|
| Microsoft AGT | github.com/microsoft/agent-governance-toolkit | Agent governance, OWASP coverage | **ADOPT** |
| Faramesh Core | github.com/faramesh/faramesh-core | Runtime governance engine | **ADOPT** |
| FPL | github.com/faramesh/fpl-lang | Policy DSL for agents | **WATCH→ADOPT** |
| CostShield | github.com/faramesh/costshield | Pre-execution cost governance | **ADOPT** |
| AARM Spec | arxiv.org/html/2602.09433v1 | Runtime security spec | **ADOPT** (align conformance) |
| k8s agent-sandbox | github.com/kubernetes-sigs/agent-sandbox | K8s agent isolation (1.8k⭐) | **WATCH** |
| Langfuse | github.com/langfuse/langfuse | LLM observability, cost tracking | **WATCH** |
| skillpm | npmjs.com/package/skillpm | Agent skill package manager | **WATCH** |
| LangChain deepagents | github.com/langchain-ai/deepagents | Agent harness patterns | **WATCH** |
| Cloudflare Dynamic Workers | Cloudflare blog | Lightweight JS sandboxing | **WATCH** |
| Asqav SDK | github.com/jagmarques/asqav-sdk | Cryptographic audit trails | **WATCH** |

## Changelog
### 2026-04-16
- Initial upstream dependency report
- MC jumped from v1.3.0 to v2.0.1 — 7 breaking changes, 21 additive capabilities, 101 REST endpoints
- Faramesh org mapped: 14 repos, core at v1.2.4, CostShield and FPL notable
- Microsoft AGT released April 2026 — 7-package governance toolkit, MIT, critical priority
- AARM v1.0 spec identified as industry baseline for runtime security
- 26 npm packages outdated (5 major versions behind), 0 vulnerabilities
- React 18→19, Tailwind 3→4, Electron 39→41 are the biggest version gaps
