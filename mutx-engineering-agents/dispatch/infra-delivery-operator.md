# dispatch — infra-delivery-operator

Priority dispatch: `issue-115`

Goal:
- Fix local bootstrap scripts after Docker Compose relocation.
- Keep changes in `scripts/` and matching docs only.
- Make repo-root bootstrap point at `infrastructure/docker/docker-compose.yml` truthfully.
- Validate by checking script path resolution and compose references.

Current signal:
- The bootstrap drift is still real; this is the smallest ready infra task in queue after the two closed-issue audits.

Guardrails:
- Stay inside owned files.
- No main pushes, no merge, no broad refactor.
- Prefer the smallest correct change.
