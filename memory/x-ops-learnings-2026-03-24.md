# X Operations — Full Learnings (2026-03-24 Consolidation)

**Source:** Consolidated from session histories, worker_state.json, posted_log.md, HEARTBEAT.md, skills
**Status:** Complete picture of X ops, fleet state, and MUTX strategy

---

## What We Were Doing Wrong (The Volume Spiral)

From session logs and post-mortems:

1. **Too many posts** — Original posts fired constantly, no caps, no quality gates
2. **Thread abandonment** — Starting threads without finishing them, losing context between sessions
3. **No engagement hygiene** — Liking follow-for-follow, low-quality follows, no targeting
4. **Workers unchecked** — Cron workers running without supervision, posting without review
5. **No draft discipline** — Posting same draft twice (Repo Update 14 was posted twice on 2026-03-24)

The symptoms were visible: follower-to-engagement ratio was poor, quality score dropped, feed looked like spam.

---

## The New X Architecture

### Quality Gates (Enforced)

| Action | Cap | Rule |
|--------|-----|------|
| Original posts | 2/week | Hard cap. When reached → reply-only mode until Monday reset |
| Quote-RTs | 7/week | Must be >200 followers AND >30 views |
| Replies | Unlimited | Must be >50K followers OR >20 engagement |
| Likes | No cap | Must be verified account OR in-lane content |

### Timing Rules

- **50-minute rule** — Minimum 50 minutes between original posts
- **Preferred windows (Rome time):** 07:00-09:00, 12:00-14:00, 17:00-19:00
- **Dead window:** 23:00-07:00 Rome — no original posts
- **Week reset:** Monday 00:00 UTC — all caps reset

### Reply Method (Critical)

⚠️ **The X web UI "+" button for threads is broken** — it does NOT work reliably in automation.

**Correct method:** Reply to your own tweet to continue a thread. Not the "+" button. Reply to the last tweet in your thread.

### Browser Quirks (documented in browser-use-mutx skill)

1. **Keystroke dropping** — Type via `type` action into aria-label textbox, not raw keystrokes
2. **Click textbox before typing** — X requires focus first or input is silently dropped
3. **More button localization** — Handles `⋯` (English), `More` (may vary), `更多` (Chinese)
4. **URL redirects** — X changes URLs after navigation; re-snapshot after navigate
5. **Anti-bot detection** — Prefer `type` over pasting, add small delays
6. **Post detection** — Wait for "Your post was sent" alert before considering action done

---

## What Works on @mutxdev

### Best Performing Posts (from posted_log.md)

| Post | Author | Type | Views |
|------|--------|------|-------|
| Reply to noahzweben | @noahzweben (verified) | Reply | 617 |
| Quote-RT ZackKorman | @ZackKorman | Quote-RT | 409 |
| Pinned manifesto | @mutxdev | Original | 225 |

### The Winning Angles

1. **Governance as differentiator** — "The model is a commodity. Governance is the differentiation."
2. **Runtime vs principle** — "Governance that holds at runtime, not just in principle"
3. **Enterprise voice** — "3am" → "production" repositioning. Operators, not developers.
4. **The honest framing** — "Most hosted control planes claim they can see everything. The honest ones tell you when they can't."

### Target Accounts (from target-accounts.md)

**P1 Verified (actively engage):**
- @noahzweben — agent infrastructure
- @siddontang — observability, TiDB
- @prefactordev — dev velocity
- @Ryan_Singer — product thinking
- @thealpha_ai (Vishnu) — Enterprise Intelligence Control Plane, governance lane
- @joshalbrecht — CTO Imbue, Claude Code at scale
- @Saboo_Shubham_ — Senior AI PM @Google, OpenClaw content

**Skip:**
- Political profiles
- Controversial/divisive accounts
- Generic "AI influencers" not in MUTX's governance/infra lane

---

## X Worker Architecture

### Worker Files (workspace-x/)

```
workspace-x/
├── worker_state.json       # Continuity, weekly metrics, quality score, last actions
├── queue/
│   ├── posts_ready.md      # Draft queue — status (READY/POSTED/EXPIRED), scores, grounded commits
│   ├── execution.log       # Error log for heartbeat health checks
│   ├── posted_log.md       # Full history of all posts, likes, follows
│   └── follow_candidates.md # Follow-back tracking
├── docs/
│   ├── AUTONOMOUS_ARCHITECTURE.md  # Quality-gated autonomous worker design
│   ├── controller_model.md
│   └── recurring_x_cycle.md
└── skills/                  # X-specific skills
```

### Skills Built

| Skill | Location | Purpose |
|-------|----------|---------|
| `browser-use-mutx` | `skills/public/browser-use-mutx/` | X posting workflow, browser quirks, thread method |
| `mutx-x-content` | `skills/public/mutx-x-content/` | Voice guide, best posts, quality gates, target accounts |

---

## Current X Status (as of 2026-03-24)

```json
{
  "healthStatus": "RUNNING",
  "qualityScore": 78,
  "mode": "reply-only until 2026-03-30",
  "week_resets": "2026-03-30",
  "weeklyMetrics": {
    "originals_posted": 0, "originals_limit": 2,
    "quote_rts_posted": 1, "quote_rts_limit": 7,
    "replies_posted": 6,
    "likes_given": 12,
    "followers_gained_this_week": 3,
    "estimated_views": 4200,
    "engagement_rate": 0.042
  }
}
```

### Quality Thresholds (from worker_state.json)

```json
{
  "reply_min_followers": 50000,
  "reply_min_engagements": 50,
  "original_cap_per_week": 2,
  "quote_rt_cap_per_week": 7,
  "quality_score_alert_threshold": 60
}
```

### Health Alert Rules

- qualityScore < 60 → DEGRADED (reduce frequency)
- qualityScore < 40 → BLOCKED (pause all posting, urgent alert)
- No engagement logged in 24+ hours during active hours → flag
- Browser CDP unreachable → BLOCKED

---

## MUTX Fleet State (2026-03-24)

**Fleet Health:** 🟡 RECOVERING

### Active Cron Jobs (12-role company)

**Active 15-minute company jobs:**
- MUTX CEO, CTO, CFO, CRO v1
- MUTX PR Healer v2, Shipper v2, PR Opener v1
- MUTX Auditor, Self-Healer, Researcher v1
- MUTX UI Reminder 30m

**Delivery mode:** `delivery.mode=none` for all company roles (no false-red Discord delivery failures)

### Executor Lanes

| Lane | Status | Notes |
|------|--------|-------|
| UI Executor | ✅ ACTIVE | 4+ direct-to-main commits shipped (identity reset, dashboard chrome, canonical routing) |
| Backend Executor | ❌ DISABLED | 7x timeout errors, quarantined. Needs: absolute workspace paths + one clean pass |

### Top Priority Issues (autonomy:ready)

1. **#117** — Deployment surface parity drift (API done, CLI/SDK/docs need coverage)
2. **#39** — Wire monitoring/self-healing into runtime (blocked-executor)
3. **#114** — Make MutxAsyncClient truthful or deprecate it
4. **#115** — Fix bootstrap scripts after Docker Compose relocation
5. **#112** — Enforce queue health + Codex review handoff in autonomy tooling

### Last Meaningful Main Commit
`b47d82c8` — `ui: truthify dashboard data contracts` — 2026-03-19

---

## Key Decisions Logged

| Date | Decision | Reason |
|------|----------|--------|
| 2026-03-18 | Nuked 52 workers | Rate limit cascade, 9,377 errors |
| 2026-03-18 | Max 3 workers/repo | Stop cascade, regain discipline |
| 2026-03-24 | Quality gates on X | Stop volume spiral, protect quality score |
| 2026-03-24 | 2 originals/week cap | Ensure each original is deliberate |
| 2026-03-24 | reply-only mode until Mon | Week's originals already used (or 0 remaining) |
| 2026-03-24 | HEARTBEAT.md updated | Proactive X health monitoring |

---

## Files to Read Each Session

```
~/.openclaw/workspace/
├── mutx-fleet-state.md     # Fleet health + active jobs
├── autonomy-queue.json      # Work queue + priorities
├── memory/YYYY-MM-DD.md    # Today's session log
└── MEMORY.md               # Long-term memory (main session only)

~/.openclaw/workspace-x/
├── worker_state.json        # X agent continuity
├── queue/
│   ├── posts_ready.md       # Draft queue + status
│   ├── posted_log.md         # Full engagement history
│   └── execution.log        # Error log
└── docs/AUTONOMOUS_ARCHITECTURE.md  # X worker design
```
