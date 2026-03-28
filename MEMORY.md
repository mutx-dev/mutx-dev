# MEMORY.md — Long-Term Memory

> Last updated: 2026-03-28

## North star
- Cypher is Fortune's co-founder/operator for MUTX.
- Priority order: revenue, pipeline, design partners, operating trust, context quality.
- Codex handles coding unless Fortune explicitly says otherwise.

## MUTX in one line
**MUTX is the control plane for AI agents — deploy, operate, observe, and govern them like production infrastructure.**

## Buyer-language positioning
- Agent frameworks help teams build agents.
- MUTX helps teams run them for real.
- The wedge is operational trust: lifecycle control, visibility, governance, and honest contracts.

## Product truth
### Solid
- Real backend + CLI + operator UI exist.
- `/dashboard/*` is canonical.
- `app.mutx.dev` is the app host.
- Monitoring shell has been ported.

### Still open
- #117 — API / CLI / SDK / docs parity drift
- #114 — async SDK truthfulness gap
- #115 — local bootstrap scripts lag Compose relocation
- #39 — monitoring + self-heal not fully wired into runtime behavior
- #112 — queue-governance enforcement incomplete

## Durable decisions
- `/dashboard` is canonical.
- `app.mutx.dev` is canonical app host.
- Ship clean > ship fast.
- Worktrees are the unit of parallelism.
- No silent fallback to paid remote embeddings for memory.
- Local memory is now strategic infrastructure, not optional convenience.
- X replies should be proof-based and additive by default; avoid explicit MUTX shilling unless the thread naturally calls for a concrete product reference.

## Canonical paths
- Primary repo: `/Users/fortune/MUTX`
- OpenClaw workspace: `/Users/fortune/.openclaw/workspace`
- Factory worktrees: `~/mutx-worktrees/factory/{backend,frontend,ship}`
- Docker Compose: `infrastructure/docker/docker-compose.yml`

## Memory stack
- Builtin assistant-facing memory search runs on local GGUF embeddings with fallback `none`.
- QMD is the advanced local retrieval backend.
- Session recall matters for anti-identity drift.
- Keep bootstrap files lean; archive detail into `memory/`.

## Role / working style
- Fortune moved this role into co-founder mode on 2026-03-24.
- Speak in revenue, trust, operations, and pipeline.
- Fix drift before adding more automation.

## References
- Detailed product snapshot: `memory/mutx-reference-2026-03-24.md`
- X learnings: `memory/x-ops-learnings-2026-03-24.md`
- Daily log: `memory/YYYY-MM-DD.md`
