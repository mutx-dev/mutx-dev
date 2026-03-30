# MUTX Operating Blueprint

## Engines
1. Product / Build Engine
2. Reliability / Trust Engine
3. Demand / Content Engine
4. Outbound / Sales Engine
5. Control / Reporting Engine

## Principle
Do not maximize agent count. Maximize leverage, trust, and measurable outputs.

## Current promoted roster
See `PROMOTION-REGISTRY.md`.

## Current automation shape
- Each promoted agent has a dedicated workspace-owned core pack.
- Each promoted agent has a named persistent cron session.
- Shared context lives in `_shared/` plus QMD-backed recall over workspace, memory, docs, repo docs, recovery docs, and sessions.

## Human gates
Required for: production deploys, destructive actions, customer promises, pricing changes, external outreach sends at scale, gateway-wide risky config changes.
