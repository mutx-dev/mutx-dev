# Agent-to-Agent Loop

## Loop order
1. Mission Control inspects GitHub truth first: open PRs, review state, and CI state.
2. Mission Control normalizes that truth into local queue files:
   - `dispatch/action-queue.json`
   - `dispatch/review-queue.json`
   - `dispatch/merge-queue.json`
   - `dispatch/*.md` only when a lane needs extra bounded context
3. Specialists first check for review assignments in `review-queue.json`.
4. If there is no live review assignment, specialists check `action-queue.json` for PR/CI next actions assigned to their lane.
5. If assigned a review, they review before coding new work.
6. If assigned a coding task, they work on a dedicated branch in their dedicated worktree.
7. After validation they open or update a PR and request second-agent review.
8. Mission Control or the designated watcher merges safe green PRs and keeps risky PRs gated.

## Low-idle rule
If there is no review assignment and no `action-queue.json` item for your lane, exit quickly with no changes.
