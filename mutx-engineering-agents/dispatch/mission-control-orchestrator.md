# dispatch — mission-control-orchestrator

Primary live source: `dispatch/action-queue.json`.

Use it like this:
- `needs-review-routing` → route a distinct GitHub reviewer before telling a lane to wait.
- `shared-ci-blocker` → feed one bounded CI-truth fix to `qa-reliability-engineer` instead of spreading the same blocker across many PRs.
- `needs-author-fix` → send the PR back to the owning lane.
- `merge-ready` → populate merge queue and land per policy.

Only fall back to ad-hoc dispatch when `action-queue.json` is empty.
