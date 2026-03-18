# MUTX Fleet Dashboard

Updated: 2026-03-18 02:57 UTC (03:57 Europe/Rome)

## Today's Metrics

| Metric | Value |
|--------|-------|
| PRs Merged Today | **2** |
| Issues Closed | - |
| Success Rate | 85% |
| Fleet Status | 26 active workers |

## Fleet Health (26 active workers)

| Worker | Status | Last Run | Notes |
|--------|--------|----------|-------|
| mutx-ship-worker | ✅ | running | 0 err |
| mutx-backend-worker | ✅ | running | 0 |
| mutx-backend-worker-2 | ✅ | running | 0 |
| mutx-backend-worker-3 | ✅ | running | 0 |
| mutx-frontend-worker | ✅ | running | 0 |
| mutx-frontend-worker-2 | ✅ | running | 0 |
| mutx-frontend-worker-3 | ❌ | running | 2 err (write failure) |
| mutx-ship-worker-2 | ✅ | running | 0 |
| mutx-ship-worker-3 | ✅ | running | 0 |
| mutx-auditor-backend | ✅ | running | 0 |
| mutx-auditor-frontend | ✅ | running | 0 |
| mutx-auditor-security | ✅ | running | 0 |
| mutx-auditor-tests | ✅ | running | 0 |
| mutx-auditor-architecture | ✅ | running | 0 |
| mutx-patrol | ✅ | running | 0 |
| mutx-retry | ✅ | running | 0 |
| mutx-scorer | ✅ | running | 0 |
| mutx-closer | ✅ | running | 0 |
| mutx-triage | ✅ | running | 0 |
| mutx-healer | ✅ | running | 0 |
| mutx-optimizer | ❌ | running | 1 err (edit failure) |
| mutx-tester | ✅ | running | 0 |
| mutx-recruiter | ❌ | running | 1 err (timeout) |
| mutx-roadmap | ✅ | running | 0 |
| mutx-conductor | ❌ | running | 1 err (timeout) |
| mutx-issue-accelerator | ✅ | running | 0 |
| mutx-wall-e | ✅ | running | 0 |
| mutx-fix-1 | ✅ | running | 0 |
| mutx-factory-be-4 | ✅ | running | 0 |
| mutx-factory-be-5 | ✅ | running | 0 |
| mutx-cleanup | ⏸️ | ~3 hrs ago | scheduled |
| MUTX Pulse 8 | ✅ | running | 0 |
| MUTX Post 22:00 | ⏸️ | yesterday 22:00 | scheduled |
| MUTX Post 08:00 | ⏸️ | today 08:00 | scheduled |

## Recent Merged PRs (Today)

| # | Title | Time |
|---|-------|------|
| 1166 | fix: resolve failing tests in versioning.test.ts | Mar 18 02:10 |
| 1160 | feat(tui): add textual-based mutx tui shell | Mar 18 02:46 |

## Recent Merged PRs (Last 24h)

| # | Title | Time |
|---|-------|------|
| 1145 | test(e2e): add Playwright tests for registration flow | Mar 17 21:54 |
| 1143 | chore(deps): bump next from 15.5.10 to 16.1.7 | Mar 17 20:25 |
| 1142 | test(api): add route tests for POST /deployments | Mar 17 20:25 |
| 1131 | feat(ops): add structured JSON logging | Mar 17 20:08 |
| 1130 | fix(web): add automatic token refresh on session expiry | Mar 17 20:07 |
| 1129 | fix(infra): add Docker health checks to all services | Mar 17 20:07 |

## Workers Needing Attention

1. **mutx-frontend-worker-3**: 2 consecutive errors - write failure
2. **mutx-optimizer**: 1 error - edit failure (tried to write dashboard)
3. **mutx-recruiter**: 1 timeout error
4. **mutx-conductor**: 1 timeout error

## Actions Taken

- Fleet running 26 workers
- 2 PRs merged today
- 4 workers have errors (healer will handle)
