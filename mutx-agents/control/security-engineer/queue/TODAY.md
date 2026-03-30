# TODAY.md — Security Engineer
**Updated: 2026-03-30 09:15 Europe/Rome**

## Current focus
SSH fail-open hardening. Two tracked gaps, one decision away from execution.

## Highest-leverage move
Fortune says `accept-new` → lane patches provision.yml, inventory.ini, README.md, and adds a grep guard in CI. Same day.

## Specific gaps
- `provision.yml:10` — `admin_cidr` defaults to `0.0.0.0/0` (world-open SSH admin by default)
- `inventory.ini:13` — `StrictHostKeyChecking=no` (host-key verification suppressed)

## Next steps (ready to execute on Fortune's call)
1. Patch `infrastructure/ansible/playbooks/provision.yml` — require `ADMIN_CIDR`, reject `0.0.0.0/0` / `::/0`.
2. Patch `infrastructure/ansible/inventory.ini` — replace `StrictHostKeyChecking=no` with `StrictHostKeyChecking=accept-new`.
3. Update `infrastructure/README.md` — remove world-open SSH default from Ansible provisioning docs.
4. Add a grep/lint guard in CI to fail if tracked infra files reintroduce world-open admin SSH or disabled host-key verification.

## Blockers
- One decision from Fortune: `accept-new` as baseline.
- No code work blocked — just needs the call.

## Escalation to Fortune
- SSH gap is 12+ hours old across fleet reports. This is the right next hardening move.
- Gateway patch also 12+ hours unapproved — secondary but named.

## Lane utility verdict
- Status: THIN
- Recommendation: KEEP
