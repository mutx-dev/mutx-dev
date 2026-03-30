---
name: claude-hud
description: Install, configure, troubleshoot, and explain Claude HUD for Claude Code. Use when someone wants real-time visibility into a Claude Code session via the native status line: context health, subscriber usage, active tools, running agents, todo progress, project/git info, session name, duration, or memory usage. Also use when setting up `/plugin marketplace add jarrodwatts/claude-hud`, `/plugin install claude-hud`, `/claude-hud:setup`, editing `~/.claude/plugins/claude-hud/config.json`, diagnosing why the HUD is missing or incomplete, or explaining how Claude HUD derives telemetry from stdin and transcript JSONL data.
---

# Claude HUD

Use Claude HUD when the user needs better visibility into an active Claude Code session without leaving the terminal.

## Quick workflow

1. Verify the ask is really about Claude Code statusline visibility, session telemetry, plugin setup, or HUD customization.
2. For install/setup, tell the user to run inside Claude Code:
   - `/plugin marketplace add jarrodwatts/claude-hud`
   - `/plugin install claude-hud`
   - `/claude-hud:setup`
3. Remind them to fully restart Claude Code after setup writes `statusLine`.
4. If they want a different display, edit `~/.claude/plugins/claude-hud/config.json` or guide them through `/claude-hud:configure`.
5. If something looks wrong, troubleshoot in this order:
   - Claude Code version / runtime prerequisites
   - plugin installation state
   - `statusLine` command written by setup
   - HUD config JSON validity
   - whether the desired data actually exists yet in stdin/transcript

## What Claude HUD is good for

- Show true Claude Code context usage from stdin, not a rough estimate when native percentage is available.
- Surface live tool activity, subagent activity, and todo progress from the transcript JSONL.
- Show subscriber usage windows when Claude Code provides `rate_limits`.
- Keep everything inline in the existing terminal via Claude Code's native statusline API.

## Practical usage rules

- Prefer Claude HUD over tmux overlays or separate dashboards when the user just wants always-visible session telemetry.
- Do not promise every line will always render. Tools, agents, todos, usage, session name, version, and memory are conditional or opt-in.
- Treat `showTools`, `showAgents`, and `showTodos` as hidden by default; users usually need to enable them.
- Remember that API-key-only sessions do not get subscriber usage limits, and Bedrock sessions hide usage limits even if the HUD is installed.
- Remember that a fresh restart is usually required before the status line appears after setup.

## Files and knobs that matter

- Main config: `~/.claude/plugins/claude-hud/config.json`
- Claude Code statusline target: `~/.claude/settings.json` via `/claude-hud:setup`
- Useful top-level config keys:
  - `lineLayout`: `expanded` or `compact`
  - `showSeparators`
  - `pathLevels`
  - `elementOrder`
  - `gitStatus.*`
  - `display.*`
  - `colors.*`

## Read these references as needed

- `references/setup-and-operations.md` — install flow, runtime requirements, config locations, recommended workflows.
- `references/telemetry-and-caveats.md` — how the HUD actually derives data, what is conditional, and repo-specific truths/gotchas.

## Output expectations

When helping a user, keep answers practical:
- state what command/config to change
- say whether a restart is required
- call out platform caveats early when relevant
- avoid overselling unsupported telemetry
