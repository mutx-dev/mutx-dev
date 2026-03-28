# latest.md — Project Shepherd

## Status
**State:** REVIEW-BLOCKED BUT MOVING.

The active queue is still review-bound, but a material change landed: Fortune left non-blocking review comments on `#1211` and `#1210`. That means the comments are no longer the blocker; independent approval and CI are.

## Top 3 cross-lane priorities
1. **Clear the active review queue**
   - PR `#1211` auth refresh, `#1210` local bootstrap path, `#1209` system overview CPU/memory.
2. **Keep product/runtime truth honest on `/dashboard`**
   - Add the shared truth strip so live vs partial vs stale vs auth-blocked state is obvious.
3. **Turn canonical truth into safe proof**
   - Keep GTM/distribution focused on supported operator proof; keep X manual-only/conservative.

## Blockers, stale lanes, and unowned work
- **Main blocker:** independent approvals are still the bottleneck; no merge queue yet.
- **Main blocker:** dashboard routes still need a shared truth strip.
- **Main blocker:** gateway/SSH trust hardening remains open.
- **Degraded lane:** X distribution remains manual-only / conservative.
- **Stale work:** any local control note that lags live review state.
- **Unowned unless assigned clearly:** the reconcile-and-advance pass that clears the review queue.

## Owner map
| Priority | Primary owners | Immediate output expected |
| --- | --- | --- |
| Review queue | qa-reliability-engineer, infra-delivery-operator | clear remaining review comments, get approvals, move approved items toward merge |
| Product/runtime truth | product-manager, workflow-architect, technical-writer, ai-engineer, frontend-developer | one shared truth-strip brief for `/dashboard` |
| Proof + distribution | outbound-strategist, developer-advocate, sales-engineer, account-strategist, social-media-strategist, report-distribution-agent | one supported proof path and one conservative distribution note |

## Control call
Keep the fleet moving, but do not let local files outrun live review state.
