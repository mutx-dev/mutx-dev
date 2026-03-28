# dispatch — observability-sre

Priority dispatch: `audit-39-runtime-truth`

Goal:
- Validate post-close runtime truth for monitoring, executors, and self-heal claims.
- Inspect the live executor/monitor path and confirm what is actually happening.
- If the lane finds a bounded monitoring/health fix, keep it inside owned observability files and validate with targeted checks.
- Otherwise report the audit result plainly; do not manufacture a fix.

Current signal:
- There is still no bounded runtime-truth fix from the latest report set, so this remains the audit lane to run next.

Guardrails:
- Stay inside owned files.
- No main pushes, no merge, no broad refactor.
- Prefer truth-first reporting over optimistic closure.
