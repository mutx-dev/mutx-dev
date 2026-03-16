# ADR 002: Multi-Tenant VPC Isolation

## Status
Accepted

## Date
2024-02-01

## Context
Mutx deploys autonomous agents to customer VPCs. We need strong isolation between tenants while maintaining cost efficiency.

## Decision
Each customer gets a dedicated VPC subnet (10.0.1.0/24) with:
- Isolated agent clusters per tenant
- Tailscale Zero-Trust Network Access (ZTNA) mesh
- Dedicated PostgreSQL (with pgvector) and Redis per tenant

## Consequences

### Positive
- **Strong isolation**: Network-level separation between tenants
- **Zero-trust**: Tailscale ZTNA eliminates exposed attack surfaces
- **Compliance**: Easier to meet SOC2/GDPR requirements
- **No noisy neighbor**: Resources don't compete across tenants

### Negative
- **Higher infrastructure cost**: Dedicated resources per customer
- **Operational complexity**: More VPCs to manage and provision

## Alternatives Considered
- **Shared Kubernetes namespace**: Rejected - insufficient isolation
- **Database row-level multitenancy**: Rejected - security concerns
- **Ephemeral containers**: Rejected - insufficient persistence for agent state

## References
- [Tailscale ZTNA Documentation](https://tailscale.com/)
- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
