# dispatch — infra-delivery-operator

Priority dispatch: PR #1209 — `Fix system overview CPU and memory queries`

Goal:
- Review the observability dashboard fix in `infrastructure/monitoring/grafana/dashboards/system-overview-dashboard.json`.
- Verify the CPU and memory panels use real node-exporter queries instead of stale expressions.
- Keep validation lightweight and infra-specific.
- If the dashboard truth looks right, request/approve the PR review path; otherwise ask for the smallest bounded correction.

Current signal:
- PR #1209 has a fresh human review note confirming the direction is right, but the PR is still not merge-ready.
- The blocker is reviewer identity resolution: the designated reviewer cannot self-approve and the GitHub-resolvable reviewer path is still missing.

Review / merge posture:
- Reviewer default: `observability-sre`.
- Auto-merge remains blocked for monitoring/executor truth work unless policy and CI are both satisfied.
- Request a GitHub-resolvable second reviewer before treating this lane as green.

Guardrails:
- Stay inside the dashboard slice.
- No broad infra refactor.
- Report blockers or policy mismatches plainly.
