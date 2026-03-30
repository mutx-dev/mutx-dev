# MUTX Release Verifier

## 2026-03-19 10:27 Europe/Rome

Verified against `origin/main` at `b0795c02` (`ui: collapse stale app routes into dashboard`) in `/Users/fortune/mutx-worktrees/factory/live-main`.

### Material landed update
Yes. `main` moved materially in the current dashboard/website convergence burst. Most relevant landed commits in the current chain:
- `4d960204` — `ui: make dashboard the canonical operator surface`
- `5902c4ca` — `ui: remove final borrowed monitoring copy`
- `e98fbecb` — `ui: restore mutx website control-plane framing`
- `b9d84cb8` — `ui: recover dashboard session on deployments bootstrap`
- `7780095d` — `ui: harden dashboard auth and payload states`
- `014cd9bd` — `ui: make dashboard chrome truthful`
- `53860335` — `ui: align website spec with canonical dashboard`
- `739760e1` — `ui: collapse swarm alias into deployments`
- `b0795c02` — `ui: collapse stale app routes into dashboard`

### Files changed (website/dashboard-relevant)
- `app/page.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/monitoring/page.tsx`
- `app/dashboard/swarm/page.tsx`
- `app/dashboard/SPEC.md`
- `app/dashboard/components/Sidebar.tsx`
- `app/app/[[...slug]]/page.tsx`
- `app/api/_lib/controlPlane.ts`
- `app/api/dashboard/agents/route.ts`
- `app/api/dashboard/deployments/route.ts`
- `components/app/AppDashboardClient.tsx`
- `components/app/DeploymentsPageClient.tsx`
- `components/app/ApiKeysPageClient.tsx`
- `components/app/AgentsPageClient.tsx`
- `components/app/http.ts`
- `components/dashboard/DashboardShell.tsx`
- `components/dashboard/DashboardSectionPage.tsx`
- `components/dashboard/dashboardNav.ts`
- `components/ui/nav-rail.tsx`
- `components/ui/sidebar.tsx`
- `components/webhooks/WebhooksPageClient.tsx`
- `middleware.ts`
- `public/og-image.svg`
- `tests/unit/middlewareRouting.test.ts`
- `tests/website.spec.ts`

### Routes unified
Code-level coherence is materially better now.
- Marketing host forwards auth/app traffic to `app.mutx.dev`.
- `app.mutx.dev/` now redirects to canonical `/dashboard`.
- Legacy `/app/*` now canonicalizes into `/dashboard/*` in middleware.
- Explicit stale-route remaps landed and are tested:
  - `/app/activity` -> `/dashboard/history`
  - `/app/cron` -> `/dashboard/orchestration`
  - `/app/settings` -> `/dashboard/control`
  - `/app/health` and `/app/observability` -> `/dashboard/monitoring`
- Product terminology also converged:
  - `/dashboard/swarm` now redirects to `/dashboard/deployments`
  - shared nav now uses `Deployments` as the canonical resource instead of `Swarm`

`tests/unit/middlewareRouting.test.ts` covers the critical host-aware redirect paths, so this is not just copy drift cleanup.

### Branding restored
Branding/positioning coherence is much improved.
- Homepage and OG asset now use MUTX-native framing: `Deploy agents like services. Operate them like systems.`
- Dashboard shell copy is MUTX/control-plane language, not borrowed Mission Control language.
- Visible shell labels now include:
  - `Control plane online`
  - `Canonical /dashboard surface`
  - `Agents · Deployments · Runs`
  - `MUTX operator key`
- `app/dashboard/SPEC.md` was also cleaned so future work inherits the canonical MUTX framing instead of older borrowed metaphors.

### Auth + payload coherence
Improved, but not fully proven demo-safe.
- Landed changes in `components/app/http.ts`, `components/app/DeploymentsPageClient.tsx`, `app/api/_lib/controlPlane.ts`, and related dashboard routes indicate a real pass on auth/session recovery and unauthorized-state handling.
- Prior reminder evidence shows the raw `[object Object]` failure mode was replaced by readable unauthorized/auth states.
- `AppDashboardClient` now has clearer readiness states, but it still contains placeholder-ish copy like `No operator session established yet` / `seed demo data`, which is honest but still slightly demo-fragile if shown cold.

### Available local preview evidence
Used the latest already-captured local preview evidence plus a fresh live check.
- Latest available reminder evidence:
  - `reports/ui-reminders/2026-03-19-0939-ui-check.md`
  - `reports/ui-reminders/2026-03-19-1010-ui-check.md`
- Those reports recorded local preview screenshots for `/dashboard`, `/dashboard/monitoring`, and `/dashboard/deployments`, and described a coherent MUTX-branded canonical shell.
- Fresh live browser check during this verifier run could **not** reconfirm the UI because `http://127.0.0.1:3000` returned `ERR_CONNECTION_REFUSED` for `/dashboard`, `/dashboard/deployments`, and `/app/activity`.

### Remaining demo blockers
- **No live local preview at verification time.** Biggest immediate blocker for demo confidence this run.
- **Signed-in dashboard path not freshly re-proven in-browser this run.** Code looks better; live proof is missing because localhost preview was down.
- **Deployments/auth still need one clean signed-in walkthrough** to confirm no remaining unauthorized/runtime edge on the canonical route.
- **Some dashboard readiness states are still visibly placeholder-oriented** (`No operator session established yet`, `seed demo data`) if the environment is empty.
- **Backend parity lane is still weak/disabled**, so deeper data-truth improvements beyond shell/routing/auth hardening are not moving as fast as the UI convergence work.

### Bottom line
`main` is materially more demoable than the earlier split-brain state: one canonical `/dashboard`, cleaner redirect logic, restored MUTX branding, and less borrowed terminology. But this run cannot call it fully demo-safe yet because the local preview was down and the latest signed-in deployments flow was not freshly proven end-to-end.

## 2026-03-19 11:05 Europe/Rome

Verified against `origin/main` at `b47d82c8` (`ui: truthify dashboard data contracts`) in `/Users/fortune/mutx-worktrees/factory/live-main`.

### Material landed update
Yes. This is a real follow-up to the canonical-dashboard/auth recovery burst, not noise.
- `b47d82c8` — `ui: truthify dashboard data contracts`

What changed materially: the dashboard clients and proxy routes now normalize real API collection shapes more defensively and route logs/metrics through the canonical dashboard proxy instead of ad-hoc direct paths. That reduces the odds of blank pages, misleading empty states, or raw auth failures when the backend payload shape varies.

### Files changed
- `app/api/dashboard/agents/[agentId]/route.ts`
- `app/api/dashboard/deployments/[id]/route.ts`
- `components/app/AgentsPageClient.tsx`
- `components/app/AppDashboardClient.tsx`
- `components/app/DeploymentHistory.tsx`
- `components/app/DeploymentsPageClient.tsx`
- `components/app/Observability/LogsViewer.tsx`
- `components/app/Observability/MetricsDashboard.tsx`
- `components/app/http.ts`

### Routes unified / contract coherence
No new top-level route moves landed in this commit, but canonical `/dashboard` coherence improved underneath:
- agent detail proxy now serves `?path=logs` and `?path=metrics` through `/api/dashboard/agents/[agentId]`
- deployment detail proxy now serves `?path=logs`, `?path=metrics`, and `?path=versions` through `/api/dashboard/deployments/[id]`
- logs and metrics widgets now call canonical dashboard proxy routes instead of older direct `/agents/*` or `/deployments/*` fetch paths
- shared `normalizeCollection()` now handles array payloads and common envelope keys (`items`, `agents`, `deployments`, `data`, `logs`, `metrics`, etc.) across dashboard surfaces

Net: the shell is no longer just visually unified — the data-fetch contract is more unified too.

### Branding restored
Branding remains coherent and intact after this follow-up.
- live localhost still renders MUTX-native dashboard chrome:
  - `Control plane online`
  - `Canonical /dashboard surface`
  - `Agents · Deployments · Runs`
  - `Governed`
- hero copy still reads `Deploy agents like services. Operate them like systems.`
- no regression back toward borrowed session/dashboard framing was visible in this run

### Auth / payload truthfulness
This is where `b47d82c8` matters most.
- `AgentsPageClient` now treats 401 as an auth boundary instead of a generic failure and shows `Sign in to view and operate agents.`
- `DeploymentsPageClient` does the same for deployments and preserves a specific operator-session-required state
- `AppDashboardClient` now distinguishes unauthenticated bootstrap from generic load failure instead of collapsing everything into noisy error state
- version history, logs, and metrics now extract readable error messages from JSON payloads instead of surfacing thin transport errors
- deployment event flattening and collection parsing are more tolerant of backend envelope differences

This is a real demoability improvement: less chance of embarrassing `[object Object]`/wrong-shape/auth-noise regressions on the canonical routes.

### Available local preview evidence
This run had real local proof, not just code inspection.
- `npm run build` ✅ on `b47d82c8`
- started local preview with `npm run start`
- live localhost checks succeeded for:
  - `/dashboard`
  - `/dashboard/agents`
  - `/dashboard/deployments`

What localhost showed:
- canonical MUTX shell rendered correctly on all three routes
- signed-out overview is now honest, with explicit operator/auth boundary copy instead of the earlier split-brain `Auth Required` confusion
- `/dashboard/agents` renders a readable signed-out state: `Sign in to view and operate agents.`
- `/dashboard/deployments` renders a readable signed-out state plus `Operator session required`

### Remaining demo blockers
- **Signed-in path still not freshly proven end-to-end.** This run verified signed-out honesty, not a full authenticated demo flow.
- **Observability/traces remain partially shell-first.** `Traces` still presents an honest placeholder/integration shell rather than a live fully wired product surface.
- **Legacy stale-route proof is still host-sensitive.** Middleware remaps were previously tested for `app.mutx.dev`, but a localhost probe of old pathing is not enough to re-prove production-host behavior on its own.
- **Empty-state demo risk remains if the backend is cold.** The app is truthful now, but a totally empty operator account still produces sparse demo visuals.

### Bottom line
`main` is in better shape than the prior verifier note: build is green, localhost preview is up, canonical `/dashboard` renders cleanly, and auth/payload handling on agents/deployments is materially more truthful. Biggest remaining gap is not shell coherence anymore — it is the lack of one freshly proven signed-in operator walkthrough on the live canonical surfaces.
