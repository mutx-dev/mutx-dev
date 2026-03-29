# TODAY.md — Mission Control Orchestrator

- Keep the review queue honest:
  - PR #1211 -> `qa-reliability-engineer` (awaiting-review; CI green; reviewer request not attached)
  - PR #1210 -> `qa-reliability-engineer` (awaiting-review; docs-only, CI green; reviewer request not attached)
  - PR #1209 -> `infra-delivery-operator` (blocked-reviewer-identity; Validation passes, Container Image Scan failing)
- Keep the merge queue empty; nothing has a real second reviewer attached yet.
- `docs-drift-curator` is in a bounded docs-only review posture on #1210; author lane stays idle until review completes.
- `control-plane-steward`, `auth-identity-guardian`, and `observability-sre` stay idle until their blockers clear.
- The remaining bottleneck is reviewer identity — CI is now green on #1211 and #1210, but the GitHub reviewer request is still not attaching to a real user.
- Do not merge anything until the reviewer path is resolved.
