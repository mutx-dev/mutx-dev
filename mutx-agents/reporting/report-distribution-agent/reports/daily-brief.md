# daily-brief.md — MUTX Executive Brief

> 2026-03-28 16:05 Europe/Rome

## Lead
The MUTX fleet is now operational: 14 promoted agents have proven they can boot, read shared control state, and write useful lane artifacts. The limiting factor is no longer fleet readiness; it is company truth hygiene.

## What is true now
- `/dashboard` is the canonical app surface.
- Local memory + QMD are live and stable.
- Gateway + node + ACP are healthy.
- Promoted lanes across control, product, build, GTM, and reporting are working.

## What changed today
- Shared control-state files were wired into all promoted agent workspaces.
- Both Wave 1 and Wave 2 agents produced real lane artifacts.
- Stale queue/fleet state around `#117`, `#39`, and `#114` was identified.
- Live GitHub truth shows those issues are already closed.

## Main company risk
The biggest remaining risk is stale or over-optimistic state:
- local planning files said key issues were open
- live GitHub says they are closed
- executor/runtime trust is still treated as questionable across multiple lanes

## Immediate company priorities
1. run a post-close parity audit for `#117`
2. run a post-close runtime-truth audit for `#39`
3. refresh control files from those audits
4. keep X automation conservative until source-of-truth mismatch is resolved

## Decision for Fortune
Do not widen product/runtime claims or scale distribution until the two post-close audit lanes come back clean.
