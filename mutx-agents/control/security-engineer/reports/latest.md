# latest.md — Security Engineer

## Security brief — 2026-03-28

**Highest-leverage risk:** the Ansible provisioning path still fails open on SSH even though Terraform now fails closed.

### What I verified
- `infrastructure/ansible/playbooks/provision.yml:10-16` defaults `ADMIN_CIDR` to `0.0.0.0/0` and uses it for the SSH UFW allow rule.
- `infrastructure/README.md:53-61` still documents `ADMIN_CIDR` as optional with a world-open default.
- `infrastructure/ansible/inventory.ini:11-13` and `docs/architecture/infrastructure.md:123-125` still disable SSH host verification with `StrictHostKeyChecking=no`.
- `infrastructure/terraform/variables.tf:96-106` already rejects `0.0.0.0/0` and `::/0`, so the repo currently has conflicting trust defaults across provisioning paths.
- `infrastructure/scripts/generate-inventory.sh:37-39` already moved to `StrictHostKeyChecking=accept-new`, which confirms the tracked inventory/docs are stale.

### Why this matters
A rushed operator can still follow the Ansible path or stale docs and end up with publicly reachable SSH plus no host-key verification during first access. That is a real day-0 trust failure, not security theater.

### Recommended move
Close the remaining Ansible/docs gap so every infra path fails closed by default:
1. require an explicit `ADMIN_CIDR` for Ansible provisioning and reject `0.0.0.0/0` / `::/0`
2. replace `StrictHostKeyChecking=no` with `accept-new` or a managed `known_hosts` workflow
3. add a lightweight CI/lint guard that flags world-open admin SSH and disabled host-key verification in tracked infra files

### Lane call
Do not spend time on broad hardening churn first. Fix the fail-open SSH path, because it is simple, concrete, and directly tied to operator trust.
