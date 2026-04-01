# Product Decision Brief — 2026-04-01 Morning

**Refreshed: 2026-04-01 09:36 Europe/Rome**
**Previous: 2026-03-31 19:35 Europe/Rome**

---

## Lane utility verdict
- **Status:** THIN
- **Recommendation:** KEEP (downshift idle work, focus on one new competitive dispatch)

---

## What changed in truth

**New since 2026-03-31 evening cycle:**

1. **Crittora is a P0 new competitor — specifically targeting OpenClaw.** Announced Feb 24, 2026. Agent Permission Protocol (APP) v2 with deterministic capability resolution. Cryptographically enforced policy framework. Positioning as "making OpenClaw enterprise-ready." GitHub protocol spec public. This is not a press release — it's a shipped product spec with OpenClaw integration. **This is the most urgent new competitive fact of the week.**

2. **PR #1230 CI is all-green.** Lint fix passing all checks. Remains in CONFLICTING state — merge conflicts must be resolved. This unblocks PR #1219 and PR #1229 once resolved.

3. **Microsoft Agent 365: 28 days to GA** (was 30). Clock is moving.

4. **main branch advanced** — `e4d779cb` (webhook governance doc) + `433d2d14` (33 lint errors resolved). The lint fix (`f3799eb2`) is on main. PR #1230 is merging against an already-fixed main, which may explain the conflict.

5. **PR #1219: still stuck.** MERGEABLE, CI GREEN, zero reviews. 34+ hours. `qa-reliability-engineer` cannot act as GitHub reviewer. Still needs a named GitHub identity.

6. **MUTX's ambient authority mechanism is named: Faramesh.** Governance.md confirms: MUTX integrates Faramesh (daemon, Unix socket `/tmp/faramesh.sock`) as the runtime enforcement engine. FPL (Faramesh Policy Language) policies evaluated at each tool call. Returns PERMIT/DENY/DEFER per call. This is the concrete mechanism — Crittora APP specifies what policies should look like; Faramesh actually evaluates them at runtime. This is MUTX's differentiation frame.

**Unchanged from prior:**
- Saviynt incumbent competitor with named design partners.
- Sycamore Labs $65M seed.
- SSH/gateway hardening still on Fortune's desk (72+ hours).
- `/dashboard` truth strip scope still awaiting Fortune's word.
- Issue #1187 still 10 days old, unowned.

---

## Exact evidence
- `gtm/outside-in-intelligence/reports/signal-brief.md` @ 2026-04-01 08:20 Europe/Rome — Crittora APP, APP v2, OpenClaw-specific, GitHub protocol spec.
- `reports/roundtable.md` @ 2026-04-01 06:15 Europe/Rome — PR #1230 CI green (CONFLICTING), PR #1219 stuck 34h.
- `gh pr view 1230 --repo mutx-dev/mutx-dev` — CONFLICTING, all CI checks SUCCESS @ 06:34–06:44 UTC.
- `gh pr view 1219 --repo mutx-dev/mutx-dev` — MERGEABLE, no reviews.
- `cd /Users/fortune/MUTX && git log --oneline -3` — `e4d779cb` webhook governance doc, `433d2d14` lint fix on main.
- `docs/governance.md` — Faramesh daemon, FPL policies, PERMIT/DENY/DEFER per tool call, Unix socket `/tmp/faramesh.sock`.
- `queue/TODAY.md` @ 2026-03-31 19:35 — prior queue items.

---

## If idle or blocked, why exactly
The product lane is THIN because the highest-leverage move — the Crittora APP differentiation brief — requires Fortune to confirm one thing: does MUTX implement or complement Crittora's APP? This is a positioning call, not an analysis call. The analysis is tractable; the positioning decision needs the operator.

Secondary blocker: `/dashboard` truth strip still awaiting Fortune's scope word. Has been waiting since at least March 29.

---

## What Fortune can do with this today

**One call, highest leverage — answer this question:**

> Crittora APP says: cryptographically verified capability resolution at execution time. MUTX+Faramesh says: deterministic FPL policy evaluation at each tool call. Are these complementary or competitive?

If MUTX implements APP → write the integration story.
If MUTX supersedes APP → write the differentiation story.
If MUTX is independent of APP → write the coexistence story.

This is a 30-minute conversation or a one-paragraph decision. Everything else in the competitive lane flows from it.

**Second, still on the desk:**
- `/dashboard` scope — one sentence unblocks the truth strip and social-media screenshots.
- PR #1219 second reviewer — still needs a GitHub identity. 34h and counting.
- SSH `accept-new` — still 72+ hours overdue.

---

## What should change in this lane next
1. **Crittora APP differentiation brief — P0.** Frame: APP is the spec, Faramesh is the runtime. MUTX makes APP-style enforcement operational in production multi-agent environments — or MUTX does something APP doesn't cover. The brief needs a positioning decision first, not more analysis.
2. **Agent 365 brief — P1, 28 days.** GA May 1. The unsupervised autonomous agent licensing gap is still unresolved by Microsoft. MUTX should have a named answer.
3. **Faramesh mechanism needs to be in the product story.** "Runtime deterministic governance" is concrete and differentiating. Faramesh daemon, FPL policies, PERMIT/DENY/DEFER per tool call — this is the mechanism that separates MUTX from protocol-spec competitors.
4. **Saviynt brief — still valid, still unstarted.** Named design partners (The Auto Club, Hertz, UKG). IAM extension vs. agent control plane — still needs Fortune's answer.
5. **Sycamore brief — valid but lower urgency.** $65M seed, no named design partners yet. Downshift until their cap table opens doors.

---

## Queue delta from prior cycle
| Item | Change |
|------|--------|
| Crittora APP differentiation | **NEW — P0** |
| Agent 365 brief | **UPVERTED** — 28 days (was 30), May 1 GA |
| `/dashboard` truth strip | **UNCHANGED** — still awaiting Fortune scope |
| Saviynt brief | **UNCHANGED** — P0, unstarted |
| Sycamore brief | **DOWNVERTED** — lower urgency than Crittora |
| PR #1230 conflicts | **MONITOR** — CI green, merge conflicts remain |
| PR #1219 reviewer | **UNCHANGED** — 34h stuck, Fortune's desk |
| Issue #1187 | **UNCHANGED** — 10 days, still routing needed |
