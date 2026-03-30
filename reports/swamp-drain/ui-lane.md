# UI Port Lane Canonicalization Audit (2026-03-18)

## Scope checked
- Required context files: `SOUL.md`, `USER.md`, `mutx-fleet-state.md`, `UI-PORT-PLAN.md`, `memory/2026-03-18.md`, `memory/2026-03-17.md`
- PRs: `#1176`, `#1177`, `#1134` (+ historical `#1175`, `#1154` context)
- Branches: `factory/ui-porting`, `ui-porting`, `ui-porting-dashboard`, `ui-port-clean`, `pr-1154`
- Worktree: `.worktrees/ui-porting`
- Ported routes/components present in repo/worktree

---

## Executive call

**Canonical UI lane should be: `factory/ui-porting` → PR `#1177`.**

Why:
- It is the only UI port branch cleanly rebased on current `main` (**ahead 2 / behind 0**).
- PR #1177 is small/coherent (8 files, focused scope, explicit validation claim `npm run build ✅`).
- `.worktrees/ui-porting` is already aligned to this branch and has no dirty local state.
- Other UI branches/PRs are branch soup: large unrelated diffs, stale ancestry, duplicate heads, and conflict-heavy merge states.

---

## Findings

### 1) Canonical candidate quality

### `factory/ui-porting` / PR `#1177`
- Branch health: `ahead 2, behind 0` vs `mutx-dev/main`
- Worktree: `.worktrees/ui-porting` is on `factory/ui-porting`, clean status
- PR #1177:
  - title: `ui: port mutx-control dashboard shell + empty states`
  - merge state: `UNSTABLE` (CI/check stability issue), **not DIRTY**
  - size: **8 files**, +122/-120, 2 commits
  - scope is narrow and truthful to current landing strategy

This is the only lane that looks like it can land with normal CI stabilization rather than archaeology.

### 2) Non-canonical lane risk / dead weight

### `ui-port-clean` / PR `#1176`
- PR #1176 is huge/noisy: **66 files**, +24,131/-666, 52 commits, merge state `DIRTY`.
- Directory spread includes backend/tests/messages/lib/cli/infra drift; not just frontend UI port.
- Overlaps with #1177 on 5 files (`UI-PORT-PLAN.md`, `app/dashboard/layout.tsx`, `components/app/{activity-feed,log-viewer,task-board}.tsx`), meaning active duplication/confusion exists.
- `ui-port-clean` tip is identical to `ui-porting-dashboard` tip (`same commit SHA`).

Interpretation: this is a superseded “kitchen sink” branch and currently misleading as a UI port vehicle.

### `ui-porting-dashboard`
- Same commit as `ui-port-clean` (duplicate lane identity).
- `ahead 52 / behind 54` vs main — deeply diverged.
- No unique value beyond confusion.

### `pr-1154`
- No active PR found for this branch name.
- Branch is stale/diverged (`ahead 47 / behind 54`).
- Contains old UI-port era changes and broad unrelated file spread.
- Name is misleading for UI canonicalization (looks like issue-PR scratch lane, not a maintained UI track).

### `ui-porting` (historical lane)
- Old branch with closed PR #1175.
- `ahead 7 / behind 367` vs main — effectively fossilized for current landing.
- Kept around only as history; not a viable shipping lane.

### Other UI-related PR signal
- `#1134` (responsive mobile dashboard) is open but `DIRTY`, older, and not the active source of truth anymore.
- It is functionally superseded by the newer dashboard-shell lane in #1177 for current direction.

---

## Already ported surfaces (current reality)

In `.worktrees/ui-porting`, porting exists and is actively integrated around dashboard shell/components:
- Routes include `/dashboard/*` surfaces and related pages
- Ported components include:
  - `components/dashboard/DashboardShell.tsx`
  - `components/dashboard/dashboardNav.ts`
  - `components/app/activity-feed.tsx`
  - `components/app/task-board.tsx`
  - `components/app/log-viewer.tsx`
  - shared UI pieces like `components/ui/{sidebar,stat-card,widget-grid,nav-rail}.tsx`

Current incremental commits in canonical lane are exactly this shell/empty-state integration, not a giant repo-wide rewrite.

---

## Is UI port converging or just branch noise?

**Answer: mixed, but currently recoverable and converging _if_ lane is collapsed now.**

- Converging evidence:
  - One focused branch (`factory/ui-porting`) on top of main.
  - One focused PR (`#1177`) with bounded scope.
  - Active worktree attached to that branch.
- Noise evidence:
  - Multiple legacy UI branches with overlapping payloads and huge unrelated churn.
  - Duplicate branch heads (`ui-port-clean` == `ui-porting-dashboard`).
  - Parallel PR artifacts (#1175 closed, #1176 open/dirty, #1177 open/unstable).

Without explicit closure/supersede cleanup, this will keep re-splintering.

---

## Canonical PR decision

A coherent canonical PR **already exists: `#1177`**.

No new PR should be created right now.

---

## Closure / supersede recommendations (blunt)

- **PR #1177 (`factory/ui-porting`)** — **KEEP**
  - Treat as sole canonical UI port PR.

- **Branch `factory/ui-porting`** — **KEEP**
  - Keep as canonical UI integration branch.

- **PR #1176 (`ui-port-clean`)** — **CLOSE**
  - Superseded by #1177; too large/noisy/dirty to be trustworthy.

- **Branch `ui-port-clean`** — **CLOSE**
  - Archive/delete after #1176 closure.

- **Branch `ui-porting-dashboard`** — **CLOSE**
  - Duplicate head of `ui-port-clean`; pure confusion.

- **Branch `ui-porting`** — **CLOSE**
  - Historical/stale lane (closed PR #1175, massively behind main).

- **Branch `pr-1154`** — **CLOSE**
  - Stale side-lane; no coherent active PR; misleading name for UI lane.

- **PR #1134 (older responsive dashboard)** — **REPLACE**
  - Replace as active landing path with #1177 and close once overlap is confirmed non-essential.

- **Worktree `.worktrees/ui-porting`** — **KEEP**
  - This is the right execution lane while #1177 is stabilized.

- **`UI-PORT-PLAN.md`** — **REBASE**
  - Rebase/update plan language so it references only canonical lane (`factory/ui-porting` + #1177) and explicitly marks legacy lanes superseded.

---

## Final one-line directive

**Run one lane only: `factory/ui-porting` + PR #1177. Everything else in UI porting is dead branch debt and should be closed/superseded now.**
