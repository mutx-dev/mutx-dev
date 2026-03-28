# TODAY.md — Project Shepherd

## Current operating truth
- Material change: promoted-lane coverage is real now. Every promoted lane has a first `reports/latest.md`, and `lane-scorecard.md` exists.
- Cross-lane consensus is tighter: `/dashboard` is canonical, the fleet is operational, and the main gap is truth convergence, not missing lane coverage.
- Control’s job this window is to stop stale narrative drift and force one shared proof path.

## Next operating window
- Window: 2026-03-28 16:10–18:10 Europe/Rome
- Objective: lock the first design-partner-ready operator path, reconcile post-close truth on `#117` and `#39`, and keep trust-boundary claims conservative.

## Top 3 cross-lane priorities
1. **Design-partner-ready first 15 minutes**
   - One truthful path from install/download → auth → deploy → inspect, turned into a usable GTM proof asset.
2. **Post-close truth audits on `#117` and `#39`**
   - Reconcile whether deployment parity is actually closed, and make runtime/monitoring truth visible in dashboard/docs before adding claims.
3. **Trust-boundary hardening**
   - Close the gateway exposure and fail-open SSH provisioning gaps before widening automation or shared access.

## Owner pushes for this window
- **Proof path / GTM handoff:** product-manager, developer-advocate, sales-engineer, account-strategist, outbound-strategist
- **Contract + runtime truth:** workflow-architect, technical-writer, ai-engineer, frontend-developer, project-shepherd
- **Trust hardening:** infrastructure-maintainer, security-engineer
- **Distribution discipline:** social-media-strategist, report-distribution-agent

## Blockers / stale / unowned
- **Blocker:** no single published audit yet resolves the cross-lane disagreement on whether `#117` is done or still the main wedge.
- **Blocker:** `#39` is still a truth gap in the operator layer; monitoring/runtime signals exist, but the UX/docs story is still weaker than the backend reality.
- **Blocker:** gateway trust boundary and Ansible SSH defaults still fail trust.
- **Degraded:** X distribution remains red / unclear; treat automation as unreliable until reality matches reporting.
- **Stale artifacts:** the old blank-lane story is stale; the real stale risk now is control files drifting behind live lane reports.
- **Unowned unless named now:** the final canonical first-15-minutes proof artifact spanning product, GTM, and reporting.
