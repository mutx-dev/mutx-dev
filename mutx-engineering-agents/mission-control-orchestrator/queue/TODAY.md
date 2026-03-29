# TODAY.md — Mission Control Orchestrator

- Keep the review queue honest:
  - PR #1211 -> `qa-reliability-engineer` (awaiting-review; Validation passes, Container Image Scan failing)
  - PR #1210 -> `qa-reliability-engineer` (awaiting-review; docs-only, Validation passes, Container Image Scan failing)
  - PR #1209 -> `infra-delivery-operator` (blocked-reviewer-identity; Validation passes, Container Image Scan failing)
- Keep the merge queue empty; nothing is merge-ready.
- `docs-drift-curator` is back in a bounded docs-only review posture on #1210; keep the author lane idle until review returns.
- `control-plane-steward`, `auth-identity-guardian`, and `observability-sre` stay idle until their blockers clear.
- The bottleneck is still approvals/review identity plus failing Container Image Scan checks, not more code churn.
- Do not widen scope or merge anything until the blockers are removed.
