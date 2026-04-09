---
description: Supported vs preview surface matrix for MUTX platforms.
icon: layered-shapes
---

# Surface Matrix

This document maps MUTX's public surfaces and their maturity level so users can see what is supported, what remains preview, and where the browser demo still diverges from the stable operator path.

## The Public Surfaces

| Surface | URL | Role | Status |
| ------- | --- | ---- | ------ |
| Marketing | [mutx.dev](https://mutx.dev) | Public product narrative, waitlist capture, and entry point | **Supported** |
| Release summary | [mutx.dev/releases](https://mutx.dev/releases) | Current release summary, asset map, and release-note handoff | **Supported** |
| Desktop download lane | [mutx.dev/download/macos](https://mutx.dev/download/macos) | First-party signed and notarized macOS release handoff | **Supported** |
| Documentation | [docs.mutx.dev](https://docs.mutx.dev) | Canonical docs, API reference, and operator guides | **Supported** |
| Self-hosted docs | `/docs` | Self-hosted alternative to docs.mutx.dev for on-prem deployments | **Supported** |
| Operator dashboard | [app.mutx.dev/dashboard](https://app.mutx.dev/dashboard) | Authenticated operator shell for stable dashboard routes | **Supported** |
| Control demo | [app.mutx.dev/control](https://app.mutx.dev/control) | Browser demo for the control-plane story and preview paths | **Preview** |

## Status Definitions

### Supported

Surfaces marked **Supported** are:

- Production-hosted and publicly available
- Actively maintained and monitored
- Documented as the canonical source for their respective domain
- Stable APIs and user experience
- Cleared the signed release-candidate gates when desktop artifacts are part of the public promise

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
- Publishes the public release summary at `/releases`
- Publishes the first-party desktop download flow at `/download/macos`
- Links operators into the supported dashboard and CLI install lanes

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

### app.mutx.dev/dashboard (Supported)

**What it does today:**
- Browser-facing auth flows (`/api/auth/*`)
- Authenticated dashboard pages under `/dashboard` (agents, deployments, runs, sessions, swarms, budgets, observability, API keys, webhooks)
- Same-origin dashboard proxies for agents, deployments, runs, sessions, swarms, budgets, assistant overview, monitoring, API keys, and webhooks
- Composed overview contract under `/api/dashboard/overview` for the first viewport
- Onboarding flow for desktop app

**What it is not yet:**
- A complete production dashboard for every backend resource
- A replacement for the CLI in every operator workflow
- Proof that every modeled backend capability has a finished frontend surface
- Proof that preview-backed routes are ready for primary navigation

**Known gaps:**
- Some flows remain CLI-first or API-first
- RAG search and scheduler return 503 with feature flags until runtime is configured
- Preview or redirect-backed shell pages are now hidden from primary stable navigation until their live contracts are real
- Dashboard maturity still trails the full backend route surface
- Preview-labeled routes remain visible only through direct navigation and in-shell preview markers
- Preview-backed routes stay out of the primary stable navigation even though the stable dashboard lane is supported

**Source of truth:** `app/dashboard/`, `app/control/`, `app/api/`

### app.mutx.dev/control (Preview)

**What it does today:**
- Preserves the browser demo shell for the control-plane story
- Demonstrates routing, narrative, and demo-specific layout patterns

**What it is not:**
- Not the supported dashboard lane
- Not the source of truth for stable operator workflows
- Not proof that preview-backed routes are ready for primary navigation

## Quick Reference

| Need | Surface | Status |
|------|---------|--------|
| Learn about MUTX | mutx.dev | Supported |
| See the current release and artifact set | mutx.dev/releases | Supported |
| Download the Mac app | mutx.dev/download/macos | Supported |
| Understand APIs and integration | docs.mutx.dev | Supported |
| Understand APIs and integration (self-hosted) | /docs | Supported |
| Build on MUTX programmatically | docs.mutx.dev + API | Supported |
| UI-based operator workflows | app.mutx.dev/dashboard | Supported |
| Agent run observability | app.mutx.dev/dashboard/observability | Supported for stable routes |
| Browser control-plane demo | app.mutx.dev/control/* | Preview |
| Agent governance (Faramesh) | `mutx governance` CLI | Preview |

### Governance (Faramesh)

Governance is integrated via [Faramesh](https://faramesh.dev) and provides deterministic policy enforcement, approval workflows, and credential brokering for MUTX-managed agents.

**What it does today:**
- Policy enforcement (PERMIT/DENY/DEFER) via FPL
- CLI commands for governance inspection and approval actions
- Governor tab in Textual TUI
- Prometheus metrics export via `/v1/runtime/governance/metrics`
- Bundled policy packs (starter, payment-bot, infra-bot, customer-support)
- SPIFFE/SPIRE workload identity
- Governance webhooks with FPL `notify` directive routing
- Credential broker (Vault, AWS, GCP, Azure, 1Password, Infisical)

**What is not yet:**
- Webhook-based approval notifications (governance webhooks fire but approval workflow is CLI-first)
- Policy editor UI in dashboard
- Credential broker UI

**Source of truth:** `cli/faramesh_runtime.py`, `cli/commands/governance.py`, `docs/governance.md`, `src/security/`

## Contributing

When adding features or documenting new capabilities:

1. Identify which surface the work belongs to
2. Document the maturity level honestly
3. Update this matrix if surface status changes
4. Flag preview-only or placeholder-backed features clearly in documentation

For current project status and contributor lanes, see [Project Status](./project-status.md).
