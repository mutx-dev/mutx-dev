## Lane utility verdict
- Status: BLOCKED
- Recommendation: REWIRE

## What changed since the last control pass
- Live queue truth tightened: PR #1211 and PR #1210 still point to `qa-reliability-engineer`, but GitHub is not resolving the reviewer request cleanly and validation is failing on both.
- PR #1210 remains docs-only after the split, so the scope blocker is gone; the current blocker is review identity plus red CI.
- PR #1209 still has the reviewer-identity problem and remains non-mergeable.
- No merge-ready PR exists right now.

## Exact queue evidence
- Review queue:
  1. PR #1211 `Bind auth refresh to refresh cookie` -> `awaiting-review` (GitHub reviewer request unresolved; validation failing)
  2. PR #1210 `Fix local bootstrap dashboard path` -> `awaiting-review` (docs-only, GitHub reviewer request unresolved; CI failing)
  3. PR #1209 `Fix system overview CPU and memory queries` -> `blocked-reviewer-identity`
- Merge queue: empty.
- Live PR evidence:
  - #1211 has auth review notes, but the required second reviewer is not resolved in GitHub and Validation is red.
  - #1210 is docs-only again, but Validation is red and the requested reviewer path is not resolving cleanly.
  - #1209 remains open with the reviewer identity problem unresolved.

## Which lanes are producing signal vs idling
- Producing signal:
  - `qa-reliability-engineer` on #1211 and #1210 routing, even though both are blocked by reviewer resolution / CI.
  - `docs-drift-curator` because the branch is now docs-only and the scope split is complete.
  - `infra-delivery-operator` because the monitoring truth review is explicit, even though the reviewer-identity blocker remains.
- Idling:
  - `auth-identity-guardian`
  - `observability-sre`
  - `control-plane-steward`
  - `operator-surface-builder`
  - `cli-sdk-contract-keeper`
  - `runtime-protocol-engineer`

## What Fortune can do with this today
- Fix the GitHub reviewer-resolution problem for #1211 and #1210 so the second-reviewer gate is real, not nominal.
- Keep `#1209` blocked until a GitHub-resolvable second reviewer exists.
- Leave the merge queue empty until there is a green reviewed PR.

### Control brief
- The fleet is still review-bound, not code-bound.
- The real bottleneck is approvals/review identity plus failing validation.
- No merge-ready PR exists.
