# Phase 0 — OpenClaw Config Snapshot (Partial)
**Created:** 2026-04-03 07:17 UTC

## Key Config Values

### Model
- Default: `minimax-portal/MiniMax-M2.7` (alias: minimax-m2.7)
- Subagent model: `minimax-portal/MiniMax-M2.7`
- Thinking default: `xhigh`

### Agents Registry (in config)
**Total agents in config.list: ~150+**

#### Real/Active Agents (with agentDir):
- `main` — primary agent (this session)
- `codex` — ACP runtime, cwd: `/Users/fortune/mutx-worktrees/factory/backend`
- `opencode` — ACP runtime, cwd: `/Users/fortune/mutx-worktrees/factory/frontend`
- `outreach` — workspace: `/Users/fortune/.openclaw/workspace-outreach`
- `x` — workspace: `/Users/fortune/.openclaw/workspace-x`
- `cavapendolandia` — workspace: `/Users/fortune/.openclaw/workspace-cavapendolandia`
- `personal-assistant` — workspace: `/Users/fortune/.openclaw/workspace-personal-assistant`
- `outside-in-intelligence` — workspace: `mutx-agents/gtm/outside-in-intelligence`
- `ai-engineer`, `frontend-developer`, `product-manager`, `workflow-architect`, `technical-writer`, `developer-advocate`, `account-strategist`, `sales-engineer`, `outbound-strategist`, `social-media-strategist`, `infrastructure-maintainer`, `project-shepherd`, `report-distribution-agent`, `security-engineer` — workspace: `mutx-agents/*`
- `mission-control-orchestrator` + 8 sub-agents (qa-reliability-engineer, cli-sdk-contract-keeper, etc.) — workspace: `mutx-engineering-agents/*`

#### Engineering MUTX Agents (mission-control-orchestrator hierarchy):
- `mission-control-orchestrator` — supervisor
- `qa-reliability-engineer`
- `cli-sdk-contract-keeper`
- `control-plane-steward`
- `operator-surface-builder`
- `auth-identity-guardian`
- `observability-sre`
- `infra-delivery-operator`
- `runtime-protocol-engineer`
- `docs-drift-curator`

#### All Other Agents (~130+):
Most in `~/.openclaw/agency-agents/*` — **EMPTY SHELL DIRECTORIES** with no SKILL.md, no real implementation. These are the "blank shells" the audit referenced.

### Discord
- Guild: 1248838385154654335
- DM allowlist: 804823236222779413
- Channels bound: #📊・market-alpha, #💡・trading-ideas, #📝・research-docs, #🤖・agent-chat
- Thread bindings: enabled (idle 168h, maxAge 0)
- Streaming: off (account: partial)

### MCP Servers
- Configured: none (mcpServers: {})
- `acpx` plugin: enabled, cwd: `/Users/fortune/.openclaw/workspace`

### Memory
- Backend: builtin (qmd)
- qmd command: `/opt/homebrew/bin/qmd`
- Index paths: workspace/*.md, workspace/docs/**, workspace/mutx-md-corpus/**
- Sessions retention: 365 days

### Tools
- exec security: full (ask: off)
- elevated: enabled (Discord + webchat from 804823236222779400)
- agentToAgent: main, codex, opencode, x

### Cron
- Session retention: 12h
- Run log: 500 lines, 2mb max
- **Only 1 cron active: "MUTX CTO Signal Monitor" (ERROR state)**

### Env Vars (redacted)
- BRAVE_API_KEY ✅
- ELEVENLABS_API_KEY + VOICE_ID ✅
- OPENAI_API_KEY ✅
- TWITTER_*/X_* vars ✅ (Twitter API configured)

### LaunchAgents (from process snapshot)
- mlx-rag: loaded ✅
- master-controller: NOT loaded (orphaned)
- Others: not loaded
