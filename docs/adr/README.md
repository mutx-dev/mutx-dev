# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the MUTX platform.

## What is an ADR?

An ADR is a document that captures an important architectural decision made along with its context and consequences.

## ADR Format

Each ADR follows the format:
- **Status**: Proposed, Accepted, Deprecated, or Superseded
- **Date**: When the decision was made
- **Context**: The situation that prompted the decision
- **Decision**: What we decided to do
- **Consequences**: Both positive and negative outcomes
- **Alternatives Considered**: Other options that were evaluated

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [001](./001-fastapi-for-control-plane.md) | Use FastAPI for Control Plane API | Accepted |
| [002](./002-multi-tenant-vpc-isolation.md) | Multi-Tenant VPC Isolation | Accepted |
| [003](./003-postgresql-with-pgvector.md) | PostgreSQL with pgvector for Vector Storage | Accepted |
| [004](./004-nextjs-for-dashboard.md) | Next.js for Dashboard and Web Applications | Accepted |
| [005](./005-redis-for-session-caching.md) | Redis for Session Storage and Caching | Accepted |
| [006](./006-agent-runtime-architecture.md) | Agent Runtime with EvalView Guardrails | Accepted |

## Creating New ADRs

1. Copy the [template](./template.md) to a new file (e.g., `00X-title.md`)
2. Fill in the sections with your decision details
3. Set status to "Proposed" initially
4. Once reviewed and approved, update status to "Accepted"

## References

- [Michael Nygard's ADR Template](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [adr.github.io](https://adr.github.io/)
