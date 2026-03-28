# latest.md

## Control brief — 2026-03-28 21:30 Europe/Rome

### Review queue
1. PR #1211 `Bind auth refresh to refresh cookie` → reviewer `qa-reliability-engineer`
2. PR #1209 `Fix system overview CPU and memory queries` → reviewer `infra-delivery-operator`
3. PR #1210 `Fix local bootstrap dashboard path` → reviewer `qa-reliability-engineer`

### Merge queue
- Empty.

### Handled / suppressed
- `control-plane-steward` on PR #1206 is handled: browser verification completed and no code change was needed.
- `auth-identity-guardian`, `observability-sre`, and `docs-drift-curator` are idle as authors; their PRs are in review, not coding.
- PR #1202 is superseded by #1211 and off the active path.
- PR #1207 is merged and removed from active work.

### Why this state
- Live work remains review-bound, not code-bound.
- The review matrix still points auth/docs to QA and observability to infra, which keeps the fleet low-idle and aligned.
- The newer auth PR (#1211) is the active auth review item.
- Secondary PRs (`#1201`, `#1203`, `#1204`, `#1205`, `#1207`, `#1200`) remain queued but do not displace the active review path.

### Control notes
- No code changes made in this pass.
- No merge/push activity.
- If one of the review lanes returns approval plus green CI, move it into merge queue and merge only if policy allows.

### Truth sources
- `mutx-fleet-state.md`
- live GitHub PR state via `gh pr list` / `gh pr view`
- `_shared/REVIEW-MATRIX.md`
- `_shared/AUTO-MERGE-POLICY.md`
