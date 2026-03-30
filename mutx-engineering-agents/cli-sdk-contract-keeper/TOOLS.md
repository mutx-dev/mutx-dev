# TOOLS.md — CLI SDK Contract Keeper

## Primary paths
- Canonical repo: `/Users/fortune/MUTX`
- Dedicated worktree: `/Users/fortune/mutx-worktrees/engineering/cli-sdk-contract-keeper`
- Canonical source spec: `/Users/fortune/MUTX/agents/cli-sdk-contract-keeper/agent.md`
- Engineering workspace: `/Users/fortune/.openclaw/workspace/mutx-engineering-agents/cli-sdk-contract-keeper`

## Chrome slot
- Assigned browser slot: `35 8,12,16,20 * * *` Europe/Rome
- Browser work is dispatch-driven and Mission Control-owned.
- If no current browser-worthy task exists, exit quickly without changes.

## Operating rules
- Work from the dedicated worktree, not the dirty main repo.
- Before code changes, create or switch to a task branch in the worktree.
- Keep changes within owned files unless a handoff is explicit.
- Leave status in `reports/latest.md` and next moves in `queue/TODAY.md`.
- Use QMD/local memory before guessing.
