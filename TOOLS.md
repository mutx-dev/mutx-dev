# TOOLS.md — Environment Notes

## Canonical repo + docs paths
- Primary MUTX repo: `/Users/fortune/MUTX`
- OpenClaw workspace: `/Users/fortune/.openclaw/workspace`
- OpenClaw docs mirror in workspace: `/Users/fortune/.openclaw/workspace/docs`
- Factory worktrees:
  - backend -> `~/mutx-worktrees/factory/backend`
  - frontend -> `~/mutx-worktrees/factory/frontend`
  - ship -> `~/mutx-worktrees/factory/ship`

## GitHub
- `GH_TOKEN` is available in env

## Local memory stack
- Assistant-facing memory search: local GGUF embeddings, fallback `none`
- Builtin vector store: SQLite + `sqlite-vec`
- QMD binary: `/opt/homebrew/bin/qmd`
- QMD models cache: `~/.cache/qmd/models`
- Per-agent QMD state: `~/.openclaw/agents/<agentId>/qmd/`

## OpenClaw runtime
- Gateway port: `18789`
- Gateway mode: local / loopback
- ACP backend: `acpx`
- Default coding agent: `codex`
- Default model lane: `openai-codex/gpt-5.4`
- Default thinking: `xhigh`

## MUTX local dev
- Full stack: `make dev`
- Auth bootstrap: `make test-auth`
- Seed data: `make seed`
- Docker Compose path: `infrastructure/docker/docker-compose.yml`

## Operating principle
If a path or binary matters repeatedly, pin it here explicitly so future sessions do not guess.
