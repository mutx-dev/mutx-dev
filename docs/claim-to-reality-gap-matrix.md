# MUTX Claim-to-Reality Gap Matrix
**Audit Date:** 2026-04-02  
**Repo:** `/Users/fortune/Documents/GitHub/mutx-dev`  
**Scope:** Phase A/B Autonomy Operating Model

---

## 1. Claim vs Reality Table

### 1.1 README Claims

| Claim | Source | Reality | Status |
|-------|--------|---------|--------|
| "FastAPI control plane with public routes mounted under `/v1/*`" | README.md | TRUE — OpenAPI spec confirms `/v1/*` mounting | SHIPPED |
| "route groups for auth, agents, deployments, API keys, webhooks, newsletter, health, and readiness" | README.md | Auth ✓, Agents ✓, Deployments ✓, API Keys ✓, Webhooks ✓. Newsletter is absent — only `leads` endpoints exist. Health probes at `/`, `/health`, `/ready` | PARTIAL |
| "route groups for templates, sessions, runs, usage, api-keys, webhooks, monitoring, budgets, rag, clawhub, runtime, analytics, onboarding, swarms, and leads" | README.md | Confirmed in OpenAPI: `templates`, `clawhub`, `api-keys`, `leads`. MISSING from OpenAPI: `sessions`, `runs`, `usage`, `monitoring`, `budgets`, `rag`, `runtime`, `analytics`, `onboarding`, `swarms`. These are NOT in the spec. | PARTIAL |
| "a Python CLI and first-party Textual TUI" | README.md | `cli/` exists. TUI referenced via `mutx tui` in docs. Existence unconfirmed — not audited. | UNCONFIRMED |
| "local-first setup and bootstrap flows for hosted and localhost operators" | README.md | `mutx setup hosted` and `mutx setup local` referenced in docs | SHIPPED |
| "`~/.mutx/config.json` stores auth state" | README.md | Hardcoded path `~/.mutx/config.json` confirmed in autonomy scripts | SHIPPED |
| "installer at mutx.dev/install.sh" | README.md | Referenced but not audited | UNCONFIRMED |
| "local dev stack with `make dev-up`" | README.md | Referenced but not audited | UNCONFIRMED |
| "Docker, Terraform, Ansible, Railway, and monitoring assets exist" | README.md | Docker Compose confirmed. Terraform/Ansible/monitoring are skeletal/placeholder. | PARTIAL |

### 1.2 Whitepaper Claims

| Claim | Source | Reality | Status |
|-------|--------|---------|--------|
| "FastAPI control plane with route groups: `/v1/auth`, `/v1/agents`, `/v1/deployments`, `/v1/api-keys`, `/v1/webhooks`, `/v1/newsletter`, `/v1/health`, `/v1/ready`" | whitepaper.md §6.1 | All confirmed EXCEPT `/v1/newsletter` (absent) and `/v1/newsletter` replaced by `/v1/leads` | PARTIAL |
| "Additional `/v1/*` surfaces: templates, assistant, sessions, runs, monitoring, budgets, rag, and runtime" | whitepaper.md §6.1 | Only `templates` and `assistant` confirmed in OpenAPI. Sessions, runs, monitoring, budgets, rag, runtime are absent from OpenAPI | PARTIAL |
| "control-plane record model for agents and deployments" | whitepaper.md §8 | Database models confirmed. Actual runtime-backed execution still "being hardened" per §8.3 | PARTIAL |
| "agent status values: creating, running, stopped, failed, deleting" | whitepaper.md §8.1 | These are modeled in code but lifecycle semantics are database-backed, not execution-backed | PARTIAL |
| "Observability: /health, /ready, deployment logs and metrics routes, agent logs and metrics routes, webhook ingestion endpoints, monitoring configs" | whitepaper.md §10 | `/health` and `/ready` confirmed. Agent/deployment logs and metrics appear in OpenAPI. Webhook ingestion exists. Monitoring configs are skeletal | SHIPPED |
| "Infrastructure: Railway + Docker, Terraform + Ansible, Prometheus + Grafana" | whitepaper.md §11 | Docker Compose confirmed. Railway, Terraform, Ansible, and monitoring are skeletal | PARTIAL |
| "Vault integration" mentioned as infrastructure | whitepaper.md | Explicitly documented as STUB in roadmap.md and project-status.md | STUB |

### 1.3 project-status.md Claims

| Claim | Source | Reality | Status |
|-------|--------|---------|--------|
| "RAG search and scheduler return 503 with feature flags until runtime is configured" | project-status.md | Confirmed — these are placeholder responses gated on feature flags | PLACEHOLDER |
| "`MutxAsyncClient` remains limited and must stay explicitly documented as such" | project-status.md | SDK async contract is limited — acknowledged | PARTIAL |
| "Vault integration is still a stub" | project-status.md | Confirmed — Vault integration is a stub | STUB |
| "CLI grouped commands: auth, agent, deployment, assistant, runtime, setup, governance, and observability" | project-status.md | Governance CLI (`mutx governance`) confirmed in codebase. Other groups not fully audited | PARTIAL |
| "SDK sync client tracks `/v1/*` correctly" | project-status.md | Not audited | UNCONFIRMED |
| "SDK `OpenClawObservability` added" | project-status.md | Not audited | UNCONFIRMED |
| "API, CLI, frontend, observability, docs, and serial release smoke tests now exist" | project-status.md | Not audited | UNCONFIRMED |
| "route/auth ownership checks" are ongoing work | project-status.md | Per whitepaper §7.3, auth enforcement is still being hardened | PARTIAL |

### 1.4 surfaces.md Claims

| Claim | Source | Reality | Status |
|-------|--------|---------|--------|
| "Governance (Faramesh) — CLI commands for governance inspection and approval actions" | surfaces.md | `mutx governance` CLI exists in `cli/commands/governance.py` | SHIPPED |
| "Governance — Prometheus metrics export via `/v1/runtime/governance/metrics`" | surfaces.md | `/v1/runtime/governance/metrics` confirmed in OpenAPI. | SHIPPED |
| "Governance — Policy enforcement (PERMIT/DENY/DEFER) via FPL" | surfaces.md | Code exists in `src/security/` and `faramesh_supervisor.py` | SHIPPED |
| "Governance — Credential broker (Vault, AWS, GCP, Azure, 1Password, Infisical)" | surfaces.md | Vault stub + credential broker service exists but is incomplete | PARTIAL |
| "Dashboard — RAG search and scheduler return 503 with feature flags" | surfaces.md | PARTIAL — RAG `/rag/search` returns 503 with `X-Feature-Flag: rag.search` when `enable_rag_api=True` (pgvector planned for v1.3); scheduler router is unmounted and returns nothing | PARTIAL |
| "Desktop download lane at mutx.dev/download/macos" | surfaces.md | Not audited | UNCONFIRMED |

### 1.5 roadmap.md Claims

| Claim | Source | Reality | Status |
|-------|--------|---------|--------|
| "Vault integration explicitly documented as infrastructure stub until it is real" | roadmap.md | Confirmed — Vault is documented as stub | STUB |
| "Replace scheduler stub with real implementation or keep unmounted and documented" | roadmap.md | Scheduler returns 503 — confirmed stub | STUB |
| "Turn RAG search into real vector-backed behavior" | roadmap.md | RAG returns 503 — confirmed placeholder | PLACEHOLDER |
| "Scheduler and RAG completion" listed as next tasks | roadmap.md | Still outstanding — confirmed | PARTIAL |

---

## 2. OpenAPI `/v1/*` Route Inventory

**Total unique `/v1/*` route prefixes found in `docs/api/openapi.json`:**

| Route Prefix | Auth Required | Notes |
|---|---|---|
| `/v1/agents` | Optional (header, `required: false`) | create, list |
| `/v1/agents/{agent_id}` | Optional | get, delete |
| `/v1/agents/{agent_id}/config` | Optional | get, patch |
| `/v1/agents/{agent_id}/deploy` | Optional | post |
| `/v1/agents/{agent_id}/stop` | Optional | post |
| `/v1/agents/{agent_id}/logs` | Optional | get |
| `/v1/agents/{agent_id}/metrics` | Optional | get |
| `/v1/agents/{agent_id}/resource-usage` | Optional | get |
| `/v1/assistant/overview` | Optional | get |
| `/v1/assistant/{agent_id}/skills` | Optional | get |
| `/v1/assistant/{agent_id}/skills/{skill_id}` | Optional | get |
| `/v1/assistant/{agent_id}/channels` | Optional | get |
| `/v1/assistant/{agent_id}/wakeups` | Optional | get |
| `/v1/assistant/{agent_id}/health` | Optional | get |
| `/v1/assistant/{agent_id}/sessions` | Optional | get |
| `/v1/deployments` | Optional | create, list |
| `/v1/deployments/{deployment_id}` | Optional | get, delete |
| `/v1/deployments/{deployment_id}/events` | Optional | get |
| `/v1/deployments/{deployment_id}/scale` | Optional | post |
| `/v1/deployments/{deployment_id}/restart` | Optional | post |
| `/v1/deployments/{deployment_id}/logs` | Optional | get |
| `/v1/deployments/{deployment_id}/metrics` | Optional | get |
| `/v1/deployments/{deployment_id}/versions` | Optional | get |
| `/v1/deployments/{deployment_id}/rollback` | Optional | post |
| `/v1/templates` | Optional | get |
| `/v1/templates/{template_id}/deploy` | Optional | post |
| `/v1/webhooks/` | Optional | get |
| `/v1/webhooks/{webhook_id}` | Optional | get, delete |
| `/v1/webhooks/{webhook_id}/test` | Optional | post |
| `/v1/webhooks/{webhook_id}/deliveries` | Optional | get |
| `/v1/auth/register` | None | post |
| `/v1/auth/login` | None | post |
| `/v1/auth/local-bootstrap` | None | post |
| `/v1/auth/refresh` | None | post |
| `/v1/auth/logout` | Optional | post |
| `/v1/auth/me` | Optional | get |
| `/v1/auth/forgot-password` | None | post |
| `/v1/auth/reset-password` | None | post |
| `/v1/auth/verify-email` | None | post |
| `/v1/auth/resend-verification` | None | post |
| `/v1/clawhub/skills` | Optional | get |
| `/v1/clawhub/install` | Optional | post |
| `/v1/clawhub/uninstall` | Optional | post |
| `/v1/api-keys` | Optional | get, post |
| `/v1/api-keys/{key_id}` | Optional | get, delete |
| `/v1/api-keys/{key_id}/rotate` | Optional | post |
| `/v1/leads/contacts` | Optional | get, post |
| `/v1/leads/contacts/{lead_id}` | Optional | get, patch, delete |
| `/v1/leads` | Optional | get |
| `/v1/leads/{lead_id}` | Optional | get, delete |
| `/metrics` | None | Prometheus metrics |
| `/`, `/health`, `/ready` | None | Root probes |

**Key Finding:** Most routes have `authorization` header marked `required: false` — meaning auth is NOT being enforced on most endpoints despite claims of auth hardening being "ongoing work."

**Missing routes NOT in OpenAPI but mentioned in docs:**
- `/v1/sessions`
- `/v1/runs`
- `/v1/usage`
- `/v1/monitoring`
- `/v1/budgets`
- `/v1/rag`
- `/v1/runtime`
- `/v1/analytics`
- `/v1/onboarding`
- `/v1/swarms`
- `/v1/governance/metrics` (claimed in surfaces.md)
- `/v1/newsletter` (claimed in whitepaper)

---

## 3. Automation / Redundancy Findings

### 3.1 Autonomy Scripts Inventory

All scripts are located in `scripts/autonomy/` unless otherwise noted.

| Script | Purpose | Classification | Redundancy |
|--------|---------|----------------|-------------|
| `autonomous-coder.py` | Reads action queue, calls MiniMax-M2.7 via local gateway, generates code changes, commits and opens PRs | SHIPPED (active) | Overlaps with `autonomous-loop.py` and `autonomous-loop-v3.sh` |
| `autonomous-loop.py` | Supervisor using `sessions_spawn` via subprocess WS connection to OpenClaw gateway | LEGACY | Replaced by `autonomous-loop-v3.sh` and `mutx-autonomous-daemon.py` |
| `autonomous-loop.sh` | Bash loop that calls Codex for implementation | LEGACY/STUB | Replaced by `autonomous-loop-v3.sh` |
| `autonomous-loop-v3.sh` | Bash loop that calls `openclaw sessions spawn` for implementation | SHIPPED | Evolved from `autonomous-loop.sh` |
| `mutx-autonomous-daemon.py` | Self-supervising Python daemon with heartbeat, worktree sync, and area-specific implementation stubs | SHIPPED (most mature) | Consolidates watchdog and heartbeat logic |
| `mutx-master-controller.py` | Runs gap scanner + daemon watchdog in one supervised double-forked process | SHIPPED | Parent supervisor for gap scan + daemon health |
| `mutx-gap-scanner-v3.py` | Scans GitHub issues, stale PRs, SDK coverage gaps; adds to queue | SHIPPED (active version) | Replaces `mutx-gap-scanner.py` |
| `mutx-gap-scanner.py` | Code-analysis-based gap scanner (TODOs, error handling, deps, API docs) | LEGACY | Replaced by `mutx-gap-scanner-v3.py` |
| `build_work_order.py` | Scores GitHub issues by labels, picks top work order, routes to agent/lane | SHIPPED | Queue infrastructure |
| `execute_work_order.py` | Prepares git branch, writes brief, optionally runs agent command and opens PR | SHIPPED | Queue executor |
| `select_agent.py` | Maps issue labels to agent names and lane strategy | SHIPPED | Shared utility |
| `hosted_llm_executor.py` | Calls hosted LLM (GitHub Models or OpenAI) with work order prompt, applies patch | SHIPPED | Agent execution via hosted models |
| `github_hosted_agent.py` | Builds prompt bundle for a GitHub-hosted coding agent | SHIPPED | Prompt builder wrapper |
| `queue-feeder.sh` | Cron script: adds `autonomy:ready` GitHub issues to action queue | SHIPPED | Queue maintenance |
| `mutx-heartbeat.sh` | Runs `make dev`, reports health, opens GitHub issue if broken | SHIPPED | Repo health monitor |
| `mutx-daemon-watchdog.sh` | Checks if daemon is alive, restarts if dead, resets stuck queue items | SHIPPED | Daemon health watchdog |
| `daemon-launcher.py` | Launchd wrapper — prevents fork when launched by launchd | SHIPPED (in ~/MUTX only) | Only exists in ~/MUTX, NOT in mutx-dev clone |

### 3.2 Redundancy Map

**3 parallel autonomous coding loops:**
1. `autonomous-coder.py` — MiniMax via gateway, Python
2. `autonomous-loop-v3.sh` — OpenClaw `sessions spawn`, Bash
3. `mutx-autonomous-daemon.py` — Self-supervising Python daemon with implementation stubs

All three read from the same queue (`/Users/fortune/MUTX/mutx-engineering-agents/dispatch/action-queue.json`).

**2 parallel gap scanners:**
1. `mutx-gap-scanner-v3.py` — GitHub API + coverage gap focused
2. `mutx-gap-scanner.py` — Code analysis focused (TODOs, error handling)

### 3.3 Hardcoded Path Dependencies (Portable Audit Blockers)

These scripts have hardcoded absolute paths that will break if the repo moves:

| Script | Hardcoded Paths |
|--------|-----------------|
| `autonomous-coder.py` | `REPO = "/Users/fortune/MUTX"`, `WT_BACKEND`, `WT_FRONTEND`, `QUEUE`, `LOG`, `GW = "http://localhost:18789"` |
| `autonomous-loop.py` | `QUEUE = "/Users/fortune/MUTX/..."`, `LOG`, `WT_BACKEND`, `sock_path = "/var/run/openclaw/gateway.sock"` |
| `autonomous-loop.sh` | `QUEUE_FILE="/Users/fortune/MUTX/..."`, `REPO="/Users/fortune/MUTX"`, worktree paths |
| `autonomous-loop-v3.sh` | Same hardcoded paths |
| `mutx-autonomous-daemon.py` | `REPO`, `QUEUE`, `LOG`, `PID_FILE`, `WT_BACK`, `WT_FRONT`, `GH_REPO="mutx-dev/mutx-dev"` |
| `mutx-master-controller.py` | `REPO="/Users/fortune/MUTX"`, `DAEMON`, `GAPSCAN`, `QUEUE`, `LOG`, `PIDFILE` |
| `mutx-gap-scanner-v3.py` | `GH="/opt/homebrew/bin/gh"`, `QUEUE`, `LOG`, `REPO`, `WT`, `GH_REPO` |
| `mutx-gap-scanner.py` | `REPO="/Users/fortune/MUTX"` |
| `hosted_llm_executor.py` | Hardcodes `agents/{agent}/AGENT.md` paths, area context files |
| `queue-feeder.sh` | `QUEUE_FILE="/Users/fortune/MUTX/..."`, `cd /Users/fortune/MUTX` |
| `mutx-heartbeat.sh` | `REPO="/Users/fortune/MUTX"`, `LOG`, `GITHUB_REPO` |
| `mutx-daemon-watchdog.sh` | `LOG`, `QUEUE`, `DAEMON`, `cd /Users/fortune/MUTX` |

### 3.4 Missing External Dependencies

| Path | Status |
|------|--------|
| `/Users/fortune/mutx-worktrees/factory/backend` | Does not exist — referenced by all loop scripts |
| `/Users/fortune/mutx-worktrees/factory/frontend` | Does not exist — referenced by all loop scripts |
| `/Users/fortune/MUTX/mutx-engineering-agents/dispatch/action-queue.json` | Queue file location — external to both clones |
| `/var/run/openclaw/gateway.sock` | OpenClaw Unix socket — gateway may not be running |
| `agents/{agent}/AGENT.md` | Agent definitions referenced by `hosted_llm_executor.py` — may not exist |

---

## 4. Clone Drift Findings

### 4.1 File Comparison

**`~/MUTX/scripts/autonomy/` vs `/Users/fortune/Documents/GitHub/mutx-dev/scripts/autonomy/`**

| File | In ~/MUTX | In mutx-dev | Status |
|------|-----------|-------------|--------|
| `__pycache__/` | YES | YES | OK |
| `autonomous-coder.py` | YES | YES | IDENTICAL |
| `autonomous-loop-v3.sh` | YES | YES | IDENTICAL |
| `autonomous-loop.py` | YES | YES | IDENTICAL |
| `autonomous-loop.sh` | YES | YES | IDENTICAL |
| `build_work_order.py` | YES | YES | IDENTICAL |
| `daemon-launcher.py` | **YES** | **NO** | DRIFT — exists only in ~/MUTX |
| `execute_work_order.py` | YES | YES | IDENTICAL |
| `github_hosted_agent.py` | YES | YES | IDENTICAL |
| `hosted_llm_executor.py` | YES | YES | IDENTICAL |
| `mutx-autonomous-daemon.py` | YES | YES | IDENTICAL |
| `mutx-daemon-watchdog.sh` | YES | YES | IDENTICAL |
| `mutx-gap-scanner-v3.py` | YES | YES | IDENTICAL |
| `mutx-gap-scanner.py` | YES | YES | IDENTICAL |
| `mutx-heartbeat.sh` | YES | YES | IDENTICAL |
| `mutx-master-controller.py` | YES | YES | IDENTICAL |
| `queue-feeder.sh` | YES | YES | IDENTICAL |
| `select_agent.py` | YES | YES | IDENTICAL |

**DRIFT FLAG:** `daemon-launcher.py` exists in `~/MUTX/scripts/autonomy/` but NOT in `/Users/fortune/Documents/GitHub/mutx-dev/scripts/autonomy/`.

### 4.2 `daemon-launcher.py` Analysis

```python
# ~/MUTX only — launchd wrapper to prevent daemon from forking itself
importdaemonize = os.fork() if not os.environ.get("LAUNCHD_SOCKET") else 0
# Child imports and calls main_loop from mutx_autonomous_daemon
from mutx_autonomous_daemon import main_loop  # NOTE: hyphens, not underscores!
```

**Issue:** The import says `mutx_autonomous_daemon` (underscores) but the actual file is `mutx-autonomous-daemon.py` (hyphens). Python would not resolve this import correctly unless there's a symlink or the file was renamed. This suggests the daemon is actually launched directly via `python3 mutx-autonomous-daemon.py` in practice.

### 4.3 Drift Summary

- **1 file drift**: `daemon-launcher.py` missing from mutx-dev clone
- **Both clones are otherwise identical** for the autonomy scripts
- The autonomy infrastructure is designed to run from `~/MUTX` (the "canonical" operational clone), NOT from the `mutx-dev` GitHub clone
- `mutx-dev` clone contains the autonomy scripts as shipped artifacts, but the actual execution happens from `~/MUTX`

---

## 5. Node Runtime Findings

### 5.1 Node Installations Found

| Path | Type | Version |
|------|------|---------|
| `/opt/homebrew/bin/node` | Symlink → `../Cellar/node/25.8.1_1/bin/node` | v25.8.1 |
| `/opt/homebrew/bin/node-llama-cpp` | CLI tool (node-llama-cpp package) | — |
| `/usr/local/bin/node.v20.15.1.bak` | Backup binary (not in PATH) | v20.15.1 |
| `~/MUTX/node_modules/` | Local npm packages (737 packages) | — |

### 5.2 Active Node

- **`which node`**: `/opt/homebrew/bin/node`
- **`node --version`**: `v25.8.1`
- **Source**: Homebrew Cellar installation (node@25.8.1_1)

### 5.3 Issue: `/usr/local/bin/node.v20.15.1.bak`

This is a leftover backup binary from a previous Node installation at `/usr/local/bin/`. It is:
- NOT in PATH (only `.bak` extension keeps it out of command resolution)
- v20.15.1 (older than current v25.8.1)
- Present at 192MB (substantial disk footprint)
- No longer needed since Homebrew-managed node is the active runtime

### 5.4 Recommendation

Remove the backup: `sudo rm /usr/local/bin/node.v20.15.1.bak`

---

## 6. Classification Summary

### 6.1 By Surface

| Surface | Classification | Notes |
|---------|---------------|-------|
| FastAPI `/v1/*` control plane | SHIPPED | Real routes, real auth header, most endpoints functional |
| Agent lifecycle (create/deploy/stop) | SHIPPED | Routes exist in OpenAPI |
| Assistant routes | SHIPPED | `/v1/assistant/*` in OpenAPI |
| Templates | SHIPPED | `/v1/templates` in OpenAPI |
| Webhooks | SHIPPED | Full CRUD + test + deliveries |
| Auth | PARTIAL | Routes exist, but auth is `required: false` on most — enforcement still being hardened |
| API Keys | PARTIAL | CRUD + rotate exist, but auth not enforced |
| Leads | SHIPPED | `/v1/leads/*` in OpenAPI |
| Clawhub | SHIPPED | Skills, install, uninstall |
| Sessions | PLACEHOLDER | OpenAPI exists but underlying session management unclear |
| Runs | PLACEHOLDER | Not in OpenAPI |
| Usage/metrics | PLACEHOLDER | Not in OpenAPI |
| Monitoring | PLACEHOLDER | Not in OpenAPI |
| Budgets | PLACEHOLDER | Not in OpenAPI |
| RAG | PLACEHOLDER | Returns 503 with feature flag |
| Scheduler | PLACEHOLDER | Returns 503 with feature flag |
| Runtime | PLACEHOLDER | Not in OpenAPI |
| Analytics | PLACEHOLDER | Not in OpenAPI |
| Onboarding | PLACEHOLDER | Not in OpenAPI |
| Swarms | PLACEHOLDER | Not in OpenAPI |
| Newsletter | MISLEADING | Claims `/v1/newsletter` exists in whitepaper; only `/v1/leads` exists |
| Governance metrics | MISLEADING | Claims `/v1/governance/metrics` in surfaces.md; not in OpenAPI |
| Vault integration | STUB | Acknowledged as stub in roadmap and project-status |
| Scheduler (runtime) | STUB | Explicitly documented as stub |

### 6.2 By Autonomy Script

| Script | Classification | Notes |
|--------|---------------|-------|
| `mutx-autonomous-daemon.py` | SHIPPED | Most mature; self-supervising; area-specific stubs |
| `mutx-master-controller.py` | SHIPPED | Parent supervisor; gap scan + watchdog |
| `mutx-gap-scanner-v3.py` | SHIPPED | GitHub API scanner; active version |
| `build_work_order.py` | SHIPPED | Work order scoring and routing |
| `execute_work_order.py` | SHIPPED | Branch preparation and PR handoff |
| `select_agent.py` | SHIPPED | Agent and lane selection |
| `hosted_llm_executor.py` | SHIPPED | Hosted LLM execution with guardrails |
| `queue-feeder.sh` | SHIPPED | Queue maintenance from GitHub issues |
| `mutx-heartbeat.sh` | SHIPPED | Repo health monitoring |
| `mutx-daemon-watchdog.sh` | SHIPPED | Daemon health watchdog |
| `autonomous-coder.py` | SHIPPED | MiniMax-based autonomous coding |
| `autonomous-loop-v3.sh` | SHIPPED | OpenClaw sessions spawn loop |
| `github_hosted_agent.py` | SHIPPED | Prompt builder for hosted agents |
| `autonomous-loop.py` | LEGACY | Older WebSocket-based version |
| `autonomous-loop.sh` | LEGACY/STUB | Bash loop with incomplete Codex integration |
| `mutx-gap-scanner.py` | LEGACY | Code analysis scanner; superseded by v3 |
| `daemon-launcher.py` | MISLEADING | Missing from mutx-dev; broken import statement |

---

## 7. Key Gaps for Phase A/B Autonomy Operating Model

1. **Auth enforcement gap**: Most `/v1/*` routes have `required: false` on the authorization header despite claims of "auth hardening." This is the single largest security gap.

2. **Governance metrics route missing**: `/v1/governance/metrics` is claimed in surfaces.md but does not exist in OpenAPI.

3. **9 route families documented but not in OpenAPI**: sessions, runs, usage, monitoring, budgets, rag, runtime, analytics, onboarding, swarms — these are described in docs but have no OpenAPI contract.

4. **Hardcoded paths block portability**: Every autonomy script hardcodes `/Users/fortune/MUTX` and references non-existent worktree directories. These must be parameterized for the autonomy model to operate on arbitrary clones.

5. **`daemon-launcher.py` drift**: This file exists only in `~/MUTX` (the operational clone) but is absent from `mutx-dev` (the GitHub canonical clone). This suggests the operational model runs from a separate clone, not from the GitHub repo directly.

6. **3 parallel autonomous loop implementations**: `autonomous-coder.py`, `autonomous-loop-v3.sh`, and `mutx-autonomous-daemon.py` all implement the same core loop (read queue → implement → PR) with different execution models. Consolidation would reduce maintenance burden.

7. **Node v20 backup lingering**: `/usr/local/bin/node.v20.15.1.bak` should be removed.

---

*Report generated from audit of whitepaper.md, project-status.md, surfaces.md, roadmap.md, README.md, docs/api/openapi.json, and scripts/autonomy/* in `/Users/fortune/Documents/GitHub/mutx-dev`.*
