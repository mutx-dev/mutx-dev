# TODAY.md — Mission Control Orchestrator

- Keep the review queue honest:
  - PR #1211 -> `qa-reliability-engineer` (awaiting-review; reviewer path unresolved, validation failing)
  - PR #1210 -> `qa-reliability-engineer` (awaiting-review; docs-only, but reviewer path unresolved and CI failing)
  - PR #1209 -> `infra-delivery-operator` (blocked-reviewer-identity; needs a GitHub-resolvable second reviewer)
- Keep the merge queue empty; nothing is merge-ready.
- `docs-drift-curator` stays bounded to the docs-only PR; the split blocker is gone, but validation is still red.
- `control-plane-steward`, `auth-identity-guardian`, and `observability-sre` stay idle until their blockers clear.
- The bottleneck is still approvals/review identity plus failing validation, not more code churn.
- Do not widen scope or merge anything until the blockers are removed.
