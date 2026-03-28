# CI root-cause report: why merge lane is jammed (mutx-dev/mutx-dev)

_Date: 2026-03-18 (UTC observations from latest runs)_

## Scope and method
- Read required local context files first (`SOUL.md`, `USER.md`, `mutx-fleet-state.md`, `memory/2026-03-18.md`, `memory/2026-03-17.md`).
- Inspected current PR/check state and latest GitHub Actions runs via `gh` (read-only):
  - focus on `main`, PR `#1144`, `#1176`, UI-port branches (`factory/ui-porting`, `ui-port-clean`), plus newest healer-updated branch `#1133`.
- Preference given to current workflow evidence over memory notes.

## Repo-level truth (signal)

### 1) Merge queue is structurally blocked by branch hygiene, not just red tests
- Open PRs: **32 total**.
- Merge-state split: **26 DIRTY**, **2 BLOCKED**, **4 UNSTABLE**.
- So even green checks would not clear most PRs; mergeability is dominated by rebase/conflict debt.

### 2) `main` is not stably green on product CI
Recent `main` runs include failing `CI` validations:
- `23252765882` (`CI`, main) → `Validation` failed.
- `23250284977` (`CI`, main) → `Validation` failed.
- Autonomous orchestration workflows on `main` are green, but that is orthogonal to product correctness.

### 3) A repeated repo-wide CI failure family is format/lint gate failure
Representative failures:
- `23252765882` (main CI):
  - `Would reformat: src/api/main.py`
  - `Would reformat: ...3a8f2b1c4d6e_add_meta_data_to_agent_logs.py`
  - `Would reformat: ...f7e2a1c8d9b4_add_usage_events_table.py`
  - `Would reformat: src/api/services/monitoring.py`
- `23260793371` (`factory/ui-porting`): same “would reformat 4 files” pattern.

Interpretation: CI is failing on deterministic formatting drift in core files across multiple branches, including `main`.

### 4) Infra validation is noisy and frequently red for pre-existing baseline issues
On `#1144` and then `#1133`, infra checks fail with the same families:
- `Infrastructure CI` (`23260226682`) failures:
  - `Dockerfile Lint`, `Docker Compose`, `Ansible`
  - Ansible-lint: many FQCN/yaml/var-naming issues + module resolution errors (`docker_container`, `ansible.service`).
- `Infrastructure Validation` (`23260226697`) failures:
  - `Monitoring Config Validation`: command misuse (`prometheus: error: unexpected promtool`)
  - `Docker Validation`: hadolint pinning failures
  - `Terraform Validation`: invalid syntax in `modules/loadbalancer/main.tf` line 139 (`if var.redirect_http_to_https` block invalid)

These are large baseline/bucket failures, not narrow to a single feature PR.

## PR-level noise vs branch-specific truth

### #1144 (`fix/issue-1137-cli-shared-layer`) — branch-specific breakage + inherited infra baseline
Current evidence:
- `CI` failed (`23260228659`): branch-specific Ruff `E402` import-order violations in CLI files:
  - `cli/commands/agents.py:225`
  - `cli/commands/deploy.py:275`
- Same PR also receives infra failures that look baseline/systemic (Ansible/Terraform/Prometheus/Hadolint families above).

Net: #1144 has both **real branch-specific lint regressions** and **repo-level infra gate failures**.

### #1176 (`ui-port-clean`) — branch-specific TS compile error
`CI` run `23257384209`:
- Backend tests passed (`266 passed`), unit tests passed.
- Frontend build fails on TS import contract mismatch:
  - `./lib/task-dispatch.ts: Module './db' has no exported member 'getDatabase'`.

Net: clear branch-specific code issue; not systemic.

### #1177 (`factory/ui-porting`) — branch-specific formatting failure (same global family)
`CI` run `23260793371`:
- Fails at formatting gate (“4 files would be reformatted”).

Net: same global failure family manifests again; this one is easy to fix.

### #1133 (`fix/issue-969`) — currently showing inherited infra and DB-check failures
Checks show:
- failing: `Ansible`, `Docker Compose`, `Docker Validation`, `Dockerfile Lint`, `Monitoring Config Validation`, `Terraform Validation`, `Database Migration Check`.
- some checks still pending, but failed families align with baseline infra failures rather than isolated feature logic.

## Systemic failure families (ranked by impact)
1. **Mergeability debt (`DIRTY` PRs)**: 26/32 PRs unmergeable by status alone.
2. **Deterministic formatting gate failures** on Python files (hits `main` and PR branches).
3. **Infra validation baseline red** (Ansible lint policy mismatch, Terraform syntax error, Prometheus validation invocation issue, Dockerfile lint policies).
4. **Duplicate/parallel CI runs for same PR head** increase noise (multiple CI + CodeQL runs per PR update), obscuring actionable signal.
5. **Validation workflow mixes broad gates for all PR types**, causing small code changes to inherit unrelated infra failures.

## Bogus / misleading validation signals
- **Green autonomous control workflows on `main`** (`Autonomous Dispatch Runner`, `Autonomous Shipping Control Tower`) can appear healthy while `CI` for product code is failing.
- **Container Image Scan is often `skipped`**, yet appears in status context; little decision value but adds clutter.
- **CodeQL often green while merge still impossible** (`DIRTY`/`BLOCKED`), which can create false confidence.
- **Dual CI runs for same PR head** (seen on #1144/#1177/#1176 patterns) amplify red noise without improving decision quality.

## Throughput fixes in priority order

1. **Unblock mergeability first: enforce “rebase/clean” as a precondition before full CI**
   - Small policy change: run a lightweight “mergeability gate” first; if `DIRTY`, fail fast and skip expensive CI matrix.
   - Immediate gain: avoids burning CI minutes on 26 currently unmergeable PRs and clarifies owner action.

2. **Make formatting deterministic and auto-applied before CI**
   - Add pre-commit/autofix bot step (or required local script) so Black/Ruff format drift is corrected pre-push.
   - This removes recurring hard-fail class currently breaking `main` and UI-port branches.

3. **Split infra validation into scoped/path-aware required checks**
   - Only require infra jobs when `infrastructure/**` changes.
   - Keep full infra suite available but non-blocking for unrelated PRs.
   - Reduces false blockers for application/UI work while preserving infra quality gates where relevant.

4. **Fix baseline infra validator breakages once (single hygiene PR)**
   - Correct Prometheus validation command usage, Terraform syntax issue in loadbalancer module, and align ansible lint rules/module resolution.
   - One focused cleanup PR can retire multiple recurring red statuses.

5. **Deduplicate CI triggers/status contexts**
   - Ensure only one CI workflow instance per commit/PR event path (or cancel superseded runs aggressively).
   - Improves reviewer signal-to-noise and accelerates decision making.

## Single biggest unblocker
**The biggest unblocker is the mergeability debt itself: 26/32 PRs are `DIRTY`, so the lane is jammed before CI quality even matters.**
