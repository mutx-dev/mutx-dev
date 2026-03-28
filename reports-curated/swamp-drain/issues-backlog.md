# MUTX Issue Swamp Audit — `mutx-dev/mutx-dev`

_Date:_ 2026-03-18  
_Scope:_ Open **issues only** (PRs excluded), read-only triage for post-decongestion claiming.

## TL;DR
- Open backlog is **69 issues**.
- Label hygiene is decent for area/risk/size, but priority labels are sparse/inconsistent.
- Biggest opportunity is a fast **stability + contract** sweep: close the active prod bugs, then clear high-leverage API/auth/runtime items that unblock multiple web/CLI/SDK tracks.
- There are clear duplicate/near-duplicate clusters that should be merged/deferred before next claim wave.

---

## 1) Backlog Shape (counts)

## 1.1 Priority/readiness
- **Total open issues:** 69
- **autonomy:ready:** 52
- **autonomy:claimed:** 2
- **P0:** 6
- **P1:** 1
- **P2:** 2
- **bug:** 3

> Note: P0/P1/P2 labels cover only a small slice of backlog; most prioritization must be inferred from impact + dependencies.

## 1.2 By area (multi-label; totals can exceed 69)
- **area:api:** 30
- **area:web:** 18
- **area:cli-sdk:** 12
- **area:test:** 11
- **area:ops:** 6
- **area:auth:** 2
- **area:infra:** 2
- **area:runtime:** 2
- **area:docs:** 1

## 1.3 By change shape
- **size:s:** 39
- **size:m:** 29
- **size:l:** 1
- **risk:low:** 46
- **risk:medium:** 13

Interpretation: backlog is mostly small/medium and low/medium risk — good for disciplined, sequential throughput once merge lane is clear.

---

## 2) Cluster Map (area × readiness × practical value)

## A) Immediate stability / prod correctness (highest urgency)
- #1164 Bug: Deployment create endpoint returns 500 (P0, bug, size:l)
- #1148 API returns 502 Bad Gateway (P0, bug)
- #1155 Agent creation fails with no error details (P1)
- #1157 Missing `/logout` route 404 (P2)
- #1149 Waitlist form shows `[object Object]` on error (P2, bug)

## B) Ops and release truthfulness (high leverage)
- #1137 Extract shared CLI service/domain layer (P0)
- #1136 Normalize CLI release/tag docs and truth (P0)
- #1140 Create Homebrew tap + formula (P0)
- #1141 Update install/config/login/TUI/release docs (P0)

## C) Core runtime/security/platform integrity (high leverage)
- #979 Enforce ownership on all agent endpoints
- #984 Add agent execution timeout enforcement
- #993 Add self-healing for common failure modes
- #971 Add production docker-compose configuration
- #969 Add database migration CI check
- #900 Add API key scoping with granular permissions

## D) API contract hardening (builds downstream velocity)
- #908 Typed agent config schema validation
- #907 Webhook signature verification
- #899 Deployment events and lifecycle history endpoint
- #897 PATCH /agents/{id}
- #898 PATCH /deployments/{id}

## E) Web surface + UX (valuable, but mostly after A/B/C)
- #914 Authenticated agent list
- #915 Authenticated deployment list
- #916 Agent detail page
- #917 Deployment detail page
- #918 API key management page
- #922 Webhook management page
- #923 Contact form persistence
- #926 Loading skeletons
- #928 Mobile responsive dashboard
- #930 Agent create form

## F) Test/docs backlog (important but often dependent)
- #887/#888/#889/#890/#892/#946 API route tests (partly duplicate/superseded)
- #955 e2e Playwright dashboard list
- #956 coverage thresholds
- #957 mutation testing
- #962 SDK usage docs

---

## 3) Top 20 issues worth claiming (post-decongestion)

Ordered for shipped value + dependency leverage (not label purity):

1. **#1164** — Deployment create returns 500 (critical correctness)
2. **#1148** — API 502 outage path (availability)
3. **#1155** — Agent create fails w/o useful errors (operator unblock)
4. **#979** — Ownership enforcement on agent endpoints (security + correctness)
5. **#984** — Execution timeout enforcement (runtime safety)
6. **#900** — API key scoping/permissions (security model)
7. **#908** — Typed config validation (input hardening)
8. **#907** — Webhook signature verification (external trust boundary)
9. **#969** — Migration CI check (prevents schema drift regressions)
10. **#971** — Production compose config (infra reproducibility)
11. **#993** — Self-healing behavior (fleet resilience)
12. **#1137** — Shared CLI service/domain layer (reduces duplication debt)
13. **#899** — Deployment lifecycle events endpoint (observability + web/CLI unlock)
14. **#897** — PATCH /agents (API ergonomics)
15. **#898** — PATCH /deployments (API ergonomics)
16. **#1140** — Homebrew tap/formula (distribution)
17. **#1141** — Install/config/login/TUI/release docs (adoption + support load)
18. **#914** — Authenticated agent list view (core UI functionality)
19. **#915** — Authenticated deployment list view (core UI functionality)
20. **#930** — Agent create form (end-to-end operator flow)

---

## 4) Stale, duplicate, or low-yield clusters to defer/close later

## 4.1 Exact duplicate titles (recommend merge or close one)
- **#891** and **#885** — `feat(api): add pagination to GET /agents endpoint`
- **#942** and **#884** — `feat(sdk): add async client support`
- **#943** and **#886** — `fix(sdk): fix base URL default to match production API`
- **#946** and **#889** — `test(api): add route tests for GET /deployments`

## 4.2 Likely supersession / sequencing conflicts
- Many **March 16 batch-generated feature issues** (especially web cosmetics and isolated endpoint increments) appear older and untouched; several should be revalidated against already-open PR branches before claiming.
- Test-only tickets (#887/#888/#890/#892 etc.) are lower immediate yield while merge lane is constrained; better to bundle them after high-risk correctness fixes land.

## 4.3 Defer candidates (for later wave)
- Nice-to-have UX: #924 dark mode, #919 global search, #927 toast system (high value later, but lower immediate operational impact).
- Heavy test sophistication early: #957 mutation testing should wait until core API/runtime stabilization is complete.

---

## 5) Recommended claim order after PR lane decongestion

### Wave 1 — Stop the bleeding (stability + security)
#1164 → #1148 → #1155 → #979 → #984

### Wave 2 — Guardrails and trust boundaries
#900 → #908 → #907 → #969 → #971

### Wave 3 — Resilience + contract expansion
#993 → #899 → #897 → #898 → #1137

### Wave 4 — Distribution + docs truth
#1140 → #1141 → #1136

### Wave 5 — Core dashboard functionality
#914 → #915 → #930 (then #916/#917/#918/#922)

### Wave 6 — Test/docs polish + backlog cleanup
Consolidate duplicate test/API/SDK tickets, then execute a bundled verification pass (#887/#888/#890/#892/#955/#956/#962).

---

## Practical execution notes
- Respect active claims (`autonomy:claimed`) and avoid duplicate effort.
- Prefer issue bundles where one PR can close multiple closely-related low-risk API tickets without bloating scope.
- For every claim wave, run duplicate/supersession check first to avoid shipping into already-moving branches.
