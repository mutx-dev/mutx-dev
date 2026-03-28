# dispatch — auth-identity-guardian

Priority dispatch: PR #1202 — `fix(auth): bind refresh endpoint to existing refresh cookie`

Goal:
- Review the active auth PR in `app/api/auth/refresh/route.ts` and `tests/unit/authRoutes.test.ts`.
- Confirm the refresh endpoint is bound to the existing refresh cookie and that the test coverage matches the intended behavior.
- Keep validation tight and auth-specific.
- If the PR is correct, approve; if not, request the smallest bounded correction.

Current signal:
- The auth patch is implemented and unit-tested.
- It now needs second-agent review and CI truth before it can move forward.

Review / merge posture:
- Reviewer default: `qa-reliability-engineer`.
- Auth changes are risky; do not auto-merge unless policy and CI are both satisfied and the change remains tiny.

Guardrails:
- Stay inside owned auth files and the test slice.
- No broad refactor.
- Treat security correctness as the priority.
