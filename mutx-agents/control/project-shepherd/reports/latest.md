# latest.md — Project Shepherd

## Status
**State:** YELLOW-LEANING-GREEN, WITH LOCAL CONTROL FILES STILL LAGGING LIVE TRUTH.

New material since the last pass: the fleet is operational, the promoted lanes are producing real artifacts, and live company truth now says `#117` and `#39` are closed. The remaining control problem is reconciliation: local planning and reporting still need to converge on that source of record.

## Top 3 cross-lane priorities
1. **Reconcile `#117` deployment truth**
   - Normalize the canonical deployment path and the compatibility path across API, CLI, SDK, and docs.
2. **Reconcile `#39` runtime truth**
   - Make dashboard and docs show live vs partial vs stale vs auth-blocked state before operators reach the main cards.
3. **Keep proof path + trust discipline tight**
   - Keep the first-15-minutes design-partner path moving, while gateway/SSH and X distribution stay conservative.

## Blockers, stale lanes, and unowned work
- **Main blocker:** local control-state files still trail live company truth on `#117`, `#39`, and `#114`.
- **Main blocker:** the dashboard still needs a shared truth strip on `/dashboard/agents`, `/dashboard/deployments`, and `/dashboard/monitoring`.
- **Main blocker:** gateway posture is still too open for shared use, and the Ansible SSH path still fails open.
- **Degraded lane:** X distribution remains manual-only / conservative.
- **Stale work now:** plan/report language that still treats `#117` and `#39` as unresolved in the old way.
- **Unowned unless assigned clearly:** the reconcile-and-refresh pass that aligns queue/report files with live company reality.

## Owner map
| Priority | Primary owners | Immediate output expected |
| --- | --- | --- |
| `#117` parity truth | workflow-architect, technical-writer, product-manager | one short reconciliation note that names the canonical deployment path and the compatibility path cleanly |
| `#39` runtime truth | ai-engineer, frontend-developer, project-shepherd | one UI/docs brief for live vs partial vs stale vs auth-blocked state |
| First-15-minutes proof path | developer-advocate, sales-engineer, account-strategist, outbound-strategist | one design-partner-ready walkthrough / POC brief |
| Trust hardening + distribution | infrastructure-maintainer, security-engineer, social-media-strategist, report-distribution-agent | one approval-ready hardening note plus one conservative distribution note |

## Control call
Keep the fleet moving, but refresh local control artifacts from the source of record before widening scope or claims.
