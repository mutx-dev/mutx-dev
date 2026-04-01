# MEMORY.md — Long-Term Memory

> Last updated: 2026-03-30

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
- Agent Reach is installed for MUTX as an outside-in intelligence layer feeding GTM/product agents; keep public execution in the guarded browser/X lane instead of making Agent Reach the default posting path.

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

## Council of High Intelligence
Ported from Claude Code to Codex/OpenClaw. Installed at `~/.openclaw/skills/council/`.
**Hardened** (2026-03-31): Pulled latest upstream, stripped multi-provider routing (Codex/Gemini/Ollama exec dispatch, `--models`/`--dry-route`/`--no-auto-route` flags, provider detect scripts), kept problem restate gate, expanded triad/duo tables, expanded verdict templates. **Wired to MiniMax-M2.7** — all sessions_spawn calls explicitly use `model: "minimax-portal/MiniMax-M2.7"`. No Anthropic/OpenAI minutes consumed.
Use for major MUTX decisions via structured multi-perspective deliberation.
See `docs/COUNCIL_PORT_STATUS.md` for MUTX-specific triad recommendations.

## X Ops (as of 2026-03-30)
- **Browser-only** — XURL tokens CLEARED. All X ops via CDP/browser-use on @mutxdev.
- **CDP daemon:** `ops/cdp_daemon.py` — polls queue/*.pending.md every 20s. Needs browser tab open. Daemon currently PAUSED.
- **Strategy:** ENGAGEMENT-FIRST. Max 1 original/day on @mutxdev. Heavy likes/replies/follows to grow account. @mutxdev profile is good — don't change it.
- **VOICE RULES (non-negotiable):** @mutxdev posts = enterprise PR team voice ($150k/year). Plain language. Buyer-accessible. NO internal content (CI failures, production fleet, internal tooling, repo commits). This caused two deleted posts on 2026-03-30.
- **Council:** Installed `~/.openclaw/skills/council/` — 18 agents. Deliberation wired into post pipeline but HOLDING until voice rules enforced.
- **Week cap:** 2/2 originals used. Resets 2026-04-06.
- **Deprecated xurl scripts:** moved to `scripts/deprecated/`.

## References
- Detailed product snapshot: `memory/mutx-reference-2026-03-24.md`
- X learnings: `memory/x-ops-learnings-2026-03-24.md`
- Daily log: `memory/YYYY-MM-DD.md`
