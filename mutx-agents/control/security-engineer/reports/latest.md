# Security Engineer — Lane Report
**Control pass: 2026-03-30 07:15 UTC / 09:15 Europe/Rome**
**Previous pass: 2026-03-29 21:15 Europe/Rome**

---

## Lane utility verdict
- **Status: THIN**
- **Recommendation: KEEP**

The SSH fail-open risk is confirmed present, bounded, and fixable. The lane is ready to execute the moment Fortune makes the `accept-new` call. No new exposures introduced since the last pass. No blockers on this lane's side.

---

## What changed in truth
- Fleet engineering queues confirmed empty (PR #1218/lint fix landed, main clean at `433d2d14`).
- SSH gap unchanged — `provision.yml:10` still defaults `admin_cidr` to `0.0.0.0/0` and `inventory.ini:13` still has `StrictHostKeyChecking=no`.
- Gateway hardening patch still on Fortune's desk — no approve/decline across 4 passes.
- Issue #1187 still open, 7 days old, no owner.
- No new secret exposures, no new auth drift, no new tool risk surfaced in the idle window.

---

## Exact evidence
- `infrastructure/ansible/playbooks/provision.yml:10` — `admin_cidr: "{{ lookup('env', 'ADMIN_CIDR') | default('0.0.0.0/0', true) }}"` — **world-open SSH admin by default**
- `infrastructure/ansible/inventory.ini:13` — `ansible_ssh_common_args='-o StrictHostKeyChecking=no'` — **host-key verification suppressed**
- `gh pr list --state open` — 0 open PRs (confirmed via mission-control-orchestrator/latest.md)
- `gh issue list --state open` — issue #1187 only, 7 days old
- Roundtable @ 2026-03-30 08:10 Europe/Rome — SSH gap listed as cross-fleet priority #1, gateway patch as priority #2

---

## If idle or blocked, why exactly
**Not idle. Waiting on one Fortune decision to unblock execution.**

The SSH gap is a precise, two-line fix:
1. `provision.yml:10` — make `admin_cidr` required or reject `0.0.0.0/0`
2. `inventory.ini:13` — replace `StrictHostKeyChecking=no` with `StrictHostKeyChecking=accept-new`

These are tracked files. The fix is low-risk to product. The risk of leaving it open is: any provisioned machine with default settings accepts SSH from anywhere and skips host-key verification.

---

## What Fortune can do with this today
**One word unblocks the lane: `accept-new`.**

That is the entire decision. Once Fortune confirms:
- `accept-new` is the baseline for `StrictHostKeyChecking`
- `0.0.0.0/0` is rejected as an `ADMIN_CIDR` default

This lane patches both files, updates the README, and adds a grep guard in CI — same-day.

**Secondary decision:** Approve or decline the gateway hardening patch. If the operating model is single-operator/local-only, say it explicitly and this lane closes the gateway hardening question without the patch.

---

## What should change in this lane next
1. **Fortune makes the `accept-new` call** — unblocks all SSH hardening work.
2. Lane executes: patch provision.yml, patch inventory.ini, refresh README, add grep guard.
3. Gateway hardening: approve patch or name operating model.
4. Issue #1187: route or close.
