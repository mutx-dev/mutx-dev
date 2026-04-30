---
description: Competitive intelligence notes for MUTX positioning. Updated weekly by AGT Parity Watch cron.
icon: chart-bar
---

# Competitive Notes

Last updated: 2026-04-20
Primary benchmark: Microsoft Agent Governance Toolkit v3.1.0

## Market Positioning

MUTX: Source-available governed operations layer for deployed AI agents.
AGT: Microsoft-signed governance SDK for agent development.

These are **adjacent, not identical**. AGT is SDK-first (developer tooling). MUTX is platform-first (runtime operations).

## Feature Comparison Matrix

| Capability | MUTX | AGT v3.1.0 | MUTX Advantage |
|-----------|------|------------|----------------|
| Policy engine | ✅ PolicyEngine + REST API | ✅ <0.1ms eval | Parity |
| Action interception | ✅ ActionMediator (R1,R2) | ✅ Pre-execution gate | Parity |
| Approval workflows | ✅ Built-in (R5) | ⚠️ Delegates to custom code | **MUTX ahead** |
| Audit receipts | ✅ Crypto-signed (R6) | ✅ Audit trails | Parity |
| Credential brokering | ✅ 6 backends + TTL | ❌ None | **MUTX ahead** |
| Context-aware eval | ✅ Session + intent (R3,R4) | ⚠️ Partial | **MUTX ahead** |
| Runtime supervision | ✅ Faramesh 13-framework | ❌ SDK-level only | **MUTX ahead** |
| OWASP ASI 2026 | ❌ No mapping | ✅ 10/10 | AGT ahead |
| Shadow AI discovery | ❌ None | ✅ agent-discovery | AGT ahead |
| MCP security scanner | ❌ None | ✅ MCPServerPolicy | AGT ahead |
| Prompt injection eval | ❌ None | ✅ 12-vector audit | AGT ahead |
| Multi-language SDK | Python only | 5 languages | AGT ahead |
| Quantum-safe crypto | ❌ None | ✅ ML-DSA-65 | AGT ahead |
| CLI governance | Basic doctor | Full verify/lint/doctor | AGT ahead |
| Framework integrations | 13 (Faramesh) | 20+ | AGT breadth, MUTX depth |
| Distribution channel | Self-serve | Azure + Microsoft sales | AGT ahead |

## Score: MUTX 4 ahead, AGT 8 ahead, 3 parity

## GTM Implications

### Lead with (MUTX-only strengths)
1. **Credential brokering** — "The only agent governance platform with built-in secret management across 6 backends"
2. **Runtime supervision** — "Govern agents at runtime, not just at build time — Faramesh auto-patches 13 frameworks"
3. **AARM compliance** — "Formal AARM conformance (R1-R9) with automated compliance reporting"
4. **In-product approvals** — "Human-in-the-loop approvals built into the platform, not bolted on"

### Don't claim until built
- OWASP Agentic Top 10 coverage (need mapping doc)
- Multi-language SDK (TypeScript priority)
- Shadow AI discovery
- MCP security scanning

### Competitive defense vs AGT
- AGT is an SDK, not a platform. It governs code, not deployed agents.
- AGT requires you to write code against their SDK. MUTX intercepts at runtime.
- AGT doesn't manage credentials. MUTX does.
- AGT doesn't have a dashboard. MUTX does.
- AGT is Microsoft-first (Azure integration). MUTX is cloud-neutral.

### Competitive defense vs others
- **Langfuse/Langsmith**: Observability only, no governance/policy engine
- **Portkey**: AI gateway, not governance
- **Guardrails AI**: Content filtering, not action governance
- **AgentOps**: Monitoring, not policy enforcement

## Pricing Context

AGT: MIT-licensed, free. Revenue via Azure services.
MUTX: Source-available, €9-29/mo for PicoMUTX tiers. Revenue via SaaS.

This means AGT is not a direct revenue competitor — it's a mindshare competitor. The risk is developers adopting AGT's SDK patterns and then expecting those patterns in every tool.

## Weekly Delta Log

### 2026-04-20
- AGT stable at v3.1.0 (no new releases since April 11)
- MUTX major advances: full AARM security layer, credential broker, Faramesh supervision
- Gap reduction: 6 capabilities moved from Large to Small/None
- New gaps: quantum-safe crypto, prompt injection evaluator (from AGT v3.1.0)
- MUTX now has 4 capabilities where it leads AGT (was 0 at initial audit)
