# dispatch — qa-reliability-engineer

Priority dispatch: PR #1201 — `fix(ci): pin Trivy GitHub Action to immutable commit`

Goal:
- Review the CI workflow change in `.github/workflows/ci.yml`.
- Verify the Trivy action pin is immutable and that the workflow still matches repo policy.
- Keep validation lightweight: workflow syntax, pin sanity, and any repo-local CI truth checks that fit the diff.
- Leave approval if the pin is sound; otherwise request a bounded correction.

Current signal:
- The stale issue queue entries are closed in live GitHub truth.
- This CI workflow PR is the active low-risk pipeline item that should keep the fleet moving.

Review / merge posture:
- Reviewer default: `mission-control-orchestrator`.
- This is a low-risk CI truth fix only if the workflow diff stays narrow and validation is clean.
- Do not widen scope into unrelated workflow cleanup.

Guardrails:
- Stay inside the workflow slice.
- No broad refactor.
- Report blockers or policy mismatches plainly.
