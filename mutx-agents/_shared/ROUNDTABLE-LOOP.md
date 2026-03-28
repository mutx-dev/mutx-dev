# MUTX Roundtable Loop

## Purpose
Run an async no-human roundtable across control, product, build, GTM, and reporting without making every lane reread the whole world.

## Loop order
1. `outside-in-intelligence` refreshes `gtm/outside-in-intelligence/reports/signal-brief.md`.
2. Specialists read `BOOTSTRAP.md` plus only the smallest extra shared brief they need.
3. Each specialist leaves one bounded move in local `reports/latest.md` and `queue/TODAY.md`.
4. `project-shepherd` synthesizes cross-lane state into `mutx-agents/reports/roundtable.md` and its local `lane-scorecard.md`.
5. `report-distribution-agent` compiles the daily executive brief from the roundtable + freshest lane reports.
6. The next lane cycles read `mutx-agents/reports/roundtable.md` instead of rereading every lane report.

## Efficiency rules
- One bounded move per run.
- Decisions > narration.
- Read the smallest extra context that can produce a real move.
- If nothing material changed, exit with `NO_REPLY`.
- Keep shared files short and current.

## Shared-file ownership
- `mutx-agents/reports/roundtable.md` -> Project Shepherd owns refresh.
- `reporting/report-distribution-agent/reports/daily-brief.md` -> Report Distribution owns refresh.
- `gtm/outside-in-intelligence/reports/signal-brief.md` -> Outside-In owns refresh.

## Escalate only when
- revenue or pipeline motion is blocked
- gateway / memory / ACP trust is degraded
- a cross-lane owner is unclear
- a real decision cannot be made from local truth
