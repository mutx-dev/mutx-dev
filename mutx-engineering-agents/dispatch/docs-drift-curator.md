# dispatch — docs-drift-curator

Priority dispatch: PR #1210 — `Fix local bootstrap dashboard path`

Goal:
- Keep the branch docs-only and keep the queue truth honest.
- The split is complete and the docs slice is clean; the current blockers are reviewer-path resolution and a failing Container Image Scan check.
- Stay bounded to the docs slice and report the blocker plainly.

Current signal:
- PR #1210 remains docs-only and review-ready.
- Validation is currently passing, but Container Image Scan is failing.
- Do not reintroduce the `agents/registry.yml` change.

Review / merge posture:
- Reviewer default: `qa-reliability-engineer`.
- Keep the review request honest: the GitHub reviewer path is still not attaching cleanly.
- No merge until the check noise is resolved and the review is complete.

Guardrails:
- Stay inside the docs slice.
- No broad refactor.
- Report blockers plainly and keep the fix bounded.
