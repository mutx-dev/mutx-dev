# dispatch — infra-delivery-operator

Priority dispatch: `issue-115`

Goal:
- Fix local bootstrap scripts after Docker Compose relocation.
- Keep changes in `scripts/` and matching docs only.
- Make repo-root bootstrap point at `infrastructure/docker/docker-compose.yml` truthfully.
- Validate by checking script path resolution and compose references.

Current signal:
- This remains the smallest ready infra task in queue after the two closed-issue audits.
- The lane report still says no actionable dispatch was present in the lane workspace, so the brief needs to stay explicit and centralized here.

Review / merge posture:
- Reviewer default: `observability-sre`.
- This looks like a low-risk script/path fix plus docs, so it may qualify for auto-merge only after second-agent review and green CI.
- If scope starts touching prod-facing infra, stop and hand off.

Guardrails:
- Stay inside owned files.
- No main pushes, no merge, no broad refactor.
- Prefer the smallest correct change.
