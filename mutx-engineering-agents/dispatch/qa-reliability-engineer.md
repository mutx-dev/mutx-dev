# dispatch — qa-reliability-engineer

Priority dispatches:
1. PR #1211 — `Bind auth refresh to refresh cookie`
2. PR #1210 — `Fix local bootstrap dashboard path` (docs-only, split complete)

Goals:
- Review the auth refresh change in `app/api/auth/refresh/route.ts` and `tests/unit/authRoutes.test.ts`.
- Verify the endpoint is bound to the existing refresh cookie and that the unit tests cover the intended behavior.
- Review the docs-only bootstrap path fix in `docs/deployment/local-developer-bootstrap.md` once CI is green enough to trust the diff.

Current signal:
- PR #1211 is still the active auth review target.
- PR #1210 is now docs-only again after the split; it is review-clean but still waiting on validation to settle.
- Do not reopen the split blocker unless the `agents/registry.yml` change reappears.

Review / merge posture:
- Reviewer default: `mission-control-orchestrator`.
- Keep the auth review tight and bounded.
- Keep #1210 review grounded in the docs slice and do not approve until CI is green.

Guardrails:
- Stay inside the auth refresh slice.
- No broad refactor.
- Report blockers or policy mismatches plainly.
