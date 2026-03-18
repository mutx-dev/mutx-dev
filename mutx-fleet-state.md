# MUTX Fleet State

**Updated:** 2026-03-18 18:30 UTC
**Status:** RESTARTING - Fresh start after rate limit cascade

---

## Fleet Health: 🔄 RESTARTING (Disciplined)

### What Happened (2026-03-18)
- 52 workers were hammering APIs → rate limit cascade
- 9,377 errors logged in gateway.err.log
- User nuked all cron jobs
- **New rule: Max 3 concurrent workers per repo**

### Current Cron Jobs (3 workers)
| Job | Agent | Cadence | Status |
|-----|-------|---------|--------|
| mutx-pulse-poster | x | 30 min | ⏳ Pending restart |
| mutx-pulse-engagement | x | 15 min | ⏳ Pending restart |
| mutx-ui-porting | opencode + minimax-m2.7 | 30 min | 🟢 Running (just triggered) |

### New Discipline
- State files before/after every action
- Rate limit protocol: log → back off 5min → retry once → fail cleanly
- Max 1 retry on failures
- State files: `worker_state.json`, `mutx-fleet-state.md`, `autonomy-queue.json`

---

## PRIORITY WORK (2026-03-18)

### 1. Port mutx-control UI + v2.0.1 Features (TOP PRIORITY)
- **Source:** https://github.com/mutx-dev/mutx-control/ (synced to builderz-labs v2.0.1)
- **Target:** Our frontend in https://github.com/mutx-dev/mutx-dev
- **Worktree:** ~/mutx-worktrees/factory/ship (on pr-1154 branch)
- **Progress:** 10 components ported (Phase 2 complete, including nav rail), Phase 3+4 in progress
- **v2.0.1 pulled:** GNAP sync engine, task-dispatch, i18n messages (10 langs)
- **sessions/ dropped** — OpenClaw-specific deps not compatible with MUTX stack
- **Stub modules added:** logger, command, openclaw-gateway, event-bus
- **Note:** i18n messages present but next-intl not yet set up in MUTX frontend

### 2. Clear PR Backlog
- 13 PRs labeled "merge-ready" but ALL blocked by conflicts
- Healer needs to resolve conflicts before new PRs
- 5 UNSTABLE PRs waiting on CI (#1173, #1072, #1042, #1037, #1036)

### 3. Re-enable Minimal Workers
- X cron: 2 workers (poster + engagement) - JUST CREATED
- MUTX repo: 3 workers max (backend, frontend, ship) - NOT YET CREATED

---

## Open PRs Status

| PR | Status | Action Needed |
|----|--------|---------------|
| #1173 | UNSTABLE (CI) | Wait |
| #1072 | UNSTABLE (CI) | Wait |
| #1042 | UNSTABLE (CI) | Wait |
| #1037 | UNSTABLE (CI) | Wait |
| #1036 | UNSTABLE (CI) | Wait |
| #1153 | DIRTY (conflicts) | Healer needs to fix |
| #1144 | DIRTY (conflicts) | Healer needs to fix |
| #1133 | DIRTY (conflicts) | Healer needs to fix |
| #1132 | DIRTY (conflicts) | Healer needs to fix |
| + 19 more | DIRTY | Healer priority |

---

## Bottlenecks

1. **Merge Conflicts:** 13 "merge-ready" PRs blocked by conflicts
   - **Fix:** Healer worker to resolve conflicts
2. **Rate Limits:** MiniMax + OpenAI Codex both hitting limits
   - **Fix:** Fewer workers, backoff protocol
3. **Memory Not Indexed:** Agents can't recall context
   - **Fix:** Index state files to memory

---

## Worker State (X Workers)

**Location:** `~/.openclaw/workspace-x/worker_state.json`

```json
{
  "lastPosterRun": null,
  "lastEngagementRun": null,
  "rateLimitHits": 0,
  "lastRateLimit": null,
  "errors": [],
  "lastError": null
}
```

---

## TODO

### Immediate (Today)
- [x] Port first page of mutx-control UI (sidebar + stat-card done)
- [x] Pull mutx-control to builderz-labs v2.0.1 (synced origin/main)
- [x] Copy v2.0.1 GNAP sync, task-dispatch, i18n to ship worktree
- [x] Draft FACTORY-RESTART-PLAN.md with 3-job disciplined restart payloads
- [ ] Monitor UI porting worker progress (currently failing - edit errors)
- [ ] Wire i18n framework (next-intl setup needed for messages to work)
- [ ] Restart X cron workers (monitor for rate limits)
- [ ] Create healer worker to fix PR conflicts
- [ ] Create 1 backend + 1 frontend worker (start with 2, not 6)

### This Week
- [ ] Port 3-5 pages of UI
- [ ] Clear PR conflict backlog
- [ ] Get CI green on all PRs
- [ ] Tune worker cadence based on rate limit response

---

## Lessons Learned (2026-03-18)

1. **Parallelism ≠ Speed** — 52 workers killed rate limits, nothing shipped
2. **State files are mandatory** — Isolated cron sessions need continuity
3. **Backoff protocol works** — Log → wait → retry once → fail gracefully
4. **Fewer workers, smarter work** — 3 good workers > 50 failing ones
5. **Ship clean** — One green PR > ten broken ones

---

_Last major update: 2026-03-18 18:30 UTC (Fresh restart after fleet failure)_
