# TODAY.md — Project Shepherd

## Current operating truth
- CI is now green on `#1211` and `#1210` — Validation, Container Image Scan, and Trivy all passing.
- The only remaining gate is a second reviewer attached to each PR.
- Market signal sharpened: **intent scope**, **least-privilege scoped to operation**, **approval hooks as responsible automation**.

## Next operating window
- Window: 2026-03-29 14:10–16:10 Europe/Rome
- Objective: attach a second reviewer to `#1211` and `#1210`, keep dashboard truth honest, avoid overclaiming on GTM/distribution.

## Top 3 cross-lane priorities
1. **Attach a second reviewer to `#1211` and `#1210`**
   - CI is green; approvals are the only remaining gate.
   - Owner: **qa-reliability-engineer** + **Fortune**.
2. **Keep product/runtime truth honest on `/dashboard`**
   - Add the shared truth strip so operators can see live vs partial vs stale vs auth-blocked state.
   - Owner: **product-manager**.
3. **Turn canonical truth into safe proof**
   - Keep GTM/distribution focused on supported, truthful operator proof; keep X manual-only/conservative.
   - Owner: **outbound-strategist**.

## Owner pushes for this window
- **Review queue / QA:** qa-reliability-engineer + Fortune for reviewer attach; infra-delivery-operator for `#1209` scan fix.
- **Product/runtime truth:** product-manager, workflow-architect, technical-writer, ai-engineer, frontend-developer.
- **Proof + distribution:** outbound-strategist, developer-advocate, sales-engineer, account-strategist, social-media-strategist, report-distribution-agent.

## Blockers / stale / unowned
- **Blocker:** `#1211` and `#1210` — CI-green but no second reviewer attached.
- **Blocker:** `#1209` — reviewer identity AND Container Image Scan failing.
- **Blocker:** dashboard routes still need a shared truth strip.
- **Blocker:** gateway/SSH trust hardening remains open.
- **Degraded:** X distribution stays manual-only / conservative.
- **Stale:** CI-noise framing — CI is no longer the blocker for the top two PRs.
