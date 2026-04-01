# mutx-fleet-state.md

> Last refreshed: 2026-04-01 14:46 Europe/Rome

## Executive state
**MUTX is running.** Docker stack is up. API (`localhost:8000`) reports healthy. Postgres, Redis, API containers all running. Repo is on main.

The autonomy infrastructure is now versioned, wired, and live:
- Heartbeat cron: every 4 hours, runs `make dev`, posts to Discord + opens GitHub issue on failure
- Autonomous daemon: persistent Python process, processes action queue via Codex subagents, creates branches + PRs
- Queue feeder: cron every 15min, watches GitHub issues labeled `autonomy:ready`, adds to action queue
- Scripts now versioned in `scripts/autonomy/` (were previously unversioned)
- Backend worktree: on `main`, up to date
- Frontend worktree: on `main`, up to date

## Current active risks
1. **Docker Desktop must be running** — if Docker daemon dies, heartbeat fails silently, entire stack collapses. No redundant container host.
2. **20+ unmerged branches** in backend worktree — most are stale `autonomy/*`, `codex/*`, `copilot/*` branches with no active PR. These are drift amplifiers. Should be pruned.
3. **GitHub issues `#117`, `#39`, `#114`, `#115`**: not yet audited against live truth.
4. **Autonomy queue is empty** — daemon is running but has no items. No active autonomous work happening.
5. **Discord webhook for heartbeat not configured** — heartbeat posts to log file only.

## What's proven working (as of 2026-04-01)
- `make dev`: starts Docker Compose stack (API, Postgres, Redis healthy)
- API health: `GET /health → {"status":"healthy","database":"ready"}`
- Autonomy daemon: running (PID verified)
- Heartbeat cron: registered, every 4h
- Queue feeder cron: registered, every 15min
- Gateway: `openclaw status` shows gateway reachable

## Priority actions
1. **Prune stale branches** — 20+ branches with no PR should be closed
2. **Add items to action queue** — put real work into the queue so the daemon has something to process
3. **Configure Discord webhook for heartbeat** — set `DISCORD_MUTX_WEBHOOK` env var to get heartbeat alerts in Discord
4. **Audit closed issues** — `#117`, `#39`, `#114`, `#115` need post-close validation against live truth
5. **Set up CI on main** — wire `make test` to run on every PR merge

## Operational rule
Do not scale claims beyond what is validated by live `make dev` and live API health. The heartbeat is now the ground truth signal.
