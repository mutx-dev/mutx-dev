# CC-leak Findings — MUTX Improvement Reference

**Source:** `https://github.com/fortunexbt/CC-leak` — cloned 2026-04-01
**Purpose:** Compile architectural patterns, tool design, and lessons from Claude Code's harness into MUTX improvement direction.

---

## What CC-leak Actually Is

Fortune's `CC-leak` repo is a **clean-room rewrite** of the Claude Code harness (TypeScript source that was exposed March 31, 2026). It has two parallel ports:

1. **Python port** (`src/`) — 66 Python files mirroring the original TypeScript surface. Python is the active development tree.
2. **Rust port** (`rust/crates/`) — a parallel rewrite targeting memory-safe runtime.

The work was orchestrated using **oh-my-codex (OmX)** — a workflow layer on Codex with `$team` mode for parallel review and `$ralph` mode for persistent execution loops with architect-level verification.

The repo does NOT copy any Anthropic proprietary source. It reverse-engineers the **harness architecture** — the tool wiring, agent orchestration, permission system, skill discovery, and runtime plumbing.

---

## Original TypeScript Architecture (What was exposed)

### Directory surface
```
src/
  commands/        # 207 command modules (slash commands)
  tools/           # 184 tool modules across 20+ families
  services/        # API, OAuth, MCP, analytics, settings, plugins...
  skills/          # skill loading + bundled skills pipeline
  assistant/       # session history + streaming orchestration
  cli/             # structured IO, remote transports, handlers
  plugins/         # plugin lifecycle + marketplace
```

---

## Core Architectural Patterns

### 1. Tool Orchestration (Three-Layer Split)

Claude Code does NOT just call tools. It has a **three-layer orchestration system**:

**Layer 1 — toolOrchestration.ts**
- Top-level orchestration: decides which tools fire, in what order, with what context
- Handles parallel tool calls, sequential dependencies, early-exit conditions

**Layer 2 — toolExecution.ts**
- Executes individual tool calls
- Handles permission checks, context injection, result formatting

**Layer 3 — StreamingToolExecutor.ts**
- Handles the streaming LLM response → tool call translation in real-time
- Manages the back-and-forth between model output and tool execution

**MUTX relevance:** MUTX currently has a simpler tool execution model. This three-layer split would allow:
- Tool-level hooks (PreToolUse, PostToolUse)
- Per-tool permission context
- Parallel/sequential tool decision logic
- Better observability into why specific tools fire

### 2. PreToolUse / PostToolUse Hook System

Claude Code supports hook-driven tool interception:

```
PreToolUse hooks → can mutate args, deny call, or rewrite behavior
PostToolUse hooks → can inspect results, log, trigger side effects
```

Hooks are configured in settings and applied in `toolHooks.ts`. The Rust port **parses** hook config but does **not execute** hooks yet.

**MUTX relevance:** This is the #1 missing feature in MUTX's runtime. Hooks would enable:
- Audit logging of every tool call
- Conditional tool enable/disable per context
- Cost tracking per tool invocation
- Pre-flight checks (e.g., "is this production?" before `kubectl`)
- Tool result transformation

### 3. AgentTool and Built-In Agent Subprocesses

Claude Code doesn't just call external models — it has **internal agent subprocesses**:

- `generalPurposeAgent` — generic coding agent subprocess
- `planAgent` — planning/roadmap agent
- `exploreAgent` — codebase exploration agent
- `verificationAgent` — tests/verification agent
- `claudeCodeGuideAgent` — onboarding/help agent

Each agent runs with its own system prompt, tool subset, and session context. The `AgentTool` orchestrates these subprocesses.

**MUTX relevance:** MUTX's design partner / GTM agents could adopt this pattern. Instead of one monolithic agent context:
- A `control-plane-agent` handles MUTX lifecycle operations
- A `gtm-agent` handles X engagement, outreach, positioning
- A `docs-agent` handles documentation consistency
- Each with scoped tool access and role-specific prompts

### 4. MCP (Model Context Protocol) First-Class Support

Claude Code treats MCP as a **first-class extension point**, not an afterthought:

- `MCPTool` — invoke MCP tools as native tools
- `ListMcpResourcesTool` — enumerate MCP resources
- `ReadMcpResourceTool` — read MCP resource contents
- `McpAuthTool` — handle MCP authentication
- `mcpSkillBuilders.ts` — build skills from MCP servers

**MUTX relevance:** MUTX already has some MCP support via OpenClaw. The CC-leak shows what a deeper MCP integration looks like — MCP as the **primary tool extension protocol** rather than ad-hoc tool registration.

### 5. Permission System (DangerFullAccess = Default)

Claude Code defaults to `DangerFullAccess` — full filesystem + shell access. Key permission layers:

- `BashTool/bashPermissions.ts` — shell command permission checks
- `BashTool/bashSecurity.ts` — path validation, destructive command warnings
- `BashTool/readOnlyValidation.ts` — read-only mode enforcement
- `BashTool/sandbox.ts` — sandboxed execution path

Permission modes: `ReadOnly`, `WriteOnly`, `DangerFullAccess`, `Ask`

**MUTX relevance:** MUTX's operator context is production fleet access. A tiered permission system would help:
- `readonly` — observe dashboards, logs, metrics
- `operator` — deploy, restart, scale operations
- `admin` — destructive operations (delete, force-stop)
- Per-agent permission scopes

### 6. Skills as First-Class Citizens

Claude Code's skills system is richer than most:

- `loadSkillsDir.ts` — discovers `SKILL.md` files in project and global paths
- `bundledSkills.ts` — ships built-in skills (updateConfig, project setup...)
- `mcpSkillBuilders.ts` — converts MCP servers into skill resources
- `/skills` slash command for browsing available skills
- Live skill reload on change (no restart needed)

**MUTX relevance:** MUTX already has a skill infrastructure via OpenClaw. The CC-leak suggests:
- Skill versioning / changelog tracking within SKILL.md
- Skill composition (skills that reference other skills)
- Built-in MUTX skills for common operator patterns

### 7. Structured / Remote Transport Layer

Claude Code has a **remote execution mode**:

- `src/cli/structuredIO.ts` — structured output format for programmatic use
- `src/cli/remoteIO.ts` — remote session handling
- `src/cli/transports/*` — WebSocket, stdio, HTTP transport adapters

This allows Claude Code to run as a **headless server** that accepts remote connections, with structured JSON input/output.

**MUTX relevance:** MUTX's ACP (Agent Client Protocol) is conceptually similar. The CC-leak remote transport shows a proven pattern for headless agent servers with structured I/O — relevant to MUTX's "run agents as a service" positioning.

### 8. Session and History Management

- `sessionHistory.ts` — stores conversation history with tool call metadata
- Background session persistence (survives restarts)
- Session export/import as JSON

### 9. Plugin System (Marketplace Model)

Claude Code has a full plugin ecosystem:
- `PluginInstallationManager.ts` — install/update/disable plugins
- `pluginOperations.ts` — enable, disable, configure
- Built-in plugin scaffolding in `builtinPlugins.ts`
- Marketplace plugin registry

**MUTX relevance:** MUTX could position its SDK/CLI as a **plugin ecosystem** for agent operations, rather than a monolithic tool.

---

## Specific Tool Families (184 total)

### High-value tools for MUTX emulation:

| Tool | Purpose | MUTX analog | Gap |
|------|---------|-------------|-----|
| `AgentTool` | Spawn sub-agents | ACP sessions | MUTX lacks agent lifecycle management |
| `BashTool` | Shell execution | exec tool | MUTX exec is simpler (no path validation layers) |
| `Task*` family | Background task management | cron/queue | MUTX queue-governance is partial (#112) |
| `Team*` family | Multi-agent coordination | council | Council exists but not wired as tool |
| `ScheduleCronTool` | Cron scheduling | ACP cron lanes | Partial — not fully wired (#39) |
| `MCPTool` | MCP tool invocation | OpenClaw MCP | OpenClaw has mcporter; deeper integration possible |
| `WebSearchTool` | Web search | Agent Reach | Agent Reach installed; not first-class tool |
| `WebFetchTool` | URL content fetch | summarize skill | Functional but not first-class |
| `SkillTool` | Skill discovery/execution | OpenClaw skills | Similar but CC has live reload |
| `TodoWriteTool` | Task tracking | Things/apple-reminders | MUTX has no internal todo |
| `GrepTool` / `GlobTool` | Code search | exec grep | Ad-hoc via shell |
| `LSPTool` | Language Server Protocol | None | MUTX has no LSP integration |

---

## Rust Port Status (from PARITY.md)

The Rust port (`rust/crates/`) is **not feature-complete**:

✅ Working:
- Anthropic API client + OAuth
- Session/conversation state
- Core tool loop (MVP tool registry)
- MCP stdio/bootstrap
- CLAUDE.md discovery

❌ Missing:
- Plugin subsystem (completely absent)
- Hook runtime execution (config parsed, not executed)
- Most CLI commands beyond basic set
- Bundled skill registry
- Structured/remote transport layer
- Services beyond core API/MCP

**Critical bugs fixed in Rust port:**
- Prompt mode tools now enabled
- Default permission mode = `DangerFullAccess`
- Streaming `{}` prefix bug fixed
- Unlimited `max_iterations`

**Remaining Rust issue:** JSON prompt output still emits human-readable tool-result lines before the final JSON object in tool-capable JSON mode.

---

## What This Means for MUTX

### MUTX Strengths (vs Claude Code harness)

1. **ACP is more structured than Claude Code's early remote transport** — MUTX has a proper protocol for agent-to-agent communication
2. **OpenClaw skills are closer to Claude Code's skill system than most alternatives** — local SKILL.md discovery works
3. **Council deliberation is a unique differentiator** — no equivalent in Claude Code
4. **Browser/X lane is proven** — CDP daemon approach is solid

### MUTX Gaps to Address (informed by CC-leak analysis)

Priority order based on revenue/pipeline impact:

**P0 — Tool orchestration layer (#39, #112)**
- MUTX monitoring + self-heal not fully wired into runtime
- Queue-governance enforcement incomplete
- Need: PreToolUse/PostToolUse hooks, parallel tool execution, tool-level observability

**P1 — Permission system**
- No tiered permission model for operators
- Production fleet access is all-or-nothing
- Need: ReadOnly / Operator / Admin tiers with per-context enforcement

**P2 — Agent lifecycle management**
- ACP sessions exist but agent subprocess management is ad-hoc
- Need: formal AgentTool equivalent — spawn, monitor, resume, terminate sub-agents with scoped tool access

**P3 — Structured remote transport**
- ACP is solid but the client-side UX for remote sessions needs polish
- Need: cleaner JSON I/O mode for headless/server deployments

**P4 — Skill live reload**
- Skills require restart to pick up changes
- Claude Code detects skill changes without restart
- Need: filesystem watcher for skill changes

---

## Key Files in CC-leak for Reference

```
/tmp/CC-leak/
  PARITY.md                          # Rust vs TS full gap analysis
  src/reference_data/
    tools_snapshot.json              # 184 tool entries with responsibilities
    commands_snapshot.json           # 207 command entries
  src/port_manifest.py               # Python workspace structure
  src/tools.py                       # Python tool backlog metadata
  src/commands.py                    # Python command backlog metadata
  src/models.py                      # Dataclasses for subsystems
  rust/crates/                       # Rust port (incomplete)
    tools/src/lib.rs                 # MVP tool registry
    runtime/src/conversation.rs      # Core agent loop
    runtime/src/config.rs            # Hook config parsing
```

---

## Session Stats

- CC-leak repo: 50K+ stars in 2 hours (fastest in history at time of release)
- Python port: 66 files, 207 commands mirrored, 184 tools mirrored
- Rust port: actively in development, ~60% feature parity

---

## Appendix: Slash Commands (207 total — selected high-value)

```
/agent          # spawn sub-agents
/agents         # list/manage agent pool
/ask            # ask user a question (blocking)
/attach         # attach to running session
/auto-edit      # auto-fix code issues
/autofix-pr     # auto-fix PR issues
/branch         # git branch management
/break-cache    # invalidate cache
/bridge         # bridge sessions
/chrome         # Chrome automation
/clear          # clear conversation/state
/compact        # compact session memory
/commit         # commit with smart message
/commit-push-pr # commit + push + PR
/config         # runtime configuration
/cost           # show token usage
/diff           # show uncommitted changes
/eval           # evaluate JS expression
/exit           # exit session
/export         # export session as JSON
/help           # help
/hooks          # manage hooks (parsed but not executed in Rust)
/init           # reinitialize session
/mcp            # MCP server management
/memory         # session memory management
/model          # switch model/provider
/permissions    # permission mode management
/plan           # show current plan
/plugin         # plugin management (missing in Rust)
/pr             # GitHub PR checkout
/reload-plugins # reload plugin subsystem (missing in Rust)
//resume        # resume a saved session
/review         # code review
/skills         # skill management (missing in Rust)
//status        # show status
/tasks          # task management
/version        # version info
```

---

*Last compiled: 2026-04-01 from https://github.com/fortunexbt/CC-leak*
