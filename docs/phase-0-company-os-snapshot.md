# Phase 0 — Company OS Forensic Snapshot
**Created:** 2026-04-03 07:17 UTC  
**Purpose:** Full-state restore point before rewriting system into company-os

---

## 1. Cron Jobs (OpenClaw)

| ID | Name | Schedule | Status | Target |
|----|------|----------|--------|--------|
| 352dcb50-e0f1-4403-9193-7051161bfba2 | MUTX CTO Signal Monitor | cron 0 */4 * * * @ Europe/Rome | ERROR | isolated |

**Notes:**
- Only 1 cron job is active
- Previous 8+ cron jobs (alpha-accumulator, daily-alpha, trading-ideas, etc.) are GONE
- The "MUTX CTO Signal Monitor" cron is in error state — needs investigation
- No email-digest, calendar-standup, x-self-improve, weekly-review, weekend-outlook, market-monitor crons exist

---

## 2. LaunchAgents

| File | Loaded | Running | Notes |
|------|--------|---------|-------|
| ai.openclaw.mutx-autonomous.plist | NO | N/A | Was orphaned, disabled Apr 1 |
| ai.openclaw.mutx-gap-scanner.plist | NO | N/A | Disabled Apr 2 |
| ai.openclaw.mutx-master-controller.plist | NO | N/A | Shows "-" in launchctl list |
| ai.openclaw.mutx-mlx-rag.plist | YES | YES (PID 72292) | ONLY live LaunchAgent |
| ai.openclaw.mutx-watchdog.plist | NO | N/A | Disabled Apr 2 |

**Notes:**
- ONLY mlx-rag is actually running under launchd
- mutx-master-controller.py IS running (PID 36076) but NOT via launchd — manually started and orphaned
- mutx-control-plane.py IS running (PID 33662) but NOT via launchd — orphaned daemon
- mutx-autonomous-daemon is confirmed DEAD (from audit)

---

## 3. Active Processes

```
PID 72292: mlx-rag-service.py           ✅ LIVE (mlx-rag LaunchAgent)
PID 36076: mutx-master-controller.py    ✅ LIVE (but orphaned — not launchd)
PID 33662: mutx-control-plane.py        ✅ LIVE (orphaned daemon)
PID 25761: faramesh serve               ✅ LIVE (Faramesh policy server)
```

**Zombie/Orphaned:**
- mutx-autonomous-daemon — DEAD (from audit, not in process list)
- mutx-gap-scanner.py — not running (LaunchAgent not loaded)
- mutx-daemon-watchdog.sh — not running
- The old `while true` python loop dispatch/task-watcher on PID 52940 — seems abandoned

---

## 4. Repository State

| Repo | SHA | Latest Commit |
|------|-----|---------------|
| MUTX main | 86450f1c621b7b9d941118d843a1f470d313009a | feat: gap scan signals output |
| Worktree backend | 86450f1c621b7b9d941118d843a1f470d313009a | feat: gap scan signals output |

**Both at same SHA — worktree is synced to MUTX main**

---

## 5. Skills Inventory

### Workspace Skills (36)
```
adaptive-reasoning, agent-memory, agent-memory-patterns, agent-memory-store,
agent-orchestrator, agent-team-orchestration, ai-researcher, alpha-finder,
claw-swarm, crypto-cog, crypto-market-data, crypto-whale-monitor,
deep-thinking, discord-hub, email-daily-summary, ethereum-wingman,
evm-wallet, hyperliquid-trading, learning, market-research-agent,
onchain, portfolio-risk-analyzer, proactive-agent-lite, proactive-agent-skill,
proactive-solvr, self-improving, self-improving-agent, solana-basics,
solana-dev-skill, trading-research, x-api, x-twitter
```

### OpenClaw Built-in Skills (6)
```
agent-reach, council, firecrawl, firecrawl-*, opencode
```

### Agent Directory
- `/Users/fortune/.openclaw/workspace/agents/` — **DOES NOT EXIST**
- No agent manifests, no role definitions

---

## 6. Autonomy Scripts (MUTX/scripts/autonomy/)

### Working
- `autonomous-coder.py` — coding agent runner
- `github_hosted_agent.py` — GitHub-hosted agent executor
- `hosted_llm_executor.py` — LLM execution wrapper
- `mutx-master-controller.py` — **RUNNING (but orphaned)**
- `select_agent.py` — agent selector

### Broken / Deprecated
- `autonomous-loop.py`, `autonomous-loop.sh`, `autonomous-loop-v3.sh` — old daemon loops (use mutx-master-controller.py now)
- `mutx-autonomous-daemon.py` — **DEAD** (confirmed by audit)
- `mutx-daemon-watchdog.sh` — orphaned watchdog
- `mutx-gap-scanner.py`, `mutx-gap-scanner-v3.py` — old scanners (use v4)
- `mutx-heartbeat.sh` — old heartbeat (replaced by HEARTBEAT.md pattern)
- `queue-feeder.sh` — appears deprecated
- `build_work_order.py`, `execute_work_order.py` — work order system (may be unused)

### Supporting
- `scripts/mlx-rag-service.py` — MLX RAG HTTP API (port 18792, ✅ LIVE)

---

## 7. Signal / Queue / State Files

| Path | Status |
|------|--------|
| `signals/gap-scan signal.md` | EXISTS (updated by master controller) |
| `shared/` | **DOES NOT EXIST** |
| `agents/` | **DOES NOT EXIST** |
| `dispatch/tasks.json` | Referenced in old daemon code but directory doesn't exist |
| `SESSION-STATE.md` | EXISTS but empty |
| `HEARTBEAT.md` | EXISTS (references old patterns — needs update) |

---

## 8. Dependabot Security Alerts (19 open)

### Critical (1)
- Handlebars.js — JavaScript Injection via AST Type Confusion

### High (7)
- lodash — Code Injection via `_.template`
- xmldom — XML injection (x2)
- Handlebars.js — JavaScript Injection (x4)
- LangChain Core — Path Traversal

### Medium (9)
- Electron — nodeIntegration (x2)
- Electron — HTTP Response Header Injection (x2)
- lodash — Prototype Pollution (x2)
- Handlebars.js — Prototype Pollution → XSS
- Picomatch — Method Injection (x2)

### Low (1)
- Handlebars.js — Property Access Validation Bypass

**Note:** Security subagent timed out before delivering fixes. These remain open.

---

## 9. Discord Channels (unchanged from MEMORY.md)

| Channel | ID | Purpose |
|---------|-----|---------|
| #💡・trading-ideas | 1248838389080264769 | Trade setups |
| #📊・market-alpha | 1248838389080264768 | Alpha briefs |
| #📝・research-docs | 1248848406814920776 | Deep research |
| #🤖・agent-chat | 1283129427567579299 | Agent ops |
| **Test (dev)** | 1283269444801400832 | Testing |

---

## 10. User Context

- **Name:** Fortune (Mario, @fortunexbt)
- **Discord ID:** 804823236222779413 (DM only for personal info)
- **Timezone:** Europe/Rome
- **MUTX repos:** https://github.com/fortunexbt/mutx.dev (private), https://github.com/fortunexbt/mutx-dev (public)
- **CMO agent:** @kiarassistant_bot on Telegram (needs contact)

---

## What's Broken

1. **Orphaned daemons** — master-controller and control-plane running outside launchd
2. **Dead LaunchAgents** — 4 of 5 plists not loaded
3. **No agent registry** — no agents directory, no role definitions
4. **No company workflows** — only a CTO/test-coverage loop
5. **Empty autonomy layer** — gap-scan signal is CTO signal, not company signal
6. **19 security vulns** — unfixed, security agent timed out
7. **HEARTBEAT.md outdated** — references old daemon patterns
8. **No shared memory** — no inter-agent artifact store
9. **CMO agent (øx)** — not yet connected (kiarassistant_bot)

---

## What Still Works

1. **MLX RAG** — port 18792, healthy
2. **OpenClaw** — main session, webchat, messaging
3. **GitHub MCP potential** — not yet wired
4. **CTO signal loop** — gap scanner → signal → coding agents (works but narrow)
5. **RSS alpha pipeline** — data accumulated, cron gone but can be restored
6. **Skills inventory** — 42 skills available
