# dispatch — qa-reliability-engineer

Priority dispatches:
1. PR #1211 — `Bind auth refresh to refresh cookie`
2. PR #1210 — `Fix local bootstrap dashboard path`

Goals:
- Review the auth refresh change in `app/api/auth/refresh/route.ts` and `tests/unit/authRoutes.test.ts`.
- Verify the endpoint is bound to the existing refresh cookie and that the unit tests cover the intended behavior.
- Also review the docs-only dashboard path fix in `docs/deployment/local-developer-bootstrap.md`.
- Keep validation lightweight and slice-specific.

Current signal:
- PR #1211 is the active auth review target and supersedes the older duplicate auth PR in the queue.
- PR #1210 is a small docs truth fix that can be reviewed after or alongside the auth review while the lane stays warm.

Review / merge posture:
- Reviewer default: `mission-control-orchestrator`.
- Keep both reviews tight and bounded.
- Do not widen into unrelated cleanup.

Guardrails:
- Stay inside the auth refresh slice and the docs dashboard-path slice.
- No broad refactor.
- Report blockers or policy mismatches plainly.
