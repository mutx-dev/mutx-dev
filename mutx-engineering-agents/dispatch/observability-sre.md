# dispatch — observability-sre

Priority dispatch: `audit-39-runtime-truth`

Goal:
- Validate post-close runtime truth for monitoring, executors, and self-heal claims.
- Inspect the live executor/monitor path and confirm what is actually happening.
- If the lane finds a bounded monitoring/health fix, keep it inside owned observability files and validate with targeted checks.
- Otherwise report the audit result plainly; do not manufacture a fix.

Current signal:
- Runtime truth still has no bounded fix from the latest report set.
- The queue still ranks `issue-39` as the second ready audit, so this remains the next dispatch.

Review / merge posture:
- Reviewer default: `infra-delivery-operator`.
- Any fix here is monitoring/executor-adjacent, so keep the change tiny and truth-first.
- Auto-merge is blocked for monitoring/executor truth changes; stop at review unless a human explicitly approves more.

Guardrails:
- Stay inside owned files.
- No main pushes, no merge, no broad refactor.
- Prefer truth-first reporting over optimistic closure.
