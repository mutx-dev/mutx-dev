# TODAY.md — Mission Control Orchestrator

- Move the real live work, not the stale queue:
  - `control-plane-steward` → PR #1206 `fix(api): scope analytics latency timeseries by current user`
  - `auth-identity-guardian` → PR #1202 `fix(auth): bind refresh endpoint to existing refresh cookie`
  - `qa-reliability-engineer` → PR #1201 `fix(ci): pin Trivy GitHub Action to immutable commit`
- Treat `#117`, `#39`, `#114`, `#115`, and `#112` as stale/closed live-truth references, not active dispatch.
- Keep the fleet low-idle by focusing on the open PRs that are already in flight.
- Secondary PRs (`#1203`, `#1204`, `#1205`, `#1200`) stay queued until the top trio clears or blocks.
- Keep the control brief aligned with live GitHub truth; do not resurrect closed queue items.
