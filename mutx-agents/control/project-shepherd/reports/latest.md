# latest.md — Project Shepherd

## Status
**State:** GREEN-ISH, BUT THE CONTROL FILES ARE STILL LAGGING LIVE TRUTH.

New material landed today: the company brief says the promoted fleet is operational, and live truth says `#117` / `#39` are already closed while local planning files still trail behind. The control problem is now source-of-truth reconciliation, not lane coverage.

## Top 3 cross-lane priorities
1. **Post-close parity audit for `#117`**
   - Confirm deployment parity truth across API, CLI, SDK, and docs, then normalize the canonical deployment path vs compatibility path.
2. **Post-close runtime-truth audit for `#39`**
   - Make the dashboard and docs expose live/partial/stale/auth-blocked state instead of generic health fallbacks.
3. **Trust + distribution discipline**
   - Keep gateway/SSH hardening moving and keep X/manual distribution conservative until the truth gap is fully reconciled.

## Blockers, stale lanes, and unowned work
- **Main blocker:** local control-state files are stale relative to live company truth on `#117`, `#39`, and `#114`.
- **Main blocker:** the dashboard still needs a shared truth strip on `/dashboard/agents`, `/dashboard/deployments`, and `/dashboard/monitoring`.
- **Main blocker:** gateway posture is still too open for shared use, and the Ansible SSH path still fails open.
- **Degraded lane:** X distribution remains manual-only / conservative.
- **Stale work now:** refreshing control artifacts from live source-of-truth audits.
- **Unowned unless assigned clearly:** the reconcile-and-refresh pass that aligns queue/report files with live company reality.

## Owner map
| Priority | Primary owners | Immediate output expected |
| --- | --- | --- |
| `#117` parity truth | workflow-architect, technical-writer, product-manager | one short audit note that names the canonical deployment path and the compatibility path cleanly |
| `#39` runtime truth | ai-engineer, frontend-developer, project-shepherd | one UI/docs brief for live vs partial vs stale vs auth-blocked state |
| Trust hardening | infrastructure-maintainer, security-engineer | one approval-ready hardening brief for gateway posture and fail-closed SSH |
| Distribution discipline | social-media-strategist, report-distribution-agent | one conservative/manual-only distribution note until truth is reconciled |

## Control call
Keep the fleet moving, but stop treating stale local control files as truth. Refresh from the source of record first.
