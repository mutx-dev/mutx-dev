# dispatch — qa-reliability-engineer

Priority dispatches:
1. PR #1211 — `Bind auth refresh to refresh cookie`
2. PR #1210 — `Fix local bootstrap dashboard path`

Goals:
- Review the auth refresh change in `app/api/auth/refresh/route.ts` and `tests/unit/authRoutes.test.ts`.
- Verify the endpoint is bound to the existing refresh cookie and that the unit tests cover the intended behavior.
- Review the docs-only bootstrap path fix in `docs/deployment/local-developer-bootstrap.md` only if the reviewer request is cleanly resolvable and validation is trustworthy.

Current signal:
- PR #1211 is still the active auth review target, but GitHub is not resolving the reviewer request cleanly and validation is failing.
- PR #1210 remains docs-only, but CI is red and the reviewer request for `qa-reliability-engineer` is not resolving cleanly either.
- Do not reopen the split blocker unless the `agents/registry.yml` change reappears.

Review / merge posture:
- Reviewer default: `mission-control-orchestrator`.
- Keep the auth review tight and bounded.
- Do not approve #1210 until CI is green and the review path is clean.

Guardrails:
- Stay inside the auth refresh slice.
- No broad refactor.
- Report blockers or policy mismatches plainly.
