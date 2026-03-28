# MUTX Executive Brief — 2026-03-28 22:45 Europe/Rome

## Lead / decision for Fortune
The company is review-bound and trust-bound, not code-bound. The immediate call is to harden the operator boundary before widening automation: current OpenClaw defaults still show `exec=full`, `sandbox=off`, `workspaceOnly=false`, and the Ansible SSH path can still fail open. Do not expand automation or external distribution beyond conservative/manual until those are fixed.

Secondary blocker: the active review queue still needs to be cleared (`#1211` auth refresh, `#1210` local bootstrap path, `#1209` system overview CPU/memory).

## Product
- v1.3 now gives MUTX one coherent public operator story across `mutx.dev/download`, `mutx.dev/releases`, the v1.3 docs note, and `/dashboard`.
- The sharpest product move is no longer “close deployment parity” in the abstract; it is a design-partner-ready first 15 minutes: install or download, authenticate, deploy once, and see truthful runtime state without crossing into preview territory.
- Keep async SDK ambiguity out of the supported story until the contract is real; `MutxAsyncClient` remains explicitly limited/deprecated.

## Build
- The best tightening target is a shared truth strip on `/dashboard/agents`, `/dashboard/deployments`, and `/dashboard/monitoring` so live / partial / stale / auth-blocked state is obvious before the main cards render.
- Runtime health truth needs to show the real operator signals: background monitor state, failure streak, last success/error, and schema repairs; `ready` should stay DB-readiness only.
- Deployment workflow docs and SDK helpers still need a single state/action matrix, with the canonical `POST /v1/deployments` path first and the legacy agent-scoped deploy route marked compatibility-only.

## GTM
- The best wedge remains platform / developer-infra teams shipping an agent product with public API, CLI, SDK, and docs surfaces that already drift.
- The message should stay: MUTX keeps the control plane truthful across dashboard, API, CLI, SDK, and docs.
- Proof should stay bounded and conservative: runtime posture, approval-aware operator state, signed Mac download lane, and honest current-state docs. No self-heal or autonomy claims.

## Control
- `Project Shepherd` says the fleet is operational, but the live state is still review-bound and the queue is the bottleneck.
- Keep local planning files from outrunning live review state.
- X distribution stays manual-only / conservative.

## Engineering / security
- `Security Engineer` flagged the clearest concrete trust defect: Ansible provisioning still defaults SSH to world-open `ADMIN_CIDR`, and tracked docs still show `StrictHostKeyChecking=no`.
- `Infrastructure Maintainer` says the gateway is healthy, but the control boundary is not yet safe enough for shared operator access.
- Fix the fail-open SSH path and the gateway trust boundary before adding more automation or reopening older executor-recovery threads.

## Outside-in signal
- No materially new signal surfaced in the latest scan.
- The market signal still points to agent control planes, runtime policy, approvals, identity / permissioning, and observability as first-class production requirements.

## Next move
1. Clear the active review queue.
2. Patch the trust boundary / fail-open SSH path.
3. Ship the truthful first-15-minutes proof path and keep GTM conservative until it is clean.
