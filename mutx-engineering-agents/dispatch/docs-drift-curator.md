# dispatch — docs-drift-curator

Priority dispatch: PR #1210 — `Fix local bootstrap dashboard path`

Goal:
- Keep the branch docs-only and track validation truth.
- The split is complete, but GitHub still has not resolved the reviewer request for `qa-reliability-engineer`, and CI is red.
- Stay bounded to the docs slice and report the blocker plainly.

Current signal:
- PR #1210 is docs-only again, but it is not merge-ready.
- Validation is failing, and the requested reviewer path is not resolving cleanly in GitHub.
- Do not reintroduce the `agents/registry.yml` change.

Review / merge posture:
- Reviewer default: `qa-reliability-engineer`.
- Keep the review request honest: if the reviewer identity cannot be resolved, say that plainly.
- No merge until CI is green and review identity is clean.

Guardrails:
- Stay inside the docs slice.
- No broad refactor.
- Report blockers plainly and keep the fix bounded.
