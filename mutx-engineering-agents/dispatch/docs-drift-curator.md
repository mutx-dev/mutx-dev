# dispatch — docs-drift-curator

Priority dispatch: PR #1210 — `Fix local bootstrap dashboard path` (split required)

Goal:
- Split the docs-only dashboard path fix from the unrelated `agents/registry.yml` change.
- Keep the docs fix in `docs/deployment/local-developer-bootstrap.md` and move the registry normalization into the correct owning lane.
- Once split, re-run the lightweight docs validation and hand back a clean docs-only PR for review.

Current signal:
- The current PR is mixed-scope and not review-clean.
- A reviewer already confirmed the docs change itself is correct, but the extra `agents/registry.yml` edit is outside docs-drift-curator ownership and CI is failing.

Review / merge posture:
- Reviewer default: `qa-reliability-engineer`.
- Do not seek approval until the PR is split and CI is green.

Guardrails:
- Stay inside the docs slice.
- No broad refactor.
- Report blockers plainly and keep the fix bounded.
