# dispatch — qa-reliability-engineer

Priority dispatch: PR #1202 — `fix(auth): bind refresh endpoint to existing refresh cookie`

Goal:
- Review the auth refresh change in `app/api/auth/refresh/route.ts` and `tests/unit/authRoutes.test.ts`.
- Verify the endpoint is bound to the existing refresh cookie and that the unit tests cover the intended behavior.
- Keep validation lightweight and auth-specific.
- Leave approval if the patch is sound; otherwise request the smallest bounded correction.

Current signal:
- The auth lane now needs the reviewer’s eyes more than the CI-workflow PR.
- PR #1201 stays queued as secondary until this review path clears.

Review / merge posture:
- Reviewer default: `mission-control-orchestrator`.
- This is a bounded security/auth review; keep the scope tight.
- Do not widen into unrelated auth cleanup.

Guardrails:
- Stay inside the auth refresh slice.
- No broad refactor.
- Report blockers or policy mismatches plainly.
