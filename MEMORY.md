# MEMORY.md - Long-Term Memory

> Last updated: 2026-03-17

## About Fortune

- Building MUTX (mutx-dev/mutx-dev) — control plane for AI agents
- GitHub: fortunexbt
- Timezone: Europe/Rome
- Runs Codex factory sessions to auto-pump PRs

## MUTX Architecture

- **control-plane/** — FastAPI backend
- **cli/** — MUTX operator CLI  
- **sdk/** — Python SDK
- **agents/** — agent templates
- **infrastructure/** — Docker, Terraform
- **docs/** — documentation

## Operational Knowledge

### Running Local Dev
```bash
make dev          # Start Docker, DB, API, Frontend
make test-auth    # Register test user, get token
make seed         # Create test agents + deployments
```

### Factory Sessions
- Spawn Codex agents on issue branches in `~/mutx-worktrees/factory/`
- Each agent works on a separate issue, creates PR when done
- ship-closer pattern: auto-merge green PRs, auto-close red ones after ~10min

### Cron Workers (2026-03-16)
- Disabled sandbox to allow worktree writes
- 9 workers: backend (3), frontend (3), ship (1), ship-closer (1), cleanup (1)
- 120s timeout per job

## Known Issues

- Production build once failed due to TailwindCSS/PostCSS not processing @tailwind directives — redeploy with `pnpm build` locally

## Preferences

- Prefers efficiency over ceremony
- Values operational rigor for agent deployments
- Likes clever hacks, annoyed by repetitive manual work

## Autonomy Learnings (2026-03-18)

### Fleet Failure Analysis - DEEP DIVE

**Total Errors Logged:** 9,377 errors in gateway.err.log

#### The Real Story - Cascading Death Over Weeks

The fleet wasn't killed by just rate limits. It was a **multi-phase cascade**:

**Phase 1: Auth/Model Failures (Feb - Early March)**
- `No API key for anthropic` - missing Anthropic API key
- `No available auth profile for openrouter` - OpenRouter credits exhausted  
- `code plan not support model` - MiniMax plan limitations (280 errors)
- `Invalid Google Cloud Code Assist credentials` - GCP auth expired
- `Unknown model: openai-codex/chatgpt-5.4` - wrong model IDs configured

**Phase 2: Timeout Cascade (March 9-15)**
- `LLM request timed out` - 600+ second timeouts (612+ errors)
- Workers stuck waiting for responses that never came
- `code plan not support model` - MiniMax high-speed models rejected

**Phase 3: Browser/File Failures (March 16-17)**
- X Pulse workers failing with `TimeoutError: locator.click: Timeout 8000ms exceeded`
- File writes failing: `queue/posted_log.md` and `worker_health.md` edits failed
- Delivery failures: summaries not posted to Discord

**Phase 4: Rate Limit Death (March 17 evening - March 18)**
- MiniMax hit rate limits → fell back to OpenAI Codex → also rate limited
- All 52 workers began failing
- User nuked all cron jobs

### Key Error Counts

```
5,930   rate_limit / FailoverError related
3,813    "API rate limit reached"
2,488    "FailoverError: API rate limit"  
  612    "FailoverError: LLM request timed out"
  302    "Unknown model: openai-codex/chatgpt-5.4"
  280    "code plan not support model" (MiniMax)
   98    "openrouter billing error - credits exhausted"
   34    "Invalid Google Cloud Code Assist credentials"
```

### Why Autonomy Stalled

1. **Isolated sessions = stateless** — Each cron job started fresh with no context continuity
2. **Memory indexing broken** — Only `main` agent indexed (468 chunks). codex/opencode had 0.
3. **Session sprawl** — 274+ session files, heavy reset/delete markers
4. **Sandbox disabled** — Full exec/fs access (security risk, not isolation)
5. **Provider instability** — No single reliable provider; all failed in sequence

### Upgrade Priorities

1. **Fix provider stability** - Need reliable primary + fallback that actually works
2. **Fix browser automation** - X Pulse workers can't interact with Twitter UI
3. **Fix file writes** - Queue/log files can't be written in isolated sessions
4. **Enable memory indexing** - All active agents need indexed memory
5. **Add heartbeat** - HEARTBEAT.md was empty; need proactive health checks
