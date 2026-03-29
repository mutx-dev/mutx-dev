## Lane utility verdict
- Status: BLOCKED
- Recommendation: REWIRE

## What changed since the last control pass
- The shared review and merge queues were empty on the last pass; they now reflect the live open PRs again so the control state is honest.
- Live GitHub checks changed too: Validation is now passing on PRs #1211, #1210, and #1209, but Container Image Scan is still failing on all three.
- No merge-ready PR exists; the bottleneck is still review identity, with check noise on top.

## Exact queue evidence
- Review queue:
  1. PR #1211 `Bind auth refresh to refresh cookie` -> `awaiting-review` (Validation passes; Container Image Scan failing; reviewer request unresolved)
  2. PR #1210 `Fix local bootstrap dashboard path` -> `awaiting-review` (docs-only; Validation passes; Container Image Scan failing; reviewer request unresolved)
  3. PR #1209 `Fix system overview CPU and memory queries` -> `blocked-reviewer-identity` (Validation passes; Container Image Scan failing; GitHub-resolvable second reviewer still needed)
- Merge queue: empty.
- Live PR evidence:
  - #1211 has the auth slice in review posture but no resolvable second reviewer attached.
  - #1210 is docs-only again, but review routing is still not clean and scan noise remains.
  - #1209 still cannot self-approve and needs a real GitHub reviewer path.

## Which lanes are producing signal vs idling
- Producing signal:
  - `qa-reliability-engineer` on #1211 and #1210 review routing.
  - `docs-drift-curator` because the split is complete and the docs-only PR is still the cleanest bounded slice.
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
- Resolve the reviewer-identity bottleneck on #1209 by assigning a GitHub-resolvable second reviewer or fixing the mapping.
- Leave the merge queue empty until there is a green reviewed PR.

### Control brief
- The fleet is still review-bound, not code-bound.
- The real bottleneck is approvals/review identity, plus noisy Container Image Scan failures.
- No merge-ready PR exists.
