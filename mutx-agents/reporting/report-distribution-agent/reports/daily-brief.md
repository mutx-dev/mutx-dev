# Daily Brief — 2026-03-29

**Reporting lane refresh: 2026-03-29 20:45 Europe/Rome**

---

## MATERIAL BLOCKERS FOR FORTUNE (read first)

### 1. SSH hardening — decision needed today
`provision.yml:10` still has `admin_cidr = 0.0.0.0/0`. `inventory.ini:13` still has `StrictHostKeyChecking=no`. Security-engineer lane has confirmed the risk and the fix. One decision: `accept-new` as the SSH baseline. No code needed from you yet — just the call.

### 2. Gateway hardening patch — unapproved after 4 passes
Infrastructure-maintainer has surfaced the same hardening patch since 08:06 this morning. `agents.defaults.sandbox.mode="all"`, `tools.fs.workspaceOnly=true`, `tools.exec.security="allowlist"` + ask. Either approve it or explicitly name the operating model (single-operator, local-only) so the lane can lock it down differently.

---

## Strongest lanes (keep)
- **GTM signal / outside-in**: STRONG. Gartner named governance failure the #1 deployment risk ($58B shakeup, 50% of agent deployments will fail). "Runtime path evaluation" is the new permission model language. Evidence is fresh and specific.
- **GTM outbound / sales / account**: STRONG. All three updated with Gartner framing and runtime path evaluation. Sales-brief.md and account-brief.md are current.
- **Product / frontend / technical-writer**: STRONG. Queue clear. `/dashboard` truth strip tied to `#39` is the right next product move.
- **Build / ai-engineer**: CLEAR. Queue empty. Runtime health truth pass is the next dispatch — bounded and shippable.

---

## Weak / idle lanes
- **X distribution**: manual-only, conservative. No active work. State unchanged.
- **Developer-advocate**: THIN. Next dispatch slice unnamed — lane is unblocked but waiting on direction.
- **Workflow-architect**: THIN. SDK deployment-history parity gap still open. Not blocked by queue, blocked by a contract decision.
- **Social-media-strategist**: proof stack not assembled. Needs screenshots from `/dashboard/security`, `/dashboard/monitoring`, `/dashboard/budgets` — these need to be pulled.

---

## Evidence cited
- `roundtable.md` @ 2026-03-29 20:10 Europe/Rome — all three PRs (#1211, #1210, #1209) merged; queue empty
- `signal-brief.md` @ 2026-03-29 18:20 Europe/Rome — Gartner $58B, runtime path evaluation, $470M agent GDP
- `security-engineer/reports/latest.md` @ 2026-03-29 21:15 Europe/Rome — SSH gap confirmed in `provision.yml` and `inventory.ini`
- `infrastructure-maintainer/reports/latest.md` @ 2026-03-29 20:05 Europe/Rome — hardening patch on Fortune's desk since 08:06, no decision after 4 passes

---

## One decision Fortune can make today
**Pick `accept-new` for SSH hardening** — the security-engineer lane closes the gap across all four files once you call it. This is the last named security gap in the fleet.

---

## One lane to keep, one to rewire or downshift
- **Keep**: GTM signal lane — the Gartner framing is live and specific, the proof is accumulating, and it is directly usable in enterprise conversations starting now.
- **Rewire**: infrastructure-maintainer — the hardening patch has been on your desk for 12+ hours across 4 passes. Either approve it or explicitly decline and name the operating model so the lane can close. Continuing to let it sit creates operator exposure without resolution.
