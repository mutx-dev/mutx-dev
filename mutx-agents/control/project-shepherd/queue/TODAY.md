# TODAY.md — Project Shepherd

## Current operating truth
- The fleet is operational, but truth hygiene is still the bottleneck.
- Live company brief says `#117` and `#39` are already closed in GitHub, while local planning files still lag behind that truth.
- The next move is to refresh control artifacts from source-of-truth audits, not to expand scope.

## Next operating window
- Window: 2026-03-28 18:10–20:10 Europe/Rome
- Objective: publish the post-close truth audit set, then refresh control files so local planning matches live reality.

## Top 3 cross-lane priorities
1. **Post-close parity audit for `#117`**
   - Verify deployment parity truth across API, CLI, SDK, and docs, then mark the canonical deployment path and legacy compatibility path cleanly.
2. **Post-close runtime-truth audit for `#39`**
   - Make dashboard/docs/operator UX reflect the real runtime signals: live/partial/stale/auth-blocked instead of generic healthy/empty states.
3. **Trust + distribution discipline**
   - Keep gateway/SSH hardening moving and keep X/manual distribution conservative until source-of-truth mismatch is settled.

## Owner pushes for this window
- **Parity + contract truth:** workflow-architect, technical-writer, product-manager
- **Runtime truth / UI:** ai-engineer, frontend-developer, project-shepherd
- **Trust hardening:** infrastructure-maintainer, security-engineer
- **Distribution discipline:** social-media-strategist, report-distribution-agent

## Blockers / stale / unowned
- **Blocker:** local control files still trail live truth on `#117`, `#39`, and `#114`.
- **Blocker:** dashboard routes still need a shared truth strip so operators can see live vs partial vs stale vs auth-blocked before the main cards render.
- **Blocker:** gateway trust boundary and fail-open SSH provisioning remain trust risks.
- **Degraded:** X automation stays manual-only until the lane is reconciled.
- **Unowned unless named now:** the refresh pass that aligns queue/report artifacts with live company truth.
