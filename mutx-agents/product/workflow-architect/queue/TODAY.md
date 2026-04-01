# Queue — 2026-04-01

## Next moves (in priority order)

### 1. Dispatch: SDK versions/rollback parity
**Owner:** cli-sdk-contract-keeper (or named SDK lane)
**Status:** SPEC-READY — awaiting Fortune approval (24+ hours)
**Bounded task:** Add `versions(deployment_id)` and `rollback(deployment_id, version)` to `sdk/mutx/deployments.py`, mirroring `GET /v1/deployments/{id}/versions` and `POST /v1/deployments/{id}/rollback` from the API docs. All other deployment operations already have SDK helpers — these two are the only missing ones.
**Rollback contract:** `POST /v1/deployments/{id}/rollback` accepts `{"version": "<version_id>"}` in the request body. The SDK method signature should be `rollback(deployment_id, version)` — one positional arg for the deployment ID, one for the version identifier.
**CI context:** PR #1230 (F401 lint fix on sdk init) is now CI GREEN and CONFLICTING — when it lands, `main` will be clean for F401, reducing risk on this dispatch.
**Decision needed:** Fortune approves dispatch OR confirms versions/rollback are intentionally deferred (flag `Supported: false | deferred` on those API routes with a date).

### 2. Draft: Deployment state/action matrix
**Owner:** workflow-architect
**Bounded task:** One table. Columns: Operation | Valid source states | Resulting state | API | SDK | CLI | Dashboard. Rows: create, scale, restart, logs, metrics, versions, rollback, kill.
**Source:** `docs/api/deployments.md` (lifecycle rules), `sdk/mutx/deployments.py` (SDK surface), `docs/cli.md` (CLI surface), `docs/surfaces.md` (dashboard surface).
**Output:** `reports/deployment-lifecycle-matrix.md` — canonical operator reference.
**Note:** Can run in parallel with dispatch #1. Not blocked.

### 3. Doc fix: CLI legacy command label
**Owner:** technical-writer or workflow-architect
**Bounded task:** In `docs/cli.md`, change the compatibility commands section intro from "The older flat commands remain available for compatibility" to something that explicitly names `mutx agent deploy` as legacy and directs operators to `mutx deployment create`. This is a one-line phrasing change, not a code change.
**Note:** The substance is correct. The phrasing just needs to be more explicit in the CLI help output itself.
