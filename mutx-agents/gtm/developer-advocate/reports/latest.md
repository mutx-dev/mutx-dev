# latest.md — Developer Advocate

## Lane utility verdict
Status: STRONG
Recommendation: KEEP

## What changed in truth
Two material updates since the 10:00 AM run:

1. **Signal brief (13:20 refresh):** Market language sharpened on three points that sharpen the demo narrative:
   - "Can call this API" ≠ "authorized to execute this action class" — intent scope is the right permission unit, not tool lists
   - Sandbox is not the security boundary — the access model is
   - OpenClaw plugin approval hooks (March 28, 2026) are shipping now — approval gates are not future work

2. **MUTX docs updates (today):** Three commits since yesterday confirm canonical surface truth:
   - `5d99f5ad` — `/dashboard` is explicit in quickstart URLs, not just `/app` or root
   - `21b08f90` — local bootstrap docs now point to `/dashboard`, not `/app`
   - `454dc7a0` — dashboard stable pages confirmed: overview, auth, deployments, runs, agents, api-keys, webhooks. Preview/demo pages: channels, skills, orchestration, memory, spawn, logs

The walkthrough asset remains the right first move. The new signal gives it sharper buyer framing — the walkthrough demonstrates runtime state and event history, which is exactly the "action-class intent scope" and "who changed what" accountability story the market is now asking for.

## Exact evidence
- `git -C /Users/fortune/MUTX log --oneline -10` — checked at 16:00 Europe/Rome
- `git -C /Users/fortune/MUTX diff --stat HEAD~5..HEAD` — 6 files, 19 insertions, 6 deletions
- `git -C /Users/fortune/MUTX show 5d99f5ad -- docs/deployment/quickstart.md`
- `git -C /Users/fortune/MUTX show 21b08f90 -- docs/deployment/local-developer-bootstrap.md`
- `git -C /Users/fortune/MUTX show 454dc7a0 -- docs/app-dashboard.md`
- `gtm/outside-in-intelligence/reports/signal-brief.md` — refreshed 2026-03-29 13:20 Europe/Rome
- `mutx-agents/reports/roundtable.md` — refreshed 2026-03-29 14:10 Europe/Rome

## If idle or blocked, why exactly
Not blocked. The surfaces exist and the walkthrough path is clear. The hard constraint remains: some deployments expose no event history, so the pack needs a deployment with actual events, or that payload must be explicit as a fallback.

## What Fortune can do with this today
Approve the walkthrough asset with one sharpening addition: frame it as "runtime state + action accountability" not just "who changed what." The signal brief language does the heavy lifting — the walkthrough just needs to show the proof without overclaiming.

## What should change in this lane next
Turn the walkthrough into a screenshot/payload pack + 5-step demo script. Do not pull preview/demo surfaces (channels, skills, orchestration, memory, spawn, logs) into the story — they are explicitly unstable. Stick to the confirmed stable surfaces only.
