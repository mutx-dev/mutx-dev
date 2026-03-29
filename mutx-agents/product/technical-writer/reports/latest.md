# Docs brief — 2026-03-29

## Lane utility verdict
Status: STRONG
Recommendation: KEEP

## What changed in truth
I closed one real docs-truth gap around the dashboard surface: the repo docs no longer imply that every page under `app/dashboard/*` is stable/live. The docs now separate stable operator pages from preview/demo or redirect-backed pages.

## Exact evidence
Checked:
- `BOOTSTRAP.md`
- `mutx-agents/reports/roundtable.md`
- `mutx-engineering-agents/mission-control-orchestrator/reports/latest.md`
- `queue/TODAY.md`
- `reports/latest.md`
- `docs/overview.md`
- `docs/app-dashboard.md`
- `docs/surfaces.md`
- `docs/project-status.md`
- `app/dashboard/channels/page.tsx`
- `app/dashboard/skills/page.tsx`
- `app/dashboard/orchestration/page.tsx`
- `app/dashboard/memory/page.tsx`
- `app/dashboard/spawn/page.tsx`
- `app/dashboard/logs/page.tsx`
- `app/api/dashboard/overview/route.ts`
- `app/api/dashboard/*` route inventory via `find`
- `src/api/routes/deployments.py`
- `cli/services/deployments.py`
- `sdk/mutx/deployments.py`

Commands run:
- `rg -n "app/app|app shell|/dashboard|deployment|deployments" docs cli sdk -g '!**/node_modules/**'`
- `rg -n "dashboard/overview|api/dashboard/overview" app src docs -g '!**/node_modules/**'`
- `find app/api/dashboard -maxdepth 3 -type f | sort`
- `find app/dashboard -maxdepth 2 -type f | sort`

Files changed:
- `docs/overview.md`
- `docs/app-dashboard.md`

## If idle or blocked, why exactly
Not blocked. The lane had a real documentation drift issue, and it was small enough to fix directly without waiting on repo changes.

## What Fortune can do with this today
Treat `docs/overview.md` and `docs/app-dashboard.md` as the current truth when describing `/dashboard`: stable pages are distinct from preview/demo and redirect-backed pages.

## What should change in this lane next
1. Finish the deployment parity checklist across backend routes, `cli/services/deployments.py`, `sdk/mutx/deployments.py`, and `docs/api/deployments.md`.
2. Spot-check `docs/surfaces.md` and `docs/project-status.md` for any leftover blanket “supported dashboard” phrasing; only edit if they drift from the live/preview split.
3. Keep runtime monitoring/self-healing claims gated until issue-39 / PR #1183 is unblocked.
