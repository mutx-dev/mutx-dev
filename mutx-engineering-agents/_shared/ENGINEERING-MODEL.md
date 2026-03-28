# Engineering Fleet — Shared Operating Model

## Core rules
- One orchestrator plans and dispatches work.
- Specialists own bounded file areas and do not overlap without an explicit handoff.
- Every code-writing agent opens a branch and pull request instead of pushing to `main`.
- Every PR requires a second agent reviewer plus CI before merge.
- Low-risk lanes can auto-merge after review; risky lanes stop at staging or require human approval.

## Shared engineering rules
- Trust code over docs when they disagree.
- Prefer the smallest correct change.
- Treat route drift as a bug.
- Do not use `npm run lint` as a required gate until ESLint is repaired.
- Use `npm run build`, Python checks, targeted pytest, and targeted Playwright or infra validation as the real gates.
- If API contracts change, update dependent surfaces in the same workstream or open linked tasks immediately.

## Browser / Chrome orchestration
- Browser work is orchestrator-owned and slot-based.
- Every engineering agent has a staggered Chrome job.
- Engineering agents do not overlap Chrome jobs.
- Mission Control dispatches or suppresses browser work in those windows.
- Browser work is for verification and bounded UI tasks, not idle activity.
- See `_shared/CHROME-JOBS.md` for the slot model.
