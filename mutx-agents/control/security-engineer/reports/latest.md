## Lane utility verdict
- Status: THIN
- Recommendation: KEEP

## What changed in truth
I did a bounded fresh read of the live infra files today. The risk from yesterday is still real:
- `infrastructure/ansible/playbooks/provision.yml` still defaults `admin_cidr` to `0.0.0.0/0`, so the Ansible path can still open SSH to the world if an operator does not override it.
- `infrastructure/ansible/inventory.ini` and `docs/architecture/infrastructure.md` still document `StrictHostKeyChecking=no`.
- `infrastructure/scripts/generate-inventory.sh` has already moved to `StrictHostKeyChecking=accept-new`, which means the generated inventory is safer than the tracked inventory/docs.

Net: the repo still has split trust defaults across provisioning surfaces. Terraform fails closed; Ansible/docs still do not.

## Exact evidence
Checked today:
- `/Users/fortune/MUTX/infrastructure/ansible/playbooks/provision.yml`
- `/Users/fortune/MUTX/infrastructure/README.md`
- `/Users/fortune/MUTX/infrastructure/ansible/inventory.ini`
- `/Users/fortune/MUTX/docs/architecture/infrastructure.md`
- `/Users/fortune/MUTX/infrastructure/scripts/generate-inventory.sh`
- `/Users/fortune/MUTX/infrastructure/terraform/variables.tf`
- `/Users/fortune/.openclaw/workspace/mutx-agents/reports/roundtable.md`
- `/Users/fortune/.openclaw/workspace/mutx-agents/control/security-engineer/queue/TODAY.md`
- `/Users/fortune/.openclaw/workspace/mutx-engineering-agents/mission-control-orchestrator/reports/latest.md`

## If idle or blocked, why exactly
Not blocked by tooling. The real constraint is stale tracked infra content: the repo already contains the safer inventory-generation path, but the human-facing inventory/docs and Ansible default still advertise weaker trust behavior.

## What Fortune can do with this today
Pick the baseline for first SSH contact: `accept-new` or an explicit `known_hosts` workflow. Then have the tracked Ansible/docs path match that baseline so there is one trust rule, not two.

## What should change in this lane next
1. Require explicit `ADMIN_CIDR` in Ansible provisioning, or at minimum reject `0.0.0.0/0` and `::/0`.
2. Replace `StrictHostKeyChecking=no` in tracked inventory/docs with `accept-new` or a managed `known_hosts` workflow.
3. Add a grep/lint guard so tracked infra files cannot reintroduce world-open admin SSH or disabled host-key checking.
4. Refresh `infrastructure/README.md` so it no longer describes Ansible provisioning as world-open by default.
