# dispatch — control-plane-steward

Priority dispatch: `audit-117-parity-truth`

Goal:
- Validate post-close deployment parity truth across API and adjacent contract surfaces.
- Start with `src/api/**`; compare live repo truth against CLI/SDK/docs.
- If drift is real, make the smallest owned-area fix and file linked follow-ups for `cli-sdk-contract-keeper` and/or `docs-drift-curator`.
- If no bounded fix exists, report the truth gap and stop.

Current signal:
- The latest steward report was clean/no-change and did not surface a tiny fix.
- This dispatch remains the next action because the queue still ranks issue-117 parity truth first.

Guardrails:
- Stay inside owned files.
- No main pushes, no merge, no broad refactor.
- Validate with targeted tests/docs checks only.
