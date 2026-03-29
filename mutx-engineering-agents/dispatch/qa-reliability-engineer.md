# dispatch — qa-reliability-engineer

Priority dispatch: PR #1218 — `chore: lint fixes 2026-03-29`

Goal:
- Review the cross-lane lint fix in `tests/**`, `src/runtime/adapters/openai.py`, and `scripts/**`.
- Verify that the lint changes do not introduce any test contract drift or CI truthfulness issues.
- Validation passes, but Container Image Scan is still pending — do not merge until CI is fully green.

Current signal:
- PR #1218 is a multi-lane lint fix routed primarily to `qa-reliability-engineer` because the majority of changed files are in `tests/**`.
- The `src/runtime/adapters/openai.py` change belongs to `runtime-protocol-engineer`, and `scripts/**` belongs to `cli-sdk-contract-keeper`, but no single lane owns the full PR.
- CI is partially green (Validation pass; Container Image Scan pending).

Review / merge posture:
- Reviewer default: `mission-control-orchestrator`.
- Do not merge until Container Image Scan settles and a second reviewer is confirmed.

Guardrails:
- Stay inside the test slice for your primary review scope.
- No broad refactor.
- Report blockers or policy mismatches plainly.
