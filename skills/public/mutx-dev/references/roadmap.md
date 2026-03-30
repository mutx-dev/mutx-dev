# MUTX Roadmap & Current Status

## Current Project Status

**Updated:** 2026-03-24

MUTX is in active development toward V1.0. The control plane API is functional, the dashboard is converging toward canonical surfaces, and the autonomy tooling is running disciplined ship cycles.

### What Is Built

**Backend (control-plane/):**
- ✅ FastAPI server with full `/v1/*` route surface
- ✅ Auth: JWT-based, ownership enforced on all agent endpoints (`fix/issue-1132` merged)
- ✅ Deployment lifecycle: create, restart, pause, resume, logs, metrics, events
- ✅ Run orchestration with trace support
- ✅ Monitoring routes (alerts, health) — SQL-safe queries fixed
- ✅ Webhook and API key management
- ✅ SDK (`MutxClient`) — sync client is functional
- ⚠️ `MutxAsyncClient` — not fully async (#114)

**Frontend (app/ at mutx-dev/mutx-dev):**
- ✅ Marketing site at `/` (multiple landing page revamps landed)
- ✅ Canonical dashboard at `/dashboard/*` — operators land here
- ✅ Dashboard nav: Agents, Deployments, Webhooks, API Keys, Logs, Monitoring, Analytics, Spawn
- ✅ Shell health chip reads "Control plane online"
- ✅ Legacy `/app/*` routes redirect to `/dashboard/*` via `middleware.ts`
- ✅ `app.mutx.dev` is the dedicated app host; marketing host redirects to it
- ✅ Monitoring shell ported from mutx-control
- ✅ Public OG image uses MUTX tagline
- ✅ Dashboard data contracts wired to live API proxy routes
- ✅ Canonical `/dashboard/deployments` surface with `Swarm` alias collapsed

**CLI + SDK:**
- ✅ CLI exists in `cli/commands/deploy.py` (partial surface)
- ⚠️ CLI lags backend API surface — see #117

**Infrastructure:**
- ✅ Docker Compose stack under `infrastructure/docker/`
- ✅ Railway deploy configs (`railway.json`, `railway-backend.json`, `railway-frontend.json`)
- ⚠️ Terraform cloud deploys (in progress)
- ⚠️ Helm/K8s charts (in progress)

**Autonomy:**
- ✅ Disciplined 3-worker fleet (Backend Executor, UI Executor, PR Healer, Shipper)
- ✅ Max 3 concurrent workers per repo rule (prevents rate limit cascades)
- ✅ Rate limit protocol: log → back off → retry once → fail gracefully
- ✅ State-first workflow with `mutx-fleet-state.md` and `autonomy-queue.json`

---

## Open Issues (autonomy:ready)

These are the issues labeled `autonomy:ready` — ready for autonomous execution.

### #117 — Close deployment surface parity drift across API, CLI, SDK, and docs

**Priority:** High
**Labels:** `area:api`, `area:cli-sdk`, `area:docs`, `autonomy:ready`

The backend exposes deployment create, restart, logs, metrics, and event-history routes, but CLI/SDK/docs still lag.

**Acceptance criteria:**
- CLI exposes supported deployment operations (or docs mark intentional omissions)
- SDK adds truthful deployment event-history support matching live payloads
- deployment docs match the real route set and create-path behavior
- focused contract coverage for create, restart, events, logs, and metrics

**Evidence files:** `src/api/routes/deployments.py:148,252,299,342,367`, `cli/commands/deploy.py:13`, `sdk/mutx/deployments.py:30`, `docs/api/deployments.md:7,9`

### #39 — Wire monitoring and self-healing into actual runtime behavior

**Priority:** Medium
**Labels:** `area:ops`, `area:api`, `autonomy:ready`

Monitoring and self-healing are scaffolding, not yet production behavior.

**Acceptance criteria:**
- monitoring/self-healing code paths are reachable and coherent
- runtime blockers in these paths are removed
- docs explain what is active vs aspirational

### #114 — Make MutxAsyncClient truthful or deprecate it

**Priority:** Medium
**Labels:** `area:cli-sdk`, `autonomy:ready`

`MutxAsyncClient` advertises async but some methods call sync `httpx` methods without awaiting.

**Evidence:** `sdk/mutx/__init__.py:94,105,114`, `sdk/mutx/agents.py:89,107`, `sdk/mutx/deployments.py:32`, `sdk/mutx/api_keys.py:48`, `sdk/mutx/webhooks.py:48`

**Acceptance criteria:**
- implement real async across the SDK surface, OR deprecate/remove `MutxAsyncClient`
- add contract coverage for async agents, deployments, API keys, and webhooks
- README and SDK docs truthful about which async methods are actually supported

### #115 — Fix local bootstrap scripts after Docker Compose relocation

**Priority:** Medium
**Labels:** `area:infra`, `area:docs`, `autonomy:ready`

Docker Compose moved from repo root to `infrastructure/docker/`, but bootstrap scripts still reference the old path.

**Evidence:** `scripts/dev.sh:8,64`, `scripts/setup.sh:21,24`, `AGENTS.md:44`, `Makefile`

**Acceptance criteria:**
- one supported local bootstrap command works from repo root
- helper scripts reference the real Compose file paths explicitly
- docs and repo guidance point to the same canonical entrypoint

### #112 — Enforce queue health and Codex review handoff in autonomy tooling

**Priority:** Low-Medium
**Labels:** `area:ops`, `area:docs`, `autonomy:ready`

Queue health must stay non-empty and every PR should get a `@codex please review` comment, but the tooling mostly summarizes instead of enforcing.

**Acceptance criteria:**
- automation detects and reports zero-PR / zero-ready-issue queue states
- PR creation adds `@codex please review` comment automatically
- queue status persisted somewhere actionable (not just ephemeral job summary)

---

## Other Active Issues

### UI Port (Ongoing)

- Source: `mutx-dev/mutx-control` (synced to builderz-labs v2.0.1)
- Target: `mutx-dev/mutx-dev` frontend
- Progress: Phase 2 complete (nav rail, dashboard shell, monitoring shell), Phase 3+ in progress
- v2.0.1 features pulled: GNAP sync engine, task-dispatch, i18n (10 languages)
- `sessions/` dropped — OpenClaw-specific deps not compatible with MUTX stack

### Auth Fix — Complete ✅

`fix/issue-1132` (`fix(auth): enforce ownership on all agent endpoints`) landed on `mutx-dev/main` at commit `2e682807`. All agent endpoints now enforce ownership.

---

## Known Issues

| # | Title | Workaround |
|---|-------|-----------|
| #114 | SDK async contract false advertising | Use `MutxClient` (sync) or await only confirmed-async methods |
| #115 | Bootstrap scripts broken after Compose relocation | Use `infrastructure/docker/docker-compose.yml` explicitly |
| #39 | Monitor/self-heal wiring incomplete | Agents should implement own heartbeat until wired |
| #117 | CLI/SDK/docs lag deployment API | Only use confirmed-working backend routes |
| #112 | Queue health not enforced | Monitor `autonomy-queue.json` manually |

---

## Current Priorities (2026-03-24)

1. **Deployment surface parity** (#117) — API is done; CLI/SDK/docs need to catch up
2. **SDK async truthfulness** (#114) — Either fix or deprecate `MutxAsyncClient`
3. **Local bootstrap fix** (#115) — Update scripts to use new Compose path
4. **Continue UI port** — Port more components from mutx-control, wire live data
5. **Monitoring self-healing** (#39) — Connect alert → runtime hooks

### Disciplined Worker Fleet (Active)

- `MUTX Backend Executor v1` — backend/UI unblocker (quarantined: needs prompt fix + clean pass)
- `MUTX UI Executor v1` — frontend porting (paused: waiting for backend data contracts)
- `MUTX PR Healer v2` — fix PR conflicts
- `MUTX Shipper v2` — merge green, conflict-free, non-draft, policy-clean PRs
- `MUTX PR Opener v1` — open PRs for claimed issues
- `MUTX Auditor v1` — periodic health checks
- `MUTX Self-Healer v1` — fix broken worker prompts
- `MUTX Researcher v1` — research and context

---

## Ship Criteria

Every PR must be simultaneously:
- ✅ GREEN CI (all checks passing)
- ✅ CONFLICT-FREE (rebased onto latest `main`)
- ✅ NON-DRAFT
- ✅ POLICY-CLEAN (no `needs-improvement` label)

## What "Done" Looks Like for V1.0

- [ ] Deployment surface parity across API, CLI, SDK, docs
- [ ] SDK async contract is honest
- [ ] Bootstrap scripts work from fresh checkout
- [ ] Queue health is enforced by tooling
- [ ] Monitoring → self-healing wiring is production-ready
- [ ] All `autonomy:ready` issues resolved
- [ ] CI is green on `main` and all PRs
- [ ] Frontend `npm run build` passes cleanly
- [ ] Helm/K8s charts production-ready
