# MUTX FLEET BIBLE

**Mission:** Ship MUTX v0.2 (agent control plane) - methodically.

**Status:** 2026-03-18: Restarting fleet. Fewer workers. More discipline.

**Why fewer workers:** 52 workers → rate limit cascade → 9,377 errors → everything died. 
New rule: Max 3 concurrent workers per repo. Quality > parallelism.

---

## THE FLEET (6 Workers - Starting Small)

### Code Production (3 workers max per repo)
| Worker | Role | Cadence | Max Concurrent |
|--------|------|---------|----------------|
| mutx-backend-worker | Pick backend issues → PR | 3 min | 1 |
| mutx-frontend-worker | Pick frontend issues → PR | 3 min | 1 |
| mutx-ship-worker | Merge ready PRs | 2 min | 1 |

### Quality (handled inline)
| Worker | Role | Cadence | Notes |
|--------|------|---------|-------|
| (inline) | CI validates | per-PR | Don't add separate auditor |
| (inline) | Self-review | before push | Check your own code |

### Operations (minimal)
| Worker | Role | Cadence |
|--------|------|---------|
| mutx-healer | Fix conflicts on PRs | 5 min |
| mutx-cleanup | Delete merged branches | 2 hours |

### Growth (X - separate config)
| Worker | Role | Cadence |
|--------|------|---------|
| mutx-pulse-poster | Post to X | 30 min |
| mutx-pulse-engagement | Engage on X | 15 min |

---

## WORKFLOW

1. **Check state** → Read `mutx-fleet-state.md` and `autonomy-queue.json`
2. **Factory picks issue** → P0 > P1 > P2, creates PR
3. **Self-validate** → Run tests, check linting BEFORE push
4. **Ship** → Merge if CI green + no conflicts
5. **Healer** → Fix conflicts on stuck PRs
6. **Cleanup** → Delete merged branches

**Internal refactors:** Direct push, no PR needed.
**External changes:** PR, but keep minimal.

---

## RULES

- **Max 3 concurrent workers per repo** — non-negotiable
- **State before action** — Read state files first
- **Update state after** — Every action updates state files
- **Rate limit protocol** — Log, back off 5min, retry once, fail gracefully
- **Never skip a mergeable PR** — But only if CI is green
- **Pick by priority** — P0 > P1 > P2
- **Always validate** — Run tests/lint before push
- **ESCALATE** — If PR fails CI 3x, stop and report

---

## STATE FILES

| File | Purpose | Read/Write |
|------|---------|------------|
| `mutx-fleet-state.md` | Fleet health, active PRs | Every session |
| `autonomy-queue.json` | Work queue, priorities | Every session |
| `mutx-fleet-dashboard.md` | Live metrics | Periodic |
| `mutx-lessons-learned.md` | What works/doesn't | On lessons |
| `worker_state.json` (workspace-x) | X worker continuity | X sessions |

---

## UI PORTING (Priority Task)

**Source:** https://github.com/mutx-dev/mutx-control/ (approved by developer)
**Target:** https://github.com/mutx-dev/mutx-dev (our frontend)

### Strategy
1. Clone mutx-control repo
2. Copy `ui/` or `frontend/` directory structure
3. Adapt to our component library/data models
4. Wire to our API endpoints
5. Ship incrementally — one page at a time

### Progress Tracking
Update `mutx-fleet-state.md` with UI port status.

---

## QUALITY GATES

| Condition | Action |
|-----------|--------|
| CI green + no conflicts | Merge |
| CI red | Fix inline, max 3 retries |
| Conflicts | Route to healer |
| Rate limited | Back off, retry once |

---

## KEY METRICS

- Target: Ship v0.2 (agent control plane)
- Velocity: 10-15 PRs/week (start small)
- Success rate: >90%
- Merge time: <30 min
- Rate limit hits: 0 (back off before hitting)

---

## FAILURE RECOVERY

If workers fail:
1. Check `mutx-fleet-state.md` for error logs
2. Identify root cause (rate limit? conflict? bug?)
3. Fix the blocker
4. Restart affected workers
5. Update state

**Never:** Create more workers to compensate. Quality > quantity.

---

_2026-03-18: After 52 workers killed rate limits, we restart disciplined._
