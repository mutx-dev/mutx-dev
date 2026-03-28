# dispatch — infra-delivery-operator

Priority dispatch: `issue-115`

Goal:
- Fix local bootstrap scripts after Docker Compose relocation.
- Keep changes in `scripts/` and matching docs only.
- Make repo-root bootstrap point at `infrastructure/docker/docker-compose.yml` truthfully.
- Validate by checking script path resolution and compose references.

Current signal:
- The infra lane still points at the smallest ready delivery fix after the two audit lanes.
- The lane report says no actionable dispatch was present in that worktree, so this brief is the artifact that should move next.

Guardrails:
- Stay inside owned files.
- No main pushes, no merge, no broad refactor.
- Prefer the smallest correct change.
