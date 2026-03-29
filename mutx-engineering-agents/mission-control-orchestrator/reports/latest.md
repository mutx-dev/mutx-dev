## Lane utility verdict
- Status: BLOCKED
- Recommendation: REWIRE

## What changed since the last control pass
- PR #1210 is split cleanly now: the current branch is docs-only again and the unrelated `agents/registry.yml` change is gone.
- Review queue truth changed again: #1210 moved from `blocked-split` to `awaiting-review`.
- Live GitHub checks still show pending validation on #1210 and #1211, while #1209 still carries the reviewer-identity bottleneck.
- No merge-ready PR exists right now.

## Exact queue evidence
- Review queue:
  1. PR #1211 `Bind auth refresh to refresh cookie` -> `awaiting-review`
  2. PR #1210 `Fix local bootstrap dashboard path` -> `awaiting-review` (`docs-only`, split complete, CI still pending)
  3. PR #1209 `Fix system overview CPU and memory queries` -> `blocked-reviewer-identity`
- Merge queue: empty.
- Live PR evidence:
  - #1211 has auth review notes but still no review decision.
  - #1210 now only touches `docs/deployment/local-developer-bootstrap.md`; the mixed-scope blocker is gone, but validation is still settling.
  - #1209 is still open with no review decision and the reviewer identity problem remains unresolved.

## Which lanes are producing signal vs idling
- Producing signal:
  - `qa-reliability-engineer` on #1211 and #1210 review routing.
  - `docs-drift-curator` because the split is complete and the docs-only PR is back in review posture.
  - `infra-delivery-operator` because the monitoring truth review is explicit, even though the reviewer-identity blocker remains.
- Idling:
  - `auth-identity-guardian`
  - `observability-sre`
  - `control-plane-steward`
  - `operator-surface-builder`
  - `cli-sdk-contract-keeper`
  - `runtime-protocol-engineer`

## What Fortune can do with this today
- Keep QA focused on #1211 and #1210; #1210 is now review-clean again.
- Resolve the reviewer-identity bottleneck on #1209 by assigning a GitHub-resolvable second reviewer or fixing the reviewer mapping.
- Leave the merge queue empty until there is a green reviewed PR.

### Control brief
- The fleet is still review-bound, not code-bound.
- The real bottleneck is approvals/review identity.
- No merge-ready PR exists.
