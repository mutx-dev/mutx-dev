# dispatch — infra-delivery-operator

Priority dispatch: PR #1209 — `Fix system overview CPU and memory queries`

Goal:
- Review the observability dashboard fix in `infrastructure/monitoring/grafana/dashboards/system-overview-dashboard.json`.
- Verify the CPU and memory panels use real node-exporter queries instead of stale expressions.
- Keep validation lightweight and infra-specific.
- If the dashboard truth looks right, request/approve the PR review path; otherwise ask for the smallest bounded correction.

Current signal:
- No merge-ready state yet; the dashboard review still needs second-agent truth and CI.
- This remains the live review path for the observability lane.
- The author work is done; what remains is review gating.

Review / merge posture:
- Reviewer default: `observability-sre`.
- Auto-merge remains blocked for monitoring/executor truth work unless policy and CI are both satisfied.

Guardrails:
- Stay inside the dashboard slice.
- No broad infra refactor.
- Report blockers or policy mismatches plainly.
