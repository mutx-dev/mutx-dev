# TODAY.md — Mission Control Orchestrator

- Keep the review queue honest:
  - PR #1211 → `qa-reliability-engineer` (awaiting review)
  - PR #1209 → `infra-delivery-operator` (blocked-reviewer-identity; needs a GitHub-resolvable second reviewer)
  - PR #1210 → `qa-reliability-engineer` (blocked-split; must separate `agents/registry.yml` from docs)
- Keep the merge queue empty; nothing is merge-ready.
- Treat `control-plane-steward` as handled and keep author lanes (`auth-identity-guardian`, `observability-sre`, `docs-drift-curator`) idle until blockers clear.
- The real bottleneck is approvals/review identity plus a mixed-scope docs PR that needs splitting.
- Do not widen scope or merge anything until the blockers are removed.
