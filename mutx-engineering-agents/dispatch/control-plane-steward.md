# dispatch — control-plane-steward

Priority dispatch: PR #1206 — `fix(api): scope analytics latency timeseries by current user`

Goal:
- Review the active API PR in `src/api/routes/analytics.py`.
- Confirm the timeseries is scoped to the current user and does not leak cross-tenant metrics.
- Run the smallest targeted backend validation that proves the scope change is truthful.
- If the diff is good, leave review/approval; if not, request a bounded fix only.

Current signal:
- Live repo truth says the stale issue queue items are closed.
- This PR is the real bounded API work currently in flight, so it should replace the stale issue-based dispatch.

Review / merge posture:
- Reviewer default: `qa-reliability-engineer`.
- Keep the change small and verify only the affected analytics path.
- If it remains low-risk after review and CI is green, it may follow the normal low-risk lane; otherwise stop at review.

Guardrails:
- Stay inside owned API files and the PR's touched surface.
- No broad refactor.
- Report truth, not optimism.
