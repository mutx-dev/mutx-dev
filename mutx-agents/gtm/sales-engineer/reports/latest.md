# Sales Engineer Brief — 2026-04-01 (9:20 AM Europe/Rome)

## Lane utility verdict
- **Status:** THIN
- **Recommendation:** KEEP

## What changed in truth
**One material new proof point since yesterday's cycle:**

1. **Webhook governance doc shipped — `docs/WEBHOOK-GOVERNANCE.md` (e4d779cb, April 1, 2026).** This is new technical content not yet in any prior sales brief. It establishes MUTX has production-grade webhook governance: HMAC-SHA256 signed payloads, idempotency keys, 5-attempt retry with exponential backoff and ±25% jitter, circuit breaker (opens at 5 consecutive failures, exposed via Prometheus metrics), and priority SLAs (Critical: 30s, High: 5min, Normal: 1hr, Low: 24hr). This is a concrete answer to "how does MUTX make agent-to-system calls survivable?" — a much stronger proof point than "it calls tools."

2. **Signal brief updated (2026-04-01 08:20 Europe/Rome) — Crittora is a P0 new competitor.** Crittora announced Feb 24, 2026 with the Agent Permission Protocol (APP), cryptographically enforced policy framework for the OpenClaw runtime. Crittora specifically positions as "making OpenClaw enterprise-ready." This is a direct competitor with a named protocol spec and public GitHub presence. Not yet in sales-brief.md competitive landscape — flagged below as P0 gap.

3. **Signal brief: 30 days to Microsoft Agent 365 GA (May 1, 2026).** $15/$99 pricing. The unsupervised autonomous agent governance gap is still unresolved — Microsoft has no licensing model for agents not running "on behalf of a user." This remains a concrete MUTX entry angle.

4. **Signal brief: multi-agent production failure rate 41–86%.** 14 documented root-cause failure modes. Silent failures confirmed as a named category. Error compounding confirmed at step 3 (~86% failure rate by step 3 in multi-agent pipelines). This number is now circulating widely.

5. **Signal brief: shadow agent problem.** Cross-organizational agent boundaries create discovery, identity, and permission auditing challenges across principals who don't share an IT stack. Emerging named problem with @SchellingProto positioning MUTX as the cross-plane governance layer.

**No change from prior run:** SSH hardening and gateway patch remain 48+ hours unaddressed. PR #1219 still stuck (34h → 48h+ now). PR #1230 lint fix in CI. No new commits to the MUTX codebase since the webhook governance doc landed.

## Exact evidence
- `docs/WEBHOOK-GOVERNANCE.md` (e4d779cb, 2026-04-01 01:01 UTC): new webhook governance proof point — retry policy, circuit breaker, HMAC signatures, idempotency, SLAs, escalation paths
- `git -C /Users/fortune/MUTX log --oneline --since="2026-03-31T14:00:00Z" --until="2026-04-01T07:20:00Z"`: only e4d779cb (webhook governance doc)
- `gtm/outside-in-intelligence/reports/signal-brief.md` @ 2026-04-01 08:20 Europe/Rome: Crittora P0 new competitor, Microsoft 30 days, failure rates, shadow agents
- `gtm/reports/roundtable.md` @ 2026-04-01 06:15 UTC: PR #1230 CI in progress, PR #1219 stuck 34h+, SSH/gateway 48h+ unaddressed
- `sales-brief.md` (this workspace): webhook governance added to demo spine (step 6) and proof matrix

## If idle or blocked, why exactly
Not blocked, but the lane is thin. The single new material asset (webhook governance) is a proof point addition, not a new positioning narrative. Crittora remains an unaddressed P0 competitive gap in the sales brief — but the instruction for this cycle was one demo/objection/proof improvement, and webhook governance is that improvement. The broader competitive update (Crittora + Sycamore teardown) is a larger piece of work that belongs in the next cycle or as a dedicated brief.

The SSH/gateway hardening gap is on Fortune's desk — it is not a sales-engineering lane issue.

## What Fortune can do with this today
1. **Use the webhook governance proof point in the next demo.** The 20-minute demo spine now has a new step 6 covering webhook governance. The concrete numbers (5 attempts, ±25% jitter, circuit breaker at 5 failures, HMAC-SHA256, priority SLAs) are verifiable and specific. This is the answer to "how is MUTX different from just letting an agent call tools?"

2. **Crittora competitive brief — P0 gap.** Crittora has a named protocol (APP), public GitHub spec, and OpenClaw-specific positioning. The sales brief does not mention them. Before any Saviynt-account outreach, Fortune needs: (a) is MUTX complementary to or competitive with Crittora on OpenClaw? (b) what does MUTX do that APP doesn't? This is the most urgent competitive question this week.

3. **Assign a second GitHub reviewer to PR #1219.** 48h+ stuck. `qa-reliability-engineer` cannot review. One action unblocks the merge.

4. **Call `accept-new` on SSH.** 48+ hours overdue. One word closes the exposure.

## What should change in this lane next
- **Crittora + APP competitive brief — P0.** Add to sales-brief.md competitive landscape. What does APP specify? What does MUTX do that APP doesn't? Is MUTX positioned to work alongside APP or against it? On OpenClaw specifically.
- **Sycamore Labs teardown — P1.** $65M seed, tiered fleet trust controls. Primary startup competitor with institutional backing (Coatue, Lightspeed, ex-OpenAI chief scientist).
- **30-day Microsoft clock.** MUTX proof stack needs to be positioned before May 1 GA. The unsupervised autonomous agent gap is the entry angle.
