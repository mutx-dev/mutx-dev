# PR Swamp Triage — mutx-dev/mutx-dev

Generated: 2026-03-18 (UTC)
Scope: **all 31 open PRs**
Method: `gh pr list/view` metadata + current fleet notes + merge-state/status checks.
Constraint respected: read-only (no merge/close/comment/push actions).

## Brutal Snapshot

- **MERGE-FIRST:** 0
- **HEAL:** 9
- **PARK:** 4
- **CLOSE:** 10
- **SUPERSEDED:** 8

Reality: there is no “easy merge” lane right now. The lane is blocked by conflict rot (`DIRTY`) and infra-check noise.

## Contradictions You Should Not Ignore

1. Several PRs are labeled `merge-ready` but are `DIRTY`/`BLOCKED` and not mergeable (e.g., #1153, #1132, #1103, #1088).
2. Some PRs have green Validation histories but still `DIRTY` (e.g., #1103, #1088, #640). CI status != mergeability.
3. Fleet state says #1177 is a current UI-port lane, while older UI PRs still linger and duplicate scope.

---

## Bucket: HEAL (fix conflicts / unblock checks, then decide)

| PR | Title | mergeStateStatus | Draft | Last update (UTC) | Key blocker | Recommendation |
|---|---|---|---|---|---|---|
| #1177 | ui: port mutx-control dashboard shell + empty states | UNSTABLE | no | 2026-03-18T18:36:41Z | Validation failing/in progress | Keep this as the active UI lane; rerun/repair CI now. |
| #1176 | feat(web): wire /app to use ported mutx-control UI components | DIRTY | no | 2026-03-18T17:14:25Z | Merge conflicts + failing Validation | Rebase once against latest main, then either fold into #1177 or keep only one UI branch. |
| #1153 | fix(ops): add Homebrew tap and formula for CLI distribution | DIRTY | no | 2026-03-18T02:24:41Z | Known unresolved conflicts (anthropic.py/tests) + cancelled Validation | Manual conflict surgery; if pass is clean, merge quickly; otherwise close. |
| #1144 | feat(cli): Extract shared CLI service/domain layer | BLOCKED | no | 2026-03-18T18:18:32Z | Infra checks red (Ansible/Docker/Terraform) + Validation red | Decide if infra failures are branch-caused or baseline-noise; fix only if this PR is still strategically needed. |
| #1133 | feat(ci): add database migration CI check (fixes #969) | BLOCKED | no | 2026-03-18T18:35:42Z | DB migration check + infra checks failing, checks still in progress | Finish current CI cycle, then either rebase/fix or kill if noise-only. |
| #1132 | fix(auth): enforce ownership on all agent endpoints | DIRTY | no | 2026-03-17T20:58:17Z | DIRTY + branch pollution reported by healer | Split/clean branch; do not merge polluted mega-diff. |
| #1096 | test(e2e): add Playwright tests for registration flow | DIRTY | no | 2026-03-17T18:58:00Z | Infra validation failures + conflicts | Salvage only if e2e coverage is still priority this week. |
| #1086 | feat(ops): add self-healing for common failure modes | DIRTY | no | 2026-03-17T18:56:49Z | Validation fail + stale conflicts | Rebase and run targeted checks; this is valuable ops scope if can be isolated. |
| #1084 | feat(runtime): add agent execution timeout enforcement | DIRTY | no | 2026-03-17T18:57:26Z | Validation fail + stale conflicts | Heal; high runtime value if diff is contained. |

---

## Bucket: PARK (not dead, but not now)

| PR | Title | mergeStateStatus | Draft | Last update (UTC) | Key blocker | Recommendation |
|---|---|---|---|---|---|---|
| #1173 | Fix redundant ErrorBoundary… | UNSTABLE | yes | 2026-03-18T04:17:24Z | Draft + broad mixed scope | Park until someone scopes/splits; don’t merge grab-bag PRs. |
| #1013 | test(api): add route tests for API key endpoints | UNSTABLE | yes | 2026-03-16T13:47:51Z | Draft/stale Copilot branch | Park unless route-test lane is revived. |
| #1011 | test(api): add route tests for webhook endpoints | UNSTABLE | yes | 2026-03-16T13:47:56Z | Draft/stale Copilot branch | Park; likely superseded by newer test work. |
| #640 | feat(runtime): add Anthropic adapter for Claude support | DIRTY | no | 2026-03-16T13:08:21Z | Very old, conflict-stale, unknown compatibility | Park as archaeology; revive only if roadmap demands Anthropic now. |

---

## Bucket: CLOSE (throughput kill-list)

| PR | Title | mergeStateStatus | Draft | Last update (UTC) | Key blocker | Recommendation |
|---|---|---|---|---|---|---|
| #1152 | fix: lint errors and formatting | DIRTY | no | 2026-03-18T00:02:49Z | Generic stale cleanup PR | Close; this is stale mechanical churn. |
| #1135 | [WIP] Add route tests for POST /deployments | DIRTY | no | 2026-03-18T02:35:55Z | WIP + stale conflicts + newer deployment testing streams | Close; reopen as focused fresh PR if still needed. |
| #1100 | fix(sdk): fix base URL default to match production API | DIRTY | no | 2026-03-17T18:57:42Z | Validation fail + conflict rot | Close and redo from clean main in <1 commit. |
| #1090 | feat(ci): add test coverage thresholds check (#956) | DIRTY | no | 2026-03-17T18:58:17Z | Coverage gate failures + stale conflicts | Close; policy change belongs in a fresh CI-only PR. |
| #1035 | feat(ops): add Grafana system overview dashboard | DIRTY | no | 2026-03-16T16:14:04Z | Old conflicts + validation red | Close; re-cut observability as modular dashboards later. |
| #1033 | feat(ops): add alerting rules for critical conditions | DIRTY | no | 2026-03-16T14:15:08Z | Validation/CodeQL red + old conflicts | Close; redo as small alert-rule slices. |
| #1031 | feat(metrics): OTel instrumentation phase 3+4 | DIRTY | no | 2026-03-16T14:03:22Z | Validation/CodeQL red + stale | Close and restart as phased PRs (metrics then tracing). |
| #1028 | fix: remove stale /v1 API prefix assumptions | DIRTY | no | 2026-03-16T13:41:01Z | Validation/CodeQL red + stale conflicts | Close; reapply minimal patch on fresh branch. |
| #994 | feat(api): add webhook signature verification endpoint | DIRTY | no | 2026-03-17T21:02:49Z | Conflict-stale and no decisive merge signal | Close; rebuild this feature cleanly with current webhook contracts. |
| #912 | fix(api): implement auth and ownership… | DIRTY | no | 2026-03-16T13:24:15Z | Very stale conflict branch despite old green validations | Close; superseded by newer auth ownership branch (#1132). |

---

## Bucket: SUPERSEDED (duplicate cluster losers)

| PR | Title | mergeStateStatus | Draft | Last update (UTC) | Key blocker | Recommendation |
|---|---|---|---|---|---|---|
| #1171 | fix: properly extract error message from waitlist API response | DIRTY | no | 2026-03-18T03:50:19Z | Duplicate intent | Superseded by #1154; close #1171. |
| #1154 | fix: display proper error message on waitlist form failure | DIRTY | no | 2026-03-18T00:09:54Z | Duplicate pair + conflicts | Keep whichever diff is cleaner; other one closes (prefer this over #1171). |
| #1159 | fix: add /logout route and sidebar logout button | DIRTY | no | 2026-03-18T02:24:34Z | Overlapped by broader UI port lane | Superseded by #1177/#1176 direction unless explicitly required standalone. |
| #1150 | docs: Update CLI docs for install/config/login/TUI/release | DIRTY | no | 2026-03-17T23:15:18Z | Docs duplicate cluster | Superseded by #1147; close this one. |
| #1147 | docs: update CLI docs for install/config/TUI/release | DIRTY | no | 2026-03-18T10:28:19Z | Docs duplicate cluster + conflicts | Keep one canonical docs PR (this one), close #1150 and likely #1146. |
| #1146 | docs: add CLI release process and tagging conventions | DIRTY | no | 2026-03-17T23:37:53Z | Split docs scope but stale/conflicted | Fold into canonical docs PR or close outright. |
| #1134 | fix(web): add responsive mobile layout for dashboard | DIRTY | no | 2026-03-17T20:59:43Z | Old UI/mobile work overlapped by current UI port | Superseded by #1177/#1176 UI port chain. |
| #1103 | test(sdk): add contract tests for agent runtime module | DIRTY | no | 2026-03-17T18:57:24Z | Conflict-stale despite green checks | Superseded by newer SDK/test contract cleanup efforts; close unless explicit owner claims it now. |

---

## Duplicate / Superseded Clusters

1. **Waitlist error-message fixes (hard duplicate):** #1171 vs #1154
2. **CLI docs triplicate:** #1150, #1147, #1146
3. **UI/mobile/dashboard overlap:** #1134, #1159, #1176, #1177 (keep only one active merge lane)
4. **Auth ownership lineage:** #912 older lane vs #1132 newer lane

## Stale docs/UI branches called out explicitly

- **Docs stale:** #1150, #1147, #1146
- **UI stale:** #1134, #1159, #1176 (conflicted), plus active #1177 (keep active)

---

## Ranked Top-10 Action Queue (drain fastest)

1. **Pick single UI trunk now**: keep #1177 as primary, demote/close #1176/#1134/#1159 unless strictly required.
2. **Kill duplicate waitlist PR**: close #1171, keep only one branch (#1154) if still needed.
3. **Collapse docs cluster**: choose one canonical docs PR (#1147) and close #1150/#1146.
4. **Resolve #1153 manually or close today**: no limbo; healer already found real conflicts.
5. **Decide #1132 fate after branch-hygiene check**: if polluted diff persists, close and recreate minimal auth PR.
6. **Force decision on #1144**: if infra failures are branch-induced and high effort, close; otherwise fix fast and merge.
7. **Force decision on #1133**: keep only if migration check is strategic and can pass quickly; else close.
8. **Close stale CI/ops mega-branches**: #1090, #1035, #1033, #1031, #1028 in one sweep.
9. **Close stale copilot drafts**: #1013 and #1011 (or leave parked with explicit owner + deadline).
10. **Archive legacy conflict corpses**: #640 and #912 (park/close based on roadmap urgency; default close for throughput).

## Bottom line

The swamp is not a merge problem; it is a **branch hygiene and duplicate-lane problem**. Throughput improves fastest by closing aggressively, reducing to one active lane per domain (UI/docs/auth/infra), then healing only the survivors.