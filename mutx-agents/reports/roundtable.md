# MUTX Roundtable

Updated: 2026-03-28 22:09 Europe/Rome
Owner: project-shepherd

## Decisions
- Treat the active company state as **review-bound, not code-bound**.
- Use live GitHub review state plus lane briefs as the source of truth; keep stale control notes out of the decision path.
- Keep GTM/distribution conservative until the truth stack is aligned end-to-end.

## Top 3 priorities
1. **Clear the active review queue** — owner: **qa-reliability-engineer** for auth/bootstrap; **infra-delivery-operator** for system overview.
2. **Keep product/runtime truth honest on `/dashboard`** — owner: **product-manager** + **ai-engineer** + **frontend-developer**.
3. **Turn canonical truth into GTM proof without overclaiming** — owner: **outbound-strategist** + **developer-advocate**.

## Blockers
- No merge queue; reviews are the bottleneck.
- `#39` still needs a shared truth strip in dashboard/docs.
- Gateway/SSH trust hardening remains open.
- X distribution stays manual-only / conservative.

## Handoffs
- **qa-reliability-engineer**: validate auth-refresh and bootstrap-path reviews, then advance approved items toward merge.
- **infra-delivery-operator**: close CPU/memory query review and keep infra truth aligned.
- **product-manager / workflow-architect / technical-writer**: keep deployment/runtime claims synchronized with live state.
- **outbound-strategist / developer-advocate / social-media-strategist**: package only the supported proof path; no aggressive claims.

## Freshness
- Source briefs: `mutx-engineering-agents/mission-control-orchestrator/reports/latest.md` @ 22:00, `gtm/outside-in-intelligence/reports/signal-brief.md` @ 21:35, lane reports @ 22:00 or earlier.
- Next refresh: when the active review queue changes or at the next control window.
