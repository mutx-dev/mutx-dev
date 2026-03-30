# Sales Engineer Brief — 2026-03-30

## Lane utility verdict
- **Status:** STRONG
- **Recommendation:** KEEP

## What changed in truth
Three new signals since the last cycle sharpen the sales positioning materially:

1. **"Agent proposes, [control plane] decides"** — SurfitAI's articulation is the cleanest one-line summary of MUTX's architecture. The agent can hold credentials but cannot bypass the control plane. This is the exact enforcement posture MUTX claims. It belongs in every SE brief as the crispest positioning line.

2. **Multi-agent state conflict is a named operator problem.** Petrus: "One agent is a workflow. Five agents are an organization. The jump isn't technical — it's governance." State conflicts between agents, escalation paths, and arbitration are unsolved for most teams. This reframes the buyer conversation from single-agent control to multi-agent governance — a larger problem, a higher-stakes buyer, a wider budget conversation.

3. **IntentBound (IBA) is a funded, patented competitor.** Patent GB2603013.0, NIST/NCCoE filings, DeepMind arXiv endorsement, sub-5ms validation, GTC San Jose presence. Positioned as "The Authorization Layer for High-Stakes AI." This is not a blog — it is institutional positioning with legal backing. SE must know this name.

**Sustained from prior cycle:** Gartner governance framing ($58B shakeup, 50% deployment failure rate), runtime path evaluation as the permission model shift, queue clear (PRs #1211, #1210, #1209 all merged, lint fix #1215 merged March 30).

## Exact evidence
- `gtm/outside-in-intelligence/reports/signal-brief.md` @ 2026-03-30 08:20 Europe/Rome: Petrus multi-agent framing, SurfitAI positioning line, IntentBound competitive profile
- `gtm/reports/roundtable.md` @ 2026-03-30 08:10 Europe/Rome: queue clear, engineering idle, SSH + gateway hardening still unaddressed
- `MUTX/docs/governance.md`: Faramesh runtime path evaluation, `mutx governance status/decisions/pending/metrics/kill` CLI commands, Unix socket enforcement model
- `MUTX/docs/project-status.md`: dashboard vs. preview boundary, CLI-first approval posture, credential broker internal-only restriction (PRs #1191, #1195)
- `git -C /Users/fortune/MUTX log --oneline -15`: PRs #1215 (lint fix), #1212, #1191, #1200, #1202, #1195, #1197, #1201, #1203, #1204, #1205, #1209, #1210, #1211 — all merged; no open PRs on main
- `sales-brief.md`: updated positioning line ("agent proposes, MUTX decides"), multi-agent framing, IntentBound competitive note, demo spine step 5 sharpened with enforcement framing

## If idle or blocked, why exactly
Not blocked. Constraint is editorial: translating three sharp new signals into buyer-ready materials without overclaiming on multi-agent product maturity before it's shipped.

## What Fortune can do with this today
1. **Use "agent proposes, MUTX decides" in every enterprise conversation** — it is the cleanest 7-word summary of MUTX's architecture. Buyers who have felt the pain of agents ignoring governance layers will feel this immediately.
2. **Qualify the buyer problem as single-agent or multi-agent** — the demo spine now differentiates. Single-agent buyers get proof of runtime enforcement. Multi-agent buyers get the arbitration and escalation framing.
3. **Flag IntentBound mentions internally** — any enterprise buyer who shows up with IBA vocabulary already has a named alternative in mind. Know the competitive landscape before the second call.

## What should change in this lane next
- Package the sharpened positioning ("agent proposes, MUTX decides") + multi-agent framing into the 1-page sales enablement sheet — still outstanding from prior cycle.
- Add a multi-agent POC track to the POC success criteria once the fleet-management features are shipped (not yet — do not promise this).
- If Fortune approves, do a competitive depth pass on IntentBound's positioning, pricing signals, and buyer objections vs. MUTX.
