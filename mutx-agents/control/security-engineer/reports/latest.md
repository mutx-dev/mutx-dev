## Lane utility verdict
- Status: THIN
- Recommendation: KEEP

## What changed in truth
Fresh grep pass at 2026-03-29 15:15 Europe/Rome. The SSH fail-open risk is confirmed still present — files are unchanged from this morning:

```
provision.yml:10:  admin_cidr defaults to 0.0.0.0/0
inventory.ini:13:   StrictHostKeyChecking=no
docs/infrastructure.md:125: StrictHostKeyChecking=no
README.md:59:       ADMIN_CIDR defaults to 0.0.0.0/0
```

generate-inventory.sh still uses `accept-new`, confirming the generated inventory is safer than tracked docs. Nothing resolved itself.

Cross-lane update from roundtable: #1211 and #1210 are now CI-green (reviewer identity is the only remaining gate). This is good progress for the fleet but does not affect the security lane.

## Exact evidence
- `git -C /Users/fortune/MUTX diff HEAD~1 -- infrastructure/ansible/playbooks/provision.yml infrastructure/README.md infrastructure/ansible/inventory.ini docs/architecture/infrastructure.md` — no changes
- `grep -n "admin_cidr\|0\.0\.0\.0\|StrictHostKeyChecking"` on the four target files — risk lines unchanged
- `/Users/fortune/.openclaw/workspace/mutx-agents/reports/roundtable.md` @ 2026-03-29 14:10 Europe/Rome

## If idle or blocked, why exactly
Not blocked. The risk is concrete and the fix is a known pattern. Waiting on Fortune's call: `accept-new` vs explicit `known_hosts` as the baseline.

## What Fortune can do with this today
One decision, no code: pick `accept-new` or require a managed `known_hosts` workflow for first SSH contact. Then the lane can close the gap across all four files.

## What should change in this lane next
1. Require explicit `ADMIN_CIDR` in Ansible provisioning — reject `0.0.0.0/0` / `::/0`.
2. Replace `StrictHostKeyChecking=no` with `accept-new` (or managed `known_hosts`) in tracked inventory/docs.
3. Refresh `infrastructure/README.md` so it no longer describes Ansible provisioning as world-open by default.
4. Add a grep/lint guard to prevent regression.
