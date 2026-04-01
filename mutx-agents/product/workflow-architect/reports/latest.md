# Report — Workflow Architect
**Control pass: 2026-04-01 07:25 UTC (Europe/Rome: 09:25)**
**Previous pass: 2026-03-31 21:25 Europe/Rome**

---

## Lane utility verdict
- **Status: THIN**
- **Recommendation: KEEP** — bounded gap confirmed, dispatch spec tight, waiting on approval

## What changed in truth
- **`main` branch advanced** — `e4d779cb docs: add webhook governance document` (new commit since yesterday's `433d2d14`). No workflow impact; webhook docs are a separate surface.
- **PR #1230 CI now GREEN** — `fix/sdk-init-regexports` cleared validation on re-run (06:34 UTC). Still **CONFLICTING** mergeable state. Conflict resolution is the remaining gate before this can land.
- **PR #1219 now 34+ hours stuck** — CI GREEN, mergeable, CLEAN state, but `fortunexbt` is the only requested reviewer and has not acted. `qa-reliability-engineer` cannot fulfill the GitHub reviewer identity requirement.
- **SSH hardening still unaddressed** — now 48+ hours on Fortune's desk (`provision.yml:10` = `0.0.0.0/0`, `inventory.ini:13` = `StrictHostKeyChecking=no`).
- **No new commits to SDK surface** — `sdk/mutx/deployments.py` unchanged. `versions` and `rollback` still absent. The contract gap is unchanged and still the lane's highest-leverage move.

## Exact evidence
- `git log --oneline -3` @ 07:20 UTC: `e4d779cb docs: add webhook governance document` (new), `433d2d14 fix: resolve 33 lint errors` (yesterday)
- `gh pr view 1230`: CONFLICTING, CI GREEN, `fix/sdk-init-regexports` branch — still needs conflict resolution
- `gh pr view 1219`: MERGEABLE, CLEAN, no reviewDecision — `fortunexbt` only reviewer, ~34h stalled
- `gh pr view 1229`: MERGEABLE, BLOCKED (CI RED) — depends on CI re-run or fix
- `sdk/mutx/deployments.py` — confirmed: `create`, `create_for_agent`, `list`, `get`, `events`, `scale`, `restart`, `delete`, `logs`, `metrics`. **No `versions`. No `rollback`.** API routes exist in docs with curl examples.
- `docs/api/deployments.md` lines 19-20: `GET /v1/deployments/{deployment_id}/versions`, `POST /v1/deployments/{deployment_id}/rollback` documented
- Roundtable @ 2026-04-01 06:15 UTC: SSH/gateway 48+ hours, PR #1219 34h stuck, PR #1230 CONFLICTING but CI GREEN

## If idle or blocked, why exactly
**Not blocked.** The SDK gap is confirmed, bounded, and spec-ready. The dispatch question has been on Fortune's desk for 24+ hours. Waiting on one approval decision.

The only thing that changed materially is that PR #1230 (the lint fix) now has green CI — it could merge once conflicts are resolved. This is good news for the SDK dispatch: when `deployments.py` is next modified, the F401 lint issue will already be resolved on `main`, reducing the risk of the dispatch PR failing CI.

## What Fortune can do with this today
**One decision, unblocked:**
Approve or decline the SDK parity dispatch: add `versions(deployment_id)` and `rollback(deployment_id, version)` to `sdk/mutx/deployments.py`, mirroring the API routes. The rollback route accepts `{"version": "<version_id>"}` in the request body — method signature should reflect this. If deferred, explicitly flag `Supported: false | deferred` on those API routes so the contract is honest.

PR #1219 reviewer assignment is a separate action but directly blocks a merge. PR #1230 conflict resolution unblocks `cli-sdk-contract-keeper`.

## What should change in this lane next
1. **SDK parity dispatch** — Fortune approves or declines. This is the single highest-leverage move. Everything else in this lane is downstream.
2. **Deployment state/action matrix** — can run in parallel with the dispatch. One table: operation × valid source states × resulting state × surface coverage (API / SDK / CLI / Dashboard).
3. **CLI legacy label** — `mutx agent deploy` should read "legacy; use `mutx deployment create`" in `mutx --help` output. Phrasing fix only.
