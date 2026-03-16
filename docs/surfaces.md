---
description: Supported vs aspirational surface matrix for MUTX platforms.
icon: layered-shapes
---

# Surface Matrix

This document clearly maps MUTX's public surfaces and their maturity level — helping users understand what is production-ready versus what is still developing.

## The Three Public Surfaces

| Surface | URL | Role | Status |
| ------- | --- | ---- | ------ |
| Marketing | [mutx.dev](https://mutx.dev) | Public product narrative, waitlist capture, and entry point | **Supported** |
| Documentation | [docs.mutx.dev](https://docs.mutx.dev) | Canonical docs, API reference, and operator guides | **Supported** |
| App | [app.mutx.dev](https://app.mutx.dev) | Operator-facing authenticated app shell | **Aspirational** |

## Status Definitions

### Supported

Surfaces marked **Supported** are:

- Production-hosted and publicly available
- Actively maintained and monitored
- Documented as the canonical source for their respective domain
- Stable APIs and user experience

### Aspirational

Surfaces marked **Aspirational** are:

- In active development or preview
- Not yet feature-complete for production use
- Subject to breaking changes without notice
- Documented to set expectations, not as stable contracts

## Detailed Breakdown

### mutx.dev (Supported)

**What it does:**
- Explains the product thesis and value proposition
- Links to documentation and GitHub repository
- Captures waitlist signups via Next.js waitlist flow
- Points users toward the app preview

**What it is not:**
- The canonical API reference (see docs.mutx.dev)
- The authenticated operator dashboard (see app.mutx.dev)
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

---

### app.mutx.dev (Aspirational)

**What it does today:**
- Browser-facing auth flows (register, login, logout, me)
- Read-oriented dashboard routes (agents, deployments, API keys, health)
- Rendered app shell positioning around core primitives

**What it is not yet:**
- A complete production dashboard
- A full replacement for direct API usage
- A write-complete surface for all control-plane resources

**Known gaps:**
- No full write-complete dashboard for all resources
- Dashboard maturity still trails the backend resource model
- Some workflows remain easier through direct API or CLI usage

**Source of truth:** `app/app/`, `app/api/`

## Quick Reference

| Need | Surface | Status |
|------|---------|--------|
| Learn about MUTX | mutx.dev | Supported |
| Understand APIs and integration | docs.mutx.dev | Supported |
| Build on MUTX programmatically | docs.mutx.dev + API | Supported |
| UI-based agent/deployment management | app.mutx.dev | Aspirational |
| Full dashboard experience | app.mutx.dev | Aspirational |

## Contributing

When adding features or documenting new capabilities:

1. Identify which surface the work belongs to
2. Document the maturity level honestly
3. Update this matrix if surface status changes
4. Flag aspirational features clearly in documentation

For current project status and contributor lanes, see [Project Status](./project-status.md).
