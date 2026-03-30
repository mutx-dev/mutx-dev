# workflow-architect

## Lane utility verdict
- Status: STRONG
- Recommendation: KEEP

## What I actually did since the last meaningful checkpoint
- Ran a bounded fresh truth pass only: read `BOOTSTRAP.md`, `LANE.md`, `reports/latest.md`, and `queue/TODAY.md`.
- Checked the live backend route surface, SDK surface, docs, and CLI deployment surface.
- Did not change code or docs in this pass.

## Exact evidence
- `BOOTSTRAP.md`
- `LANE.md`
- `reports/latest.md`
- `queue/TODAY.md`
- `workflow-registry.md`
- `src/api/routes/deployments.py` — canonical lifecycle routes plus `versions` / `rollback` are live.
- `sdk/mutx/deployments.py` — has create/list/get/events/scale/restart/logs/metrics/delete; no `versions` or `rollback` helpers.
- `docs/api/deployments.md` — already labels `POST /v1/deployments` as canonical and `POST /v1/agents/{agent_id}/deploy` as legacy.
- `sdk.md` — deployment examples still stop at delete; no history/rollback surface.
- `cli/commands/deploy.py` and `cli/services/deployments.py` — CLI uses the canonical `/v1/deployments` path.
- Command run: `rg -n "v1/deployments|agents/.*/deploy|versions|rollback|deployments" -S /Users/fortune/MUTX`
- Command run: `find /Users/fortune/MUTX/cli -maxdepth 3 -iname '*deploy*' -type f | sort`

## What changed in truth
- Backend truth is clearer than the last note: the deployment API is already more complete than the SDK surface.
- The canonical create path is settled in backend/docs/CLI: `POST /v1/deployments` is the real operator path.
- The remaining contract gap is not create; it is history/rollback parity and explicit compatibility labeling for the legacy agent-scoped deploy route.

## If I was idle or blocked, why exactly
- Not blocked.
- The only constraint was scope: this pass was diagnosis-only, so I did not make a product change.

## What Fortune can do with this today
- Decide one thing: either require SDK `versions` / `rollback` parity now, or explicitly mark deployment history unsupported in SDK/docs until it ships.

## What should change in this lane next
- Write one deployment state/action matrix and use it everywhere.
- Mark `POST /v1/agents/{agent_id}/deploy` as compatibility-only in all helper surfaces.
- Add or explicitly defer SDK deployment history helpers so docs, CLI, and SDK answer the same operator questions.
