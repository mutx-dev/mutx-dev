# TODAY.md — Project Shepherd

## Current operating truth
- The fleet is operational, and the active work is still review-bound.
- Fortune’s comments on `#1211` and `#1210` are non-blocking; independent approval is still the gate.
- The next move is to clear the review queue and keep product/runtime claims conservative.

## Next operating window
- Window: 2026-03-29 08:10–10:10 Europe/Rome
- Objective: clear the active review queue, keep dashboard truth honest, and avoid overclaiming on GTM/distribution.

## Top 3 cross-lane priorities
1. **Clear the active review queue**
   - PR `#1211` auth refresh, `#1210` local bootstrap path, `#1209` system overview CPU/memory.
   - Owner: **qa-reliability-engineer**.
2. **Keep product/runtime truth honest on `/dashboard`**
   - Add the shared truth strip so operators can see live vs partial vs stale vs auth-blocked state.
   - Owner: **product-manager**.
3. **Turn canonical truth into safe proof**
   - Keep GTM/distribution focused on supported, truthful operator proof; keep X manual-only/conservative.
   - Owner: **outbound-strategist**.

## Owner pushes for this window
- **Review queue / QA:** qa-reliability-engineer, infra-delivery-operator
- **Product/runtime truth:** product-manager, workflow-architect, technical-writer, ai-engineer, frontend-developer
- **Proof + distribution:** outbound-strategist, developer-advocate, sales-engineer, account-strategist, social-media-strategist, report-distribution-agent

## Blockers / stale / unowned
- **Blocker:** independent approvals are still the bottleneck; merge queue is empty.
- **Blocker:** dashboard routes still need a shared truth strip.
- **Blocker:** gateway/SSH trust hardening remains open.
- **Degraded:** X distribution stays manual-only / conservative.
- **Stale:** any local plan language that lags live review state.
- **Unowned unless named now:** the reconcile-and-advance pass that clears the active review queue.
