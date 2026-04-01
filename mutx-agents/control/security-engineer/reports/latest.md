# Security Engineer — Lane Report
**Control pass: 2026-04-01 07:15 UTC / 09:15 Europe/Rome**
**Previous pass: 2026-03-31 19:15 UTC / 21:15 Europe/Rome**

---

## Lane utility verdict
- **Status: THIN**
- **Recommendation: KEEP**

SSH fail-open is the one material risk in this lane. It has been open and named for 48+ hours. Nothing new has appeared that changes the calculus. Lane is ready to execute the moment Fortune calls `accept-new`.

---

## What changed in truth
- **SSH gaps still unpatched.** `provision.yml:10` still defaults `admin_cidr` to `0.0.0.0/0`. `inventory.ini:13` still has `StrictHostKeyChecking=no`. 48+ hours open.
- **PR #1219 (pygments 2.19.2 → 2.20.0): CI GREEN, still no reviewer assigned.** 34+ hours stalled. Dependabot-only — no new auth or secret risk in the diff. `uv.lock` updated, nothing else.
- **PR #1230: CI GREEN, still CONFLICTING.** `.github/workflows/autonomous-dispatch.yml` + `sdk/mutx/__init__.py` touched. No security signal — F401 lint fix.
- **PR #1229 (xmldom): CI still RED.** No security signal — dependabot dep bump, separate CI issue.
- **Issue #1187: still OPEN, no owner, no labels.** 9 days old. Noise at this point.
- **No new auth drift, no new secret exposures, no new tool risk.**

---

## Exact evidence
- `infrastructure/ansible/playbooks/provision.yml:10` — `admin_cidr: "{{ lookup('env', 'ADMIN_CIDR') | default('0.0.0.0/0', true) }}"` — **world-open SSH admin by default, confirmed via `git show HEAD:infrastructure/ansible/playbooks/provision.yml`**
- `infrastructure/ansible/inventory.ini:13` — `ansible_ssh_common_args='-o StrictHostKeyChecking=no'` — **host-key verification suppressed, confirmed via `git show HEAD:infrastructure/ansible/inventory.ini`**
- `gh pr view 1219 --json title,body,files,mergeable,reviewDecision` — pygments bump, CI GREEN, mergeable, reviewDecision empty, reviewRequests: `fortunexbt` only
- `gh pr view 1230 --json title,files,mergeable,mergeStateStatus` — F401 lint fix, CI GREEN, CONFLICTING
- `gh issue view 1187 --json title,state,labels,assignees,createdAt` — OPEN, no assignees, no labels, created 2026-03-23 (9 days ago)
- `gh run list --limit 3` — main branch CI GREEN as of 06:57 UTC today

---

## If idle or blocked, why exactly
**Blocked on Fortune's `accept-new` call — 48+ hours.**

This is not ambiguous:
- `provision.yml:10`: any machine provisioned with default settings accepts SSH admin from anywhere on the internet (`0.0.0.0/0`). That is the production provisioning default right now.
- `inventory.ini:13`: host-key verification is suppressed on every Ansible run, meaning MiTM risk on SSH is accepted by design.

This lane cannot patch without Fortune's explicit `accept-new` confirmation because it is a policy call on acceptable risk posture. The technical fix is ready. The decision has been on Fortune's desk for two days.

---

## What Fortune can do with this today
**One word unblocks the lane: `accept-new`.**

That single confirmation authorizes:
1. Patch `provision.yml` — reject `0.0.0.0/0` / `::/0` as `ADMIN_CIDR` defaults
2. Patch `inventory.ini` — replace `StrictHostKeyChecking=no` with `StrictHostKeyChecking=accept-new`
3. Update `infrastructure/README.md` — remove world-open SSH default from provisioning docs
4. Add a grep/lint guard in CI — fail if tracked infra files reintroduce these patterns

**Secondary:** Approve or decline the gateway hardening patch. If the operating model is single-operator/local-only, say it explicitly so the lane closes the question without the patch.

**PR #1219:** No security action required — routine dependabot dep bump. Will self-merge once `fortunexbt` approves. Not a security lane concern.

---

## What should change in this lane next
1. **Fortune calls `accept-new`** — unblocks all SSH hardening work immediately.
2. Lane executes same-day: patch both files, refresh README, add grep guard.
3. **After SSH lands:** name the next bounded hardening target — runtime health truth pass or secret/scope drift check.
4. Gateway hardening: approve patch or explicitly name single-operator operating model so the question closes.
5. Issue #1187: close it — 9 days old with no owner, no labels, and no evidence of a live security question.
