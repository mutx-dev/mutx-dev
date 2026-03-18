# MUTX Fleet Recovery - 2026-03-18 Recap

## What Happened

The MUTX fleet experienced a catastrophic rate limit cascade:
- 52 concurrent workers hammering APIs
- 9,377 errors logged in gateway.err.log
- MiniMax + OpenAI Codex both rate limited
- Everything died

**User took action:** Nuked all 52 cron jobs.

---

## What We Did (2026-03-18 ~18:30 UTC)

### 1. Created Minimal X Cron Jobs
**File:** `~/.openclaw/cron/jobs.json`

Reduced from 52 to **2 workers**:
- `mutx-pulse-poster` — 30 min intervals, max 1 retry
- `mutx-pulse-engagement` — 15 min intervals, max 1 retry

Both include rate limit backoff (5min) and state file handling.

### 2. Created X Worker State File
**File:** `~/.openclaw/workspace-x/worker_state.json` — NEW

Provides continuity for isolated cron sessions:
- Tracks last run times, actions, rate limit hits
- Schema for poster + engagement worker state

### 3. Updated Main SOUL.md
**File:** `~/.openclaw/workspace/SOUL.md`

Added discipline rules:
- "Ship clean, not fast"
- Max 3 concurrent workers per repo
- State-before-action mandate
- Rate limit protocol: log → back off → retry once → fail gracefully

Priority order:
1. Port mutx-control UI (TOP)
2. Re-enable X cron workers
3. Clear PR backlog

### 4. Updated AGENTS.md
**File:** `~/.openclaw/workspace/AGENTS.md`

Added:
- State-First Workflow section
- Critical state files table
- API Rate Limiting Protocol
- Max 3 workers rule

### 5. Updated Fleet Bible
**File:** `~/.openclaw/workspace/mutx-fleet-bible.md`

Reduced from 26 to **6 workers**:
- mutx-backend-worker (3 min cadence)
- mutx-frontend-worker (3 min cadence)
- mutx-ship-worker (2 min cadence)
- mutx-healer (5 min cadence)
- mutx-cleanup (2 hour cadence)
- X workers (separate config)

Added:
- UI Porting section (priority task)
- Failure recovery protocol
- Quality gates: rate limit hits = 0

### 6. Updated X Agent SOUL.md
**File:** `~/.openclaw/workspace-x/SOUL.md`

Added mandatory:
- State file protocol (read → check → do → update)
- Rate limit handling
- Worker state schema

### 7. Updated Fleet State
**File:** `~/.openclaw/workspace/mutx-fleet-state.md`

Documented:
- Restart status
- 13 PRs with merge conflicts (need healer)
- Lessons learned
- Immediate priorities

---

## Files Modified (7)

| File | Change |
|------|--------|
| `~/.openclaw/cron/jobs.json` | Reduced to 2 workers |
| `~/.openclaw/workspace-x/worker_state.json` | NEW - state continuity |
| `~/.openclaw/workspace/SOUL.md` | Discipline rules added |
| `~/.openclaw/workspace/AGENTS.md` | State-first workflow |
| `~/.openclaw/workspace/mutx-fleet-bible.md` | Reduced workers, UI priority |
| `~/.openclaw/workspace-x/SOUL.md` | State handling |
| `~/.openclaw/workspace/mutx-fleet-state.md` | Current status |

---

## Lessons Embedded in Config

1. **Parallelism ≠ Speed** — 52 workers killed rate limits
2. **State files are mandatory** — Isolated sessions need continuity
3. **Backoff protocol works** — Log → wait → retry once → fail gracefully
4. **Fewer workers, smarter work** — 3 good > 50 failing
5. **Ship clean** — One green PR > ten broken

---

## Next Steps (Not Yet Done)

1. [ ] Clone mutx-control repo
2. [ ] Start UI porting (first page)
3. [ ] Create MUTX repo workers (start with 1 backend + 1 frontend)
4. [ ] Create healer worker for PR conflicts
5. [ ] Monitor X workers for rate limits

---

## The Big Prompt (Next Message)

Below is the comprehensive master prompt to drive the UI porting mission with max velocity.
