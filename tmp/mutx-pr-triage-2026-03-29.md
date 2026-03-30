# MUTX open PR triage — 2026-03-29

Repo: `/Users/fortune/MUTX`

## Headline
- Open PRs triaged: **19**
- Classification counts: **3 patch-now**, **7 needs rebase**, **5 blocked**, **4 ignore for now**
- Verified shared trivial CI break on the newest PRs: **unused `Github` import in `app/download/macos/page.tsx`**
- Patched safely in isolated worktrees and pushed to the PR branches for **#1211, #1210, #1209**

## Triage table

| PR | Title | Merge state | Failing checks / truth source | Class |
| --- | --- | --- | --- | --- |
| 1211 | Bind auth refresh to refresh cookie | UNSTABLE / MERGEABLE | Validation — unused `Github` import in `app/download/macos/page.tsx` (verified in Actions log, patched, CI rerunning) | patch-now |
| 1210 | Fix local bootstrap dashboard path | UNSTABLE / MERGEABLE | Validation — same unused `Github` import (verified, patched, CI rerunning) | patch-now |
| 1209 | Fix system overview CPU and memory queries | UNSTABLE / MERGEABLE | Validation — same unused `Github` import (verified, patched, CI rerunning) | patch-now |
| 1206 | fix(api): scope analytics latency timeseries by current user | DIRTY / CONFLICTING | Validation — Python dependency resolution conflict (`langchain-core==1.2.11` vs `langchain 0.1.20`); CodeQL java/ruby/swift also failing | needs rebase |
| 1205 | Route /api/v1/leads through protected Next.js leads API | UNSTABLE / MERGEABLE | Validation — Ruff errors in `analytics.py`, `budgets.py`, `monitoring.py`; CodeQL java/ruby/swift also failing | blocked |
| 1204 | fix(desktop): restrict Electron external links to http(s) schemes | DIRTY / CONFLICTING | Validation — `black` would reformat `src/api/services/user_service.py`; Analyze java/ruby failing | needs rebase |
| 1203 | security: require explicit Grafana admin password in OTEL compose examples | BLOCKED / MERGEABLE | Validation — JS unit test failure in `tests/unit/versioning.test.ts`; Docker Compose, GitGuardian, and Analyze (ruby) also failing | blocked |
| 1202 | fix(auth): bind refresh endpoint to existing refresh cookie | BLOCKED / MERGEABLE | Validation — F821 undefined `AgentVersionHistoryResponse` / `AgentResponse` / `AgentRollbackRequest`; Analyze (ruby) also failing | blocked |
| 1201 | fix(ci): pin Trivy GitHub Action to immutable commit | UNSTABLE / MERGEABLE | Validation — same undefined `Agent*` schema names; Analyze (ruby) also failing | blocked |
| 1200 | fix(terraform): make public agent port exposure opt-in | DIRTY / CONFLICTING | Validation plus Ansible / Docker / Terraform validation suite failures | needs rebase |
| 1199 | Codex-generated pull request | DIRTY / CONFLICTING | Validation — duplicate/redefined imports in `src/api/routes/agents.py`; Analyze (ruby) failing; generic low-signal PR | ignore for now |
| 1198 | Harden installer by removing unverified CLI overlay fallback | DIRTY / CONFLICTING | Validation — `DeploymentVersion` undefined in `src/api/routes/deployments.py` | needs rebase |
| 1197 | fix: disable automatic Faramesh installer execution during setup | UNSTABLE / MERGEABLE | Validation — npm / lockfile / eslint peer conflict | blocked |
| 1196 | fix(desktop): remove renderer-exposed CLI command execution IPC | DIRTY / CONFLICTING | Validation — failing CLI contract test (`cli.commands.api_keys.CLIConfig` missing) | needs rebase |
| 1195 | fix: restrict governance supervision endpoints to internal users | DIRTY / CONFLICTING | Validation — npm ci / lockfile drift | needs rebase |
| 1194 | Harden installer by removing unverified CLI overlay fallback | DIRTY / CONFLICTING | Validation — same `DeploymentVersion` failure as #1198; older duplicate of newer PR | ignore for now |
| 1193 | fix: disable automatic Faramesh installer execution during setup | BLOCKED / MERGEABLE | Validation — same npm / peer dependency conflict as #1197; older duplicate of newer PR | ignore for now |
| 1192 | fix(desktop): remove renderer-exposed CLI command execution IPC | DIRTY / CONFLICTING | Validation — same failing CLI contract test as #1196; older duplicate of newer PR | ignore for now |
| 1191 | fix(governance): restrict credential broker endpoints to internal users | DIRTY / CONFLICTING | Validation — npm ci / lockfile drift across Next / eslint packages | needs rebase |

## Shared failure notes
- The reported newest-PR break was real: `Validation` failed on **#1211 / #1210 / #1209** because `Github` was imported but never used in `app/download/macos/page.tsx`.
- Other repeated failure families are **not** one-line patchwork:
  - stale/conflicting branches (`DIRTY / CONFLICTING`)
  - backend schema/lint drift (`#1201`, `#1202`, `#1205`)
  - lockfile / dependency drift (`#1191`, `#1195`, `#1197`, `#1193`)
  - older duplicates (`#1194`, `#1193`, `#1192`)

## Repairs completed
All repair work used isolated temp worktrees from pull refs. No history rewrite, no PRs closed.

1. **#1211** → branch `eng/auth-identity-guardian`
   - Commit: `35f9826c`
   - Change: removed unused `Github` icon from `lucide-react` import in `app/download/macos/page.tsx`
   - Narrow validation: `/Users/fortune/MUTX/node_modules/.bin/eslint --max-warnings=0 app/download/macos/page.tsx` ✅
   - Result: pushed, GitHub Actions rerunning

2. **#1210** → branch `eng/docs-local-bootstrap-dashboard-path`
   - Commit: `f352ec2e`
   - Change: same one-line import cleanup in `app/download/macos/page.tsx`
   - Narrow validation: `/Users/fortune/MUTX/node_modules/.bin/eslint --max-warnings=0 app/download/macos/page.tsx` ✅
   - Result: pushed, GitHub Actions rerunning

3. **#1209** → branch `fix/observability-system-overview-truth`
   - Commit: `1fc6808f`
   - Change: same one-line import cleanup in `app/download/macos/page.tsx`
   - Narrow validation: `/Users/fortune/MUTX/node_modules/.bin/eslint --max-warnings=0 app/download/macos/page.tsx` ✅
   - Result: pushed, GitHub Actions rerunning

## Recommended next move
1. Let the reruns on **#1211 / #1210 / #1209** settle.
2. Then attack the **merge-conflict bucket** (`#1206`, `#1204`, `#1200`, `#1198`, `#1196`, `#1195`, `#1191`) in descending business priority.
3. Ignore the clear older duplicates for now unless there is a reason to preserve both branches.
