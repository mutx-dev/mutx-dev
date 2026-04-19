---
description: AGT parity and MUTX coherence roadmap. Grounded in source, not aspiration.
icon: shield-check
---

# AGT Parity Roadmap

Last updated: 2026-04-20
Source: repo truth audit + Microsoft Agent Governance Toolkit public docs

## Principles

- Source code beats prose. If the code doesn't do it, the column says "none-yet."
- Use shipped/preview/roadmap labels. No aspirational claims.
- AGT is the parity benchmark, not the product identity. MUTX is the governed operations layer.

## Parity Matrix

| # | AGT Capability | MUTX Equivalent | Gap | Owner Lane | Priority | Validation | Public Claim |
|---|---------------|----------------|-----|------------|----------|------------|-------------|
| 1 | Deterministic policy enforcement | Policy CRUD exists (policy_store.py), no evaluation engine | Large | Policy engine (06) | P0 | pytest test_policies -q evaluate path | roadmap |
| 2 | Zero-trust agent identity | Auth works (JWT + API key), no agent-level identity model | Medium | Auth/RBAC (10) | P1 | pytest -k auth + agent identity tests | roadmap |
| 3 | Action interception / capability gates | None | Large | Capability (07) | P1 | pytest test_capabilities -q | none-yet |
| 4 | Audit evidence export with integrity | aiosqlite audit exists, no export/hash/run_id/actor fields | Large | Audit (09) | P0 | pytest -k audit + evidence export test | roadmap |
| 5 | CLI verification (doctor/verify/lint) | cli/commands/doctor.py exists, no governance verify | Medium | CLI (11) | P1 | pytest tests/cli -k doctor | roadmap |
| 6 | Governance dashboard | Dashboard pages exist (deployments, observability), no evidence loop | Medium | Dashboard (12) | P1 | npm run build + Playwright | roadmap |
| 7 | Framework integrations (LangChain, CrewAI, AutoGen) | 4 adapters exist, all POST to /v1/events (no route) | Large (broken sink) | Adapter (05) + Ingest (04) | P0 | pytest tests/adapters -q + live POST | preview (broken) |
| 8 | SDK matrix (Python) | Python SDK exists (sdk/mutx/), TypeScript/Go/.NET/Rust = none | Medium | SDK adapter (05) | P2 | pip install mutx + import test | shipped (Python only) |
| 9 | Approval escalation routing | Approval CRUD exists, not wired to policy decisions | Medium | Approvals (08) | P0 | pytest test_approvals -q policy wire | roadmap |
| 10 | OWASP Agentic Top 10 mapping | None documented | Large | Security (13) | P1 | docs/security/agentic_risk_matrix.md | none-yet |
| 11 | SRE primitives (SLOs, circuit breaker, kill switch) | None | Large | SRE (14) | P2 | pytest test_sre -q | none-yet |
| 12 | Shadow-agent discovery | None | Large | Shadow (15) | P2 | mutx discover agents --json | none-yet |
| 13 | Lifecycle management (register/suspend/decom) | Agent CRUD exists, no lifecycle state machine | Medium | Lifecycle (17) | P2 | pytest -k lifecycle | roadmap |
| 14 | MCP security scanning | None | Large | MCP (16) | P2 | mutx mcp scan --json | none-yet |
| 15 | Signed event provenance | None | Large | Trust (18) | P2 | pytest -k signature | none-yet |
| 16 | Agent sandboxing (execution isolation) | None | Large | Infrastructure | P3 | N/A (infra-level) | none-yet |

## P0 Sprint (Wave 0-2 — close coherence gaps)

These 6 items must land before any GTM claim about "governed operations":

1. **Event contracts** (03) — freeze RunEvent v1 schema
2. **Event ingestion** (04) — POST /v1/ingest/events, fix adapter sink
3. **SDK adapter alignment** (05) — fix api_key="", point to canonical endpoint
4. **Policy evaluation engine** (06) — deterministic allow/warn/block/require_approval
5. **Approval policy wire** (08) — require_approval triggers automatic request
6. **Audit evidence export** (09) — hash chain, run_id, actor, export endpoint

## P1 Sprint (Wave 3 — make it visible and defensible)

7. Auth/RBAC/OIDC reconciliation (10)
8. CLI governance commands (11)
9. Dashboard evidence loop (12)
10. OWASP Agentic Top 10 matrix (13)

## P2 Sprint (Wave 4 — extend)

11. Capability sandbox (07)
12. SRE primitives (14)
13. Shadow discovery (15)
14. MCP scanner (16)
15. Lifecycle management (17)
16. Signed provenance (18)
17. Adapter template (19)

## Claims allowed now

| Claim | Allowed? | Evidence |
|-------|----------|----------|
| "Source-available control plane for AI agents" | Yes | Public repo, mounted routes |
| "Governed operations layer" | Preview | Partial — policies/approvals exist but loop not closed |
| "Trace every run" | Preview | Audit exists but adapters broken (no event sink) |
| "Enforce every risky step" | Roadmap | Policy engine not built yet |
| "Prove every decision" | Roadmap | No evidence export or hash chain |
| "Framework integrations" | Preview (broken) | Adapters exist but POST to dead endpoint |
| "OWASP Agentic Top 10" | None-yet | No mapping exists |
| "Kubernetes for agents" | FORBIDDEN | Not the product |
| "Fully open-source platform" | FORBIDDEN | Source-available, not OSI open source |
| "Compliance-ready" | FORBIDDEN (without qualification) | No audit export, no integrity proof |

## Competitive notes

AGT (Microsoft) strengths:
- Enterprise distribution channel
- Deterministic policy engine (proven)
- OWASP alignment story
- Multi-language SDK (.NET, Python, TypeScript)

MUTX strengths vs AGT:
- Source-available (AGT is proprietary/enterprise)
- Runtime-neutral (not tied to Azure/AWS)
- Designed for deployed agents (not dev-tooling)
- Governance dashboard built into product (AGT is SDK-first)
- Approval workflows in product (AGT delegates to custom code)

MUTX risks:
- Policy engine not yet functional (AGT has one)
- No evidence export (AGT has audit trails)
- Single-language SDK (AGT targets 3+)
- No OWASP mapping (AGT aligns with Agentic Top 10)
