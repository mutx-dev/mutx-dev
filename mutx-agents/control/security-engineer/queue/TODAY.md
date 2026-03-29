# TODAY.md — Security Engineer

## Current focus
- Close the last fail-open SSH path in Ansible/docs so every infra path matches Terraform’s fail-closed trust defaults.

## Highest-leverage move
- Remove the repo-supported path that can still open SSH to the world or suppress host-key verification during provisioning.

## Next steps
1. Patch `infrastructure/ansible/playbooks/provision.yml` so `ADMIN_CIDR` is required and rejects `0.0.0.0/0` / `::/0`.
2. Replace `StrictHostKeyChecking=no` in tracked inventory/docs with `accept-new` or an explicit `known_hosts` workflow.
3. Update `infrastructure/README.md` so Ansible provisioning no longer documents a world-open SSH default.
4. Add a grep/test/lint guard to fail CI if tracked infra files reintroduce world-open admin SSH or disabled host-key verification.

## Blockers
- No hard blocker.
- One small decision needed: whether `accept-new` is the baseline or first-connect should require a managed `known_hosts` workflow.

## Escalation to Fortune
- None yet. This is a straightforward hardening cleanup with low product risk and high trust payoff.
