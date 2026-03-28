# Merge-ready Salvage Plan — reopen merge lane fast

Date: 2026-03-18
Scope: `mutx-dev/mutx-dev` PRs #1144, #1153, #1135, #1133, #1132, #1103, #1100, #1096, #1090, #1088, #1086, #1084, #912

## Executive call
The fastest way to reopen the lane is to land **clean conflict-only PRs with historically green CI first**. That means prioritizing **#1088, #1103, #1090** before the noisy infra-breaking batch. 

---

## Candidate triage

| PR | merge-ready label | Mergeability | Freshness | Likely blocker type | Hard conclusion |
|---|---|---|---|---|---|
| #1144 | Yes | MERGEABLE | Updated 2026-03-18 | **CI-only** | Conflict healed; now blocked by failing CI (Validation + multiple Infra checks failing). |
| #1153 | Yes | CONFLICTING | Updated 2026-03-18 | **both** | Conflicts unresolved and latest CI was cancelled/stale; needs rebase + fresh CI run. |
| #1135 | Yes | CONFLICTING | Updated 2026-03-18 | **both** | Has active conflict and prior Validation failure; also titled `[WIP]` despite merge-ready. |
| #1133 | Yes | MERGEABLE | Updated 2026-03-18 | **CI-only** | Rebased and mergeable; current run is failing infra/DB checks (not conflict-blocked). |
| #1132 | Yes | CONFLICTING | Updated 2026-03-17 | **likely stale/superseded** | Branch is conflicting and already flagged as polluted with large unrelated diff; not a near-term merge candidate. |
| #1103 | Yes | CONFLICTING | Updated 2026-03-17 | **conflict-only** | Last CI was clean; only thing blocking merge is branch conflict with main. |
| #1100 | Yes (+needs-improvement) | CONFLICTING | Updated 2026-03-17 | **both** | Conflicting plus prior Validation failure; contradictory labels indicate not truly merge-ready. |
| #1096 | Yes | CONFLICTING | Updated 2026-03-17 | **both** | Conflicting and prior CI/infra failures. |
| #1090 | Yes | CONFLICTING | Updated 2026-03-17 | **conflict-only** | Prior Validation green; Coverage Check failure existed in one run, but latest gate looked green enough to treat as conflict-first salvage. |
| #1088 | Yes | CONFLICTING | Updated 2026-03-17 | **conflict-only** | Historically clean checks; currently blocked by conflict only. Fastest salvage candidate. |
| #1086 | Yes | CONFLICTING | Updated 2026-03-17 | **both** | Conflicts plus mixed CI history including failures. |
| #1084 | Yes | CONFLICTING | Updated 2026-03-17 | **both** | Conflicts plus mixed CI history including failures. |
| #912 | No | CONFLICTING | Updated 2026-03-16 | **likely stale/superseded** | Old, conflicting, no merge-ready signal; poor short-term ROI for lane reopening. |

---

## Top 5 salvage targets (ranked for throughput impact)

| Rank | PR | Why this is top salvage | Exact next move to land |
|---|---|---|---|
| 1 | **#1088** | Pure conflict unblock + historically green checks = fastest mergeable conversion | Rebase `codex/issue-957` onto latest `main`, resolve conflicts, push, trigger CI; if CI green, merge immediately. |
| 2 | **#1103** | Same profile as #1088 (green history, conflict-gated) | Rebase `codex/issue-952`, resolve conflicts, push, run full CI once; merge on green. |
| 3 | **#1090** | Also close to land; conflict appears primary blocker | Rebase `codex/issue-956`, resolve conflict set, rerun CI focusing on Coverage Check + Validation; merge if both pass. |
| 4 | **#1133** | Already mergeable (no conflict), only CI stabilization left | Fix failing checks from current run (Database Migration Check + infra validation failures), push minimal CI fixes, rerun, merge on first full green. |
| 5 | **#1144** | Conflict already removed; single-threading on CI fixes can unlock a large audited PR | Investigate failing CI jobs (Validation + Infra failures), patch branch for deterministic pass, rerun all required checks, merge once stable. |

---

## PRs carrying `merge-ready` that should be closed or relabeled

1. **#1135** — should be **relabeled (remove `merge-ready`)** now. It is `[WIP]`, conflicting, and has failed validation history.
2. **#1132** — should be **relabeled (remove `merge-ready`, add `needs-split`/`needs-hygiene`)**. It is branch-polluted and not safely salvageable as-is.
3. **#1100** — should be **relabeled (remove `merge-ready`)** while `needs-improvement` and failing CI remain.
4. **#1153** — should be **temporarily relabeled off `merge-ready`** until manual conflict heal is completed and fresh CI is produced.

No hard close recommendation among the merge-ready set yet; relabeling is sufficient to stop false-positive lane noise. 

---

## Operational sequence to reopen lane

1. Run healer on **#1088 + #1103** first (highest likelihood of same-session merges).
2. Then heal **#1090**.
3. In parallel/next slot, work CI-only queue **#1133**, then **#1144**.
4. Immediately clean labels on non-mergeable `merge-ready` PRs (#1135/#1132/#1100/#1153) to reduce ship-worker churn.

This ordering maximizes expected merges per unit effort and re-establishes a truthful merge-ready lane.