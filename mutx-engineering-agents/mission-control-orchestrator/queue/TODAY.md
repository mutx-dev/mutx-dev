# TODAY.md — Mission Control Orchestrator

- Keep the review queue honest:
  - PR #1218 -> `qa-reliability-engineer` (awaiting-review; cross-lane lint fix, Validation passes, Container Image Scan pending)
- Keep the merge queue empty; nothing is merge-ready yet (CI not fully green on #1218).
- PR #1218 spans `tests/**`, `src/runtime/adapters/openai.py`, and `scripts/**` — no single lane owns it.
  - Primary reviewer: `qa-reliability-engineer` (test files dominate).
  - Side-band awareness: `runtime-protocol-engineer` and `cli-sdk-contract-keeper`.
- All other owned lanes (`auth-identity-guardian`, `observability-sre`, `docs-drift-curator`, `infra-delivery-operator`, `control-plane-steward`, `operator-surface-builder`) are idle.
- Do not widen scope or merge anything until CI is fully green and a second reviewer is confirmed.
