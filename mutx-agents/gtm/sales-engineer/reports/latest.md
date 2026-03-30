# Sales Engineer Brief — 2026-03-30 (3:20 PM Europe/Rome)

## Lane utility verdict
- **Status:** STRONG
- **Recommendation:** KEEP

## What changed in truth
Two material new competitive signals since the morning cycle (08:20):

1. **Baton — new named competitor in agent team control.** "A control plane for AI agent teams built around clean baton passes between planning, execution, review, and approval." Works with Claude Code, Codex, Gemini. Direct positioning against the same problem space as MUTX — agent coordination and governance. Differentiation: Baton uses phase-gate workflow routing; MUTX uses deterministic runtime path evaluation via Faramesh policies.

2. **Palantir Foundry Agent Service and Observability — now GA.** Enterprise incumbent shipping agent governance and observability as a platform feature. This both compresses MUTX's competitive window (enterprise buyers may default to Palantir) and legitimizes the category. The differentiation for MUTX is stack-agnosticism and operator-first UX vs. Palantir's enterprise platform requirement.

**Sustained from morning cycle:** "agent proposes, MUTX decides" positioning, multi-agent state conflict framing, IntentBound competitive profile, Gartner $58B governance framing, queue clear (repo idle since lint fix #1215 at ~09:00 UTC March 30).

## Exact evidence
- `gtm/outside-in-intelligence/reports/signal-brief.md` @ 2026-03-30 13:20 Europe/Rome: Baton competitor profile, Palantir Foundry GA, MUTX X posting active
- `gtm/reports/roundtable.md` @ 2026-03-30 08:10 Europe/Rome: queue clear, SSH + gateway hardening unaddressed
- `MUTX/docs/governance.md`: Faramesh runtime path evaluation, Unix socket enforcement, CLI commands
- `git -C /Users/fortune/MUTX log --oneline --since="2026-03-30T07:20:00Z"`: no new commits since lint fix #1215
- `sales-brief.md`: added competitive landscape table (IntentBound / Baton / Palantir), added objection handling for Baton and Palantir

## If idle or blocked, why exactly
Not blocked. Constraint remains editorial: translating new competitive signals (Baton, Palantir GA) into buyer-facing positioning while the product matures the multi-agent governance story. Repo is idle — no new product truth to incorporate.

## What Fortune can do with this today
1. **Know the three-competitor landscape before the next enterprise call** — IntentBound (institutional, patented), Baton (phase-gate coordination), Palantir (enterprise incumbent). Each requires a different objection response.
2. **Use "agent proposes, MUTX decides" as the default positioning line** — it survives comparison against all three because it describes the enforcement model, not the workflow pattern.
3. **If a buyer mentions Palantir** — immediately assess whether they are Palantir-committed or Palantir-curious. MUTX does not displace Palantir for committed shops; it is the accessible alternative for teams outside that stack.

## What should change in this lane next
- The 1-page sales enablement sheet (sharpened positioning + multi-agent framing + competitive comparison) is still outstanding — flag for Fortune's attention.
- Add a "competitive comparison card" for the three competitors to the deliverable shelf — one sentence per competitor differentiation.
- When multi-agent fleet management ships, update the POC success criteria to include fleet-wide arbitration and escalation path proof points.
