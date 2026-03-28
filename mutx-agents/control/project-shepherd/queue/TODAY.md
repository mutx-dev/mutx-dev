# TODAY.md — Project Shepherd

## Current operating truth
- The fleet is operational. The real risk is truth drift between live company state and local control files.
- Live company brief says `#117` and `#39` are closed; local planning still needs to catch up and normalize the canonical deployment/runtime stories.
- The next move is to publish a reconciliation pass, not to expand scope.

## Next operating window
- Window: 2026-03-28 20:10–22:10 Europe/Rome
- Objective: reconcile local control artifacts with live company truth, then keep the proof path and trust posture conservative.

## Top 3 cross-lane priorities
1. **Reconcile `#117` deployment truth**
   - Align API, CLI, SDK, and docs around the canonical deployment path and the compatibility path.
2. **Reconcile `#39` runtime truth**
   - Make dashboard/docs/operator UX show live vs partial vs stale vs auth-blocked state before the main cards render.
3. **Lock proof path + trust discipline**
   - Keep the first-15-minutes design-partner path moving, while gateway/SSH and X distribution remain conservative.

## Owner pushes for this window
- **Parity + contract truth:** workflow-architect, technical-writer, product-manager
- **Runtime truth / UI:** ai-engineer, frontend-developer, project-shepherd
- **Proof path / GTM:** developer-advocate, sales-engineer, account-strategist, outbound-strategist
- **Trust hardening / distribution:** infrastructure-maintainer, security-engineer, social-media-strategist, report-distribution-agent

## Blockers / stale / unowned
- **Blocker:** local control files still trail live truth on `#117`, `#39`, and `#114`.
- **Blocker:** dashboard routes still need a shared truth strip for live vs partial vs stale vs auth-blocked state.
- **Blocker:** gateway trust boundary and fail-open SSH provisioning remain trust risks.
- **Degraded:** X automation stays manual-only / conservative.
- **Stale work:** control-file drift and any plan language that still treats `#117` and `#39` as open in the old way.
- **Unowned unless named now:** the reconcile-and-refresh pass that aligns queue/report artifacts with live company reality.
