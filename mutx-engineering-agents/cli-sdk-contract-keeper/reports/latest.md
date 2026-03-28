# latest.md

## Parity / Drift Report

- Workspace and dedicated worktree inspected.
- No `dispatch/cli-sdk-contract-keeper.md` file exists in the workspace, so there is no active dispatch artifact to execute against.
- Worktree `/Users/fortune/mutx-worktrees/engineering/cli-sdk-contract-keeper` is clean on branch `eng/cli-sdk-contract-keeper`.
- Reviewed the owned CLI/SDK surfaces against the live backend deployment contract:
  - backend docs confirm `/v1/deployments` as the canonical create path and keep `/v1/agents/{agent_id}/deploy` as a legacy lightweight route
  - SDK deployment resources already point at `/v1/deployments` and expose the legacy agent-scoped helper separately
  - CLI deployment commands are split across `deploy` and `deployment`, but I did not isolate a tiny, unambiguous contract fix without widening into broader parity work
- No code change was made in this pass.

## Next Moves

1. Wait for an explicit dispatch, or
2. Narrow to one small owned-area parity target and open a task branch before editing, or
3. If the intent is broader deployment/async contract cleanup, treat it as a scoped PR rather than a quick drift patch.
