# dispatch — docs-drift-curator

Priority dispatch: PR #1210 — `Fix local bootstrap dashboard path` (docs-only, review-ready)

Goal:
- Review the docs-only dashboard path fix in `docs/deployment/local-developer-bootstrap.md`.
- Keep the PR scoped to docs only; the unrelated `agents/registry.yml` change has been split out.
- Re-run lightweight docs validation once CI settles and return a clean review result.

Current signal:
- The mixed-scope blocker is cleared.
- The current PR diff is docs-only again and awaiting `qa-reliability-engineer` review.
- CI is still pending, so the PR is not merge-ready.

Review / merge posture:
- Reviewer default: `qa-reliability-engineer`.
- Review is now the active next step.
- Do not merge until CI is green and review is complete.

Guardrails:
- Stay inside the docs slice.
- No broad refactor.
- Report blockers plainly and keep the fix bounded.
