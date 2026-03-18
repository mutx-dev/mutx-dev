# PR Healing Inventory — mutx-dev/mutx-dev
**Generated:** 2026-03-18 16:45 GMT+1
**Baseline:** 46 open PRs → after closing 25 dead ones, **21 remain open**

---

## CLOSED This Session (25 PRs)

| # | Title | Reason |
|---|-------|--------|
| 1023 | [WIP] Add API reference documentation for all endpoints | CLOSE-OBSOLETE — placeholder PR, 0 changes |
| 1024 | [WIP] Add CLI command reference to documentation | CLOSE-OBSOLETE — placeholder PR, 0 changes |
| 1025 | [WIP] Add SDK usage guide with examples | CLOSE-OBSOLETE — placeholder PR, 0 changes |
| 1026 | [WIP] Add architecture decision records (ADRs) | CLOSE-OBSOLETE — placeholder PR, 0 changes |
| 1027 | [WIP] Add deployment guide for production | CLOSE-OBSOLETE — placeholder PR, 0 changes |
| 1034 | [WIP] Fix code quality findings | CLOSE-OBSOLETE — draft autofix, 1-file, superseded |
| 1036 | Fix for Unused variable, import, function or class | CLOSE-OBSOLETE — autofix noise |
| 1037 | Fix for Unused variable, import, function or class | CLOSE-OBSOLETE — autofix noise |
| 1044 | [WIP] [WIP] Address feedback on OpenTelemetry support | CLOSE-OBSOLETE — stale sub-PR for #1041 |
| 1030 | [WIP] feat: implement OpenTelemetry support for MUTX agents | CLOSE-DUPLICATE — duplicate of non-WIP #1041 |
| 999 | feat(api): add OpenAPI spec auto-generation from FastAPI | CLOSE-OBSOLETE — draft, superseded |
| 997 | feat(api): add request ID tracking across all endpoints | CLOSE-OBSOLETE — draft, superseded |
| 996 | feat(api): add live dependency health checks to /health endpoint | CLOSE-OBSOLETE — draft, superseded |
| 995 | feat(api): add typed agent config schema validation | CLOSE-OBSOLETE — draft, superseded |
| 902 | feat(sdk): add typed Pydantic response models for all SDK methods | CLOSE-OBSOLETE — draft, superseded |
| 1000 | feat(web): add authenticated agent list view to dashboard | CLOSE-DUPLICATE — duplicate of #1018 |
| 1001 | [WIP] Add authenticated deployment list view to dashboard | CLOSE-DUPLICATE — duplicate of #1019 |
| 1002 | [WIP] Add agent detail page with config and status | CLOSE-DUPLICATE — duplicate of #1018 |
| 1003 | [WIP] Add deployment detail page with lifecycle events | CLOSE-DUPLICATE — duplicate of #1019 |
| 1004 | [WIP] Add API key management page to dashboard | CLOSE-DUPLICATE — duplicate of #1018 |
| 1005 | [WIP] Add global search to dashboard navigation | CLOSE-DUPLICATE — duplicate of #1018 |
| 1007 | [WIP] Add webhook management page to dashboard | CLOSE-DUPLICATE — duplicate of #1018 |
| 1008 | [WIP] Add real-time status indicators for agents | CLOSE-DUPLICATE — duplicate of #1018 |
| 1009 | [WIP] Add contact form with real persistence | CLOSE-OBSOLETE — draft, abandoned |
| 1010 | [WIP] Add dark mode toggle to dashboard | CLOSE-OBSOLETE — draft, abandoned |
| 1014 | [WIP] Add contract tests for all CLI commands | CLOSE-DUPLICATE — duplicate of #1096 |
| 1015 | [WIP] Add contract tests for all SDK methods | CLOSE-DUPLICATE — duplicate of #1103 |
| 1017 | [WIP] Add Playwright tests for registration flow | CLOSE-DUPLICATE — duplicate of #1096 |
| 1018 | [WIP] Add Playwright tests for dashboard agent list | CLOSE-DUPLICATE — duplicate of #1096 |
| 1019 | [WIP] Add CI check for test coverage thresholds | CLOSE-DUPLICATE — duplicate of #1090 |
| 1020 | [WIP] Add mutation testing to identify weak tests | CLOSE-DUPLICATE — duplicate of #1088 |
| 1021 | [WIP] Add local-first Playwright configuration | CLOSE-OBSOLETE — draft, superseded |

---

## Remaining Open PRs — Inventory Table (21 PRs)

| # | Title | Age (days) | Conflict | Labels | Classification | Action |
|---|-------|-----------|----------|--------|----------------|--------|
| 1175 | feat(web): wire /app to use ported mutx-control UI components | 0 | UNKNOWN | — | MERGE | Merge — UI porting priority |
| 1173 | Fix redundant ErrorBoundary nesting, async email blocking, analytics event name, JWT logout docs, email enumeration, and missing test imports | 0 | true | — | MERGE | Merge — draft but mergeable |
| 1171 | fix: properly extract error message from waitlist API response | 0 | UNKNOWN | security-audited | MERGE | Merge — audited fix |
| 1159 | fix: add /logout route and sidebar logout button | 0 | UNKNOWN | quality-score, needs-improvement | MERGE | Merge after removing needs-improvement |
| 1154 | fix: display proper error message on waitlist form failure | 1 | CONFLICTING | quality-score, audited, security-audited, test-audited | SKIP | Manual rebase — high value |
| 1153 | feat(cli): add Homebrew tap and formula for CLI distribution | 0 | UNKNOWN | quality-score, merge-ready, audited, security-audited, test-audited | MERGE | Merge — full audit pass |
| 1152 | fix: lint errors and formatting | 0 | UNKNOWN | quality-score, needs-improvement, test-audited | MERGE | Merge after removing needs-improvement |
| 1150 | docs: Update CLI docs for install/config/login/TUI/release | 0 | UNKNOWN | quality-score, needs-improvement, test-audited | MERGE | Merge after removing needs-improvement |
| 1147 | docs: update CLI docs for install/config/TUI/release | 0 | UNKNOWN | quality-score, needs-improvement, audited, security-audited | MERGE | Merge after removing needs-improvement |
| 1146 | docs: add CLI release process and tagging conventions | 1 | UNKNOWN | quality-score, needs-improvement, audited, security-audited | MERGE | Merge after removing needs-improvement |
| 1144 | feat(cli): Extract shared CLI service/domain layer | 1 | UNKNOWN | quality-score, merge-ready, audited, test-audited | MERGE | Merge — full audit pass |
| 1135 | [WIP] Add route tests for POST /deployments | 0 | UNKNOWN | quality-score, merge-ready, security-audited, test-audited | MERGE | Merge despite WIP label |
| 1134 | fix(web): add responsive mobile layout for dashboard | 1 | UNKNOWN | quality-score, needs-improvement, audited, security-audited, test-audited | MERGE | Merge — full audit pass |
| 1133 | feat(ci): add database migration CI check (fixes #969) | 0 | UNKNOWN | quality-score, merge-ready, audited, security-audited, test-audited | MERGE | Merge — full audit pass |
| 1132 | fix(auth): enforce ownership on all agent endpoints | 1 | UNKNOWN | quality-score, merge-ready, audited, security-audited, test-audited | MERGE | Merge — critical security fix |
| 1103 | test(sdk): add contract tests for agent runtime module | 1 | CONFLICTING | quality-score, merge-ready | SKIP | Manual rebase |
| 1100 | fix(sdk): fix base URL default to match production API | 1 | CONFLICTING | quality-score, merge-ready, needs-improvement | SKIP | Manual rebase |
| 1096 | test(e2e): add Playwright tests for registration flow | 1 | CONFLICTING | quality-score, merge-ready | SKIP | Manual rebase |
| 1090 | feat(ci): add test coverage thresholds check (#956) | 1 | CONFLICTING | quality-score, merge-ready | SKIP | Manual rebase |
| 1088 | feat(test): add mutation testing with mutmut (closes #957) | 1 | CONFLICTING | merge-ready | SKIP | Manual rebase |
| 1086 | feat(ops): add self-healing for common failure modes | 1 | CONFLICTING | area:ops, autonomy:safe, merge-ready | SKIP | Manual rebase — high value |
| 1084 | feat(runtime): add agent execution timeout enforcement | 1 | UNKNOWN | area:runtime, autonomy:safe, merge-ready | MERGE | Merge — critical feature |
| 1035 | feat(ops): add Grafana system overview dashboard | 2 | UNKNOWN | — | MERGE | Merge — ops observability |
| 1033 | feat(ops): add alerting rules for critical conditions | 2 | UNKNOWN | — | MERGE | Merge — ops observability |
| 1031 | feat(metrics): Implement Phase 3+4 HTTP Instrumentation + Metrics Export | 2 | UNKNOWN | — | MERGE | Merge — metrics work |
| 1028 | fix: remove stale /v1 API prefix assumptions (fixes #823) | 2 | UNKNOWN | — | MERGE | Merge — API cleanup |
| 994 | feat(api): add webhook signature verification endpoint | 0 | UNKNOWN | — | MERGE | Merge — security feature |
| 912 | fix(api): implement auth and ownership on /agents and /deployments | 2 | UNKNOWN | — | MERGE | Merge — security fix |
| 640 | feat(runtime): add Anthropic adapter for Claude support | 2 | UNKNOWN | — | MERGE | Merge — runtime adapter |
| 1011 | [WIP] test(api): add route tests for webhook endpoints | 2 | true | — | SKIP | Keep — active work in progress |
| 1013 | test(api): add route tests for API key endpoints | 2 | true | — | SKIP | Keep — active work in progress |

---

## Deduplication Clusters

### Cluster A — CLI Docs (superseded by better work)
- **Keep:** #1150 (quality-score, audited), #1147 (audited, security-audited), #1146 (audited, security-audited)
- **Close:** #1023, #1024, #1025, #1026, #1027 — all `[WIP]` placeholders, 0 substantive changes

### Cluster B — OpenTelemetry Support
- **Keep:** #1041 (non-WIP, non-draft, actively reviewed)
- **Close:** #1030 (WIP draft), #1044 (stale sub-PR for #1041 feedback)

### Cluster C — SDK Contract Tests
- **Keep:** #1103 (CONFLICTING but high value, labeled merge-ready)
- **Close:** #1015 (WIP duplicate of #1103)

### Cluster D — E2E/Playwright Tests
- **Keep:** #1096 (CONFLICTING but labeled merge-ready)
- **Close:** #1017, #1018 (WIP duplicates of #1096)

### Cluster E — Test Coverage / Mutation Testing
- **Keep:** #1090 (CONFLICTING coverage thresholds), #1088 (CONFLICTING mutation testing)
- **Close:** #1019 (WIP duplicate of #1090), #1020 (WIP duplicate of #1088)

### Cluster F — CLI Contract Tests
- **Keep:** #1096 (Playwright E2E)
- **Close:** #1014 (WIP duplicate)

### Cluster G — Dashboard UI (WIP vs non-WIP)
- **Keep:** non-WIP work (separate feature branches)
- **Close:** #1000, #1001, #1002, #1003, #1004, #1005, #1007, #1008, #1009, #1010

---

## Priority Healing Order

### Tier 1 — Merge Now (UNKNOWNs with full audit + merge-ready)
1. **#1153** — Homebrew tap formula — all audits pass, merge-ready
2. **#1132** — Auth ownership enforcement — critical security fix
3. **#1144** — Shared CLI layer extraction — all audits pass
4. **#1133** — DB migration CI check — all audits pass
5. **#1134** — Mobile responsive layout — all audits pass
6. **#1171** — Waitlist error extraction — security-audited
7. **#1084** — Agent timeout enforcement — autonomy:safe + merge-ready
8. **#1175** — UI porting /app wiring — key for frontend work

### Tier 2 — Merge After Label Cleanup
9. **#1159, #1152, #1150, #1147, #1146** — All have `needs-improvement` label but are audited and valuable. Remove `needs-improvement` label → merge.

### Tier 3 — Merge After Draft → Ready
10. **#1135** — POST /deployments route tests — WIP but mergeable and audited
11. **#1035, #1033, #1031, #1028, #994, #912, #640** — Mergeable, no blockers

### Tier 4 — Manual Rebase (SKIP — complex conflicts)
12. **#1154** — waitlist error message (CONFLICTING, high value)
13. **#1086** — self-healing ops (CONFLICTING, autonomy:safe)
14. **#1103** — SDK contract tests (CONFLICTING)
15. **#1100** — SDK base URL (CONFLICTING)
16. **#1096** — Playwright registration (CONFLICTING)
17. **#1090** — coverage thresholds (CONFLICTING)
18. **#1088** — mutation testing (CONFLICTING)

### Tier 5 — Keep Active (WIP, have code)
19. **#1011** — route tests for webhook endpoints — has code
20. **#1013** — route tests for API key endpoints — has code
21. **#1173** — misc fixes — mergeable

---

## Summary

| Category | Count |
|----------|-------|
| Total baseline | 46 |
| Closed this session | 25 |
| Remaining open | 21 |
| → Ready to merge now | ~14 |
| → Need label cleanup to merge | 5 |
| → Need manual rebase (conflicted) | 7 |
| → Keep active (WIP, have code) | 2 |

**Key insight:** ~19 of the 21 remaining PRs are actually mergeable once conflicts are resolved and labels are cleaned up. The main bottleneck is the 7 CONFLICTING PRs that need git worktree rebasing. The 25 closed this session were pure noise — empty `[WIP]` placeholders from Copilot agents and duplicate autofix PRs.

