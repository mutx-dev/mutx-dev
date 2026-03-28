# mutx-fleet-state.md

> Last refreshed: 2026-03-28 16:05 Europe/Rome

## Executive state
MUTX is operational, but not yet at full maximum power.

The control plane is healthy enough to run automation:
- OpenClaw gateway + node services are running
- ACP backend is ready
- local memory is healthy
- QMD-backed recall is live
- 14 promoted MUTX agents now have mission-ready workspaces and proven lane artifacts

The company bottleneck is no longer "can the fleet run?"
It is "are the product/runtime/contracts truthful enough to scale automation and claims?"

## Canonical truths
- `/dashboard` is the canonical app surface.
- GitHub live truth as of 2026-03-28:
  - Issue `#117` is **closed**
  - Issue `#39` is **closed**
  - Issue `#114` is **closed**
  - PR `#1183` is **closed**
- Local queue/fleet files were stale and were previously overstating `#117`, `#39`, and `#114` as active issue work.

## What is proven working
### Control plane
- gateway service
- node service
- ACP backend
- QMD memory + local fallback

### Proven promoted agents
- project-shepherd
- workflow-architect
- product-manager
- technical-writer
- security-engineer
- infrastructure-maintainer
- outbound-strategist
- ai-engineer
- frontend-developer
- sales-engineer
- account-strategist
- developer-advocate
- social-media-strategist
- report-distribution-agent

All of the above have successfully written real lane artifacts in their promoted workspaces.

## Current active risks
1. **Post-close truth risk**
   - Closed GitHub issues `#117`, `#39`, and `#114` must be validated against live repo/runtime/docs truth.
2. **Executor / runtime trust risk**
   - Fleet reports still converge on backend executor trust as the main scaling blocker.
3. **Mixed-timestamp state drift**
   - Older state files and newer lane reports can disagree and confuse automation.
4. **X lane degraded**
   - X automation/distribution remains unreliable and should be treated conservatively.

## Current priorities
1. `audit-117-parity-truth` — validate post-close deployment parity truth
2. `audit-39-runtime-truth` — validate post-close runtime/self-heal/executor truth
3. `issue-115` — fix local bootstrap scripts after Docker Compose relocation
4. `issue-112` — enforce queue health and Codex review handoff in autonomy tooling
5. refresh stale control files before widening automation claims

## Operational rule
Do not scale claims or automation beyond what is validated by:
- live repo truth
- live runtime truth
- fresh lane artifacts
- current memory/queue state

## Next move
Run the two bounded recovery ACP lanes in clean worktrees:
- `issue-117-parity` audit lane
- `issue-39-runtime-truth` audit lane

Then refresh the lane scorecard and daily control brief from their output.
