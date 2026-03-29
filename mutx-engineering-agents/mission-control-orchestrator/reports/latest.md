## Lane utility verdict
- Status: BLOCKED
- Recommendation: REWIRE

## What changed since the last control pass
- PR #1211 is still awaiting `qa-reliability-engineer`, but the GitHub reviewer request could not be resolved and Validation is failing.
- PR #1210 is still awaiting `qa-reliability-engineer`; the docs-only split stayed clean, but the GitHub reviewer request could not be resolved, Validation is failing, and the Swift CodeQL job is still pending.
- PR #1209 still carries the reviewer-identity bottleneck; its checks are green, but it is not mergeable without a GitHub-resolvable second reviewer.
- No merge-ready PR exists right now.

## Exact queue evidence
- Review queue:
  1. PR #1211 `Bind auth refresh to refresh cookie` -> `awaiting-review` (`Validation` failing; reviewer request unresolved)
  2. PR #1210 `Fix local bootstrap dashboard path` -> `awaiting-review` (`docs-only`; `Validation` failing; `Analyze (swift)` pending; reviewer request unresolved)
  3. PR #1209 `Fix system overview CPU and memory queries` -> `blocked-reviewer-identity` (`checks green`; GitHub-resolvable second reviewer still needed)
- Merge queue: empty.
- Live PR evidence:
  - #1211 has a comment requesting `@qa-reliability-engineer`, but GitHub could not resolve that login as a reviewer, and the latest Validation run is red.
  - #1210 is docs-only again, but the same reviewer-resolution problem remains and CI is not green yet.
  - #1209 has no review decision, but its checks are now green; the bottleneck is still review identity, not validation.

## Which lanes are producing signal vs idling
- Producing signal:
  - `docs-drift-curator` because #1210 is back to docs-only.
  - `qa-reliability-engineer` routing is still the intended review lane for #1211 and #1210.
  - `observability-sre` because #1209 is green on checks but still blocked on reviewer identity.
- Idling:
  - `auth-identity-guardian`
  - `control-plane-steward`
  - `operator-surface-builder`
  - `cli-sdk-contract-keeper`
  - `runtime-protocol-engineer`
  - `infra-delivery-operator`

## What Fortune can do with this today
- Fix the GitHub reviewer mapping or permissions so `qa-reliability-engineer` and the monitoring reviewer can actually be requested on GitHub.
- Re-run validation / wait for #1211 and #1210 to turn green before any merge conversation.
- Keep the merge queue empty until there is a green reviewed PR.

### Control brief
- The fleet is still review-bound, not code-bound.
- The real bottleneck is approvals/review identity plus two red validation runs.
- No merge-ready PR exists.
