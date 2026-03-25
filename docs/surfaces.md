---
description: Supported vs preview surface matrix for MUTX platforms.
icon: layered-shapes
---

# Surface Matrix

This document maps MUTX's public surfaces and their maturity level so users can see what is stable, what is preview, and what is still clearly a demo.

## The Three Public Surfaces

| Surface | URL | Role | Status |
| ------- | --- | ---- | ------ |
| Marketing | [mutx.dev](https://mutx.dev) | Public product narrative, waitlist capture, and entry point | **Supported** |
| Documentation | [docs.mutx.dev](https://docs.mutx.dev) | Canonical docs, API reference, and operator guides | **Supported** |
| App host | [app.mutx.dev](https://app.mutx.dev) | Operator-facing dashboard plus control demo host | **Preview** |

## Status Definitions

### Supported

Surfaces marked **Supported** are:

- Production-hosted and publicly available
- Actively maintained and monitored
- Documented as the canonical source for their respective domain
- Stable APIs and user experience

### Preview

Surfaces marked **Preview** are:

- Publicly reachable and backed by real code paths
- Useful today, but still changing quickly
- Not yet write-complete across every backend capability
- Documented with explicit gaps instead of finished-product language

## Detailed Breakdown

### mutx.dev (Supported)

**What it does:**
- Explains the product thesis and value proposition
- Links to documentation and GitHub repository
- Captures waitlist signups via Next.js waitlist flow
- Points users toward the app preview

**What it is not:**
- The canonical API reference (see docs.mutx.dev)
- The authenticated operator dashboard (see app.mutx.dev/dashboard)
- The source of truth for route behavior

**Source of truth:** `app/page.tsx`

---

### docs.mutx.dev (Supported)

**What it does:**
- Provides canonical API documentation
- Offers quickstart and deployment guides
- Explains platform architecture and security
- Documents troubleshooting and FAQs

**What it is not:**
- A functional app or dashboard
- A replacement for direct API/CLI usage when needed

**Source of truth:** `docs/`

### app.mutx.dev (Preview)

**What it does today:**
- Browser-facing auth flows (`/api/auth/*`)
- Authenticated dashboard pages under `/dashboard`
- Same-origin dashboard proxies for agents, deployments, runs, sessions, swarms, budgets, assistant overview, monitoring, API keys, and webhooks
- Control demo routes under `/control/*`

**What it is not yet:**
- A complete production dashboard for every backend resource
- A replacement for the CLI in every operator workflow
- Proof that every modeled backend capability has a finished frontend surface

**Known gaps:**
- Some flows remain CLI-first or API-first
- Scheduler and full RAG search are still placeholder-backed on the backend
- Dashboard maturity still trails the full backend route surface

**Source of truth:** `app/dashboard/`, `app/control/`, `app/api/`

## Quick Reference

| Need | Surface | Status |
|------|---------|--------|
| Learn about MUTX | mutx.dev | Supported |
| Understand APIs and integration | docs.mutx.dev | Supported |
| Build on MUTX programmatically | docs.mutx.dev + API | Supported |
| UI-based operator workflows | app.mutx.dev/dashboard | Preview |
| Browser control-plane demo | app.mutx.dev/control/* | Preview |
| Agent governance (Faramesh) | `mutx governance` CLI | Preview |

### Governance (Faramesh)

Governance is integrated via [Faramesh](https://faramesh.dev) and provides deterministic policy enforcement, approval workflows, and credential brokering for MUTX-managed agents.

**What it does today:**
- Policy enforcement (PERMIT/DENY/DEFER) via FPL
- CLI commands for governance inspection and approval actions
- Governance tab in Textual TUI
- Prometheus metrics export via `/v1/governance/metrics`
- Bundled policy packs (starter, payment-bot, infra-bot, customer-support)

**What is not yet:**
- Webhook-based approval notifications
- Policy editor UI in dashboard
- Credential broker UI

**Source of truth:** `cli/faramesh_runtime.py`, `cli/commands/governance.py`, `docs/governance.md`

## Contributing

When adding features or documenting new capabilities:

1. Identify which surface the work belongs to
2. Document the maturity level honestly
3. Update this matrix if surface status changes
4. Flag preview-only or placeholder-backed features clearly in documentation

For current project status and contributor lanes, see [Project Status](./project-status.md).
