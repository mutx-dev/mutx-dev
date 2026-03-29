# dispatch — qa-reliability-engineer

Priority dispatches:
1. PR #1211 — `Bind auth refresh to refresh cookie`
2. PR #1210 — `Fix local bootstrap dashboard path` (blocked: split required)

Goals:
- Review the auth refresh change in `app/api/auth/refresh/route.ts` and `tests/unit/authRoutes.test.ts`.
- Verify the endpoint is bound to the existing refresh cookie and that the unit tests cover the intended behavior.
- For PR #1210, hold review until the author splits out the unrelated `agents/registry.yml` change; the current PR is not review-clean.

Current signal:
- PR #1211 is still the active auth review target.
- PR #1210 is not merge-ready as a mixed-scope PR; it needs a split before QA can complete a truthful review.

Review / merge posture:
- Reviewer default: `mission-control-orchestrator`.
- Keep the auth review tight and bounded.
- Do not approve PR #1210 until the cross-owner change is removed or explained and CI is green.

Guardrails:
- Stay inside the auth refresh slice.
- No broad refactor.
- Report blockers or policy mismatches plainly.
