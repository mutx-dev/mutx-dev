# Claude HUD setup and operations


## Contents

- [What it is](#what-it-is)
- [Core install flow](#core-install-flow)
- [Requirements](#requirements)
- [Important config locations](#important-config-locations)
  - [Claude HUD config](#claude-hud-config)
  - [Claude Code statusline config](#claude-code-statusline-config)
  - [Effective Claude config directory](#effective-claude-config-directory)
- [Useful configuration keys](#useful-configuration-keys)
- [Good workflows](#good-workflows)
  - [1. Minimal visibility without clutter](#1-minimal-visibility-without-clutter)
  - [2. Actively supervising autonomous work](#2-actively-supervising-autonomous-work)
  - [3. Context-budget management](#3-context-budget-management)
  - [4. Repo navigation awareness](#4-repo-navigation-awareness)
  - [5. Git-heavy work](#5-git-heavy-work)
- [Manual operations and development](#manual-operations-and-development)
- [Setup/troubleshooting sequence](#setuptroubleshooting-sequence)
- [Platform caveats](#platform-caveats)
  - [Linux install EXDEV issue](#linux-install-exdev-issue)
  - [Windows runtime caveat](#windows-runtime-caveat)
  - [macOS restart caveat](#macos-restart-caveat)

## What it is

Claude HUD is a Claude Code plugin that renders a heads-up display in the native status line. It is not a separate UI, tmux pane, browser dashboard, or external daemon.

## Core install flow

Run inside a Claude Code session:

```text
/plugin marketplace add jarrodwatts/claude-hud
/plugin install claude-hud
/claude-hud:setup
```

Then restart Claude Code so the new `statusLine` command is loaded.

## Requirements

- Claude Code v1.0.80+
- Node.js 18+ or Bun available in the shell Claude Code uses

Repo detail:
- `package.json` requires Node `>=18.0.0`
- Bun is supported and setup prefers Bun when present

## Important config locations

### Claude HUD config

`~/.claude/plugins/claude-hud/config.json`

This holds HUD display configuration such as layout, element ordering, git display, colors, usage thresholds, memory display, and custom line text.

### Claude Code statusline config

`~/.claude/settings.json`

`/claude-hud:setup` writes a `statusLine` command here. The setup logic intentionally generates a command that dynamically finds the latest installed plugin version rather than pinning one hardcoded version path.

### Effective Claude config directory

The repo resolves Claude config from `CLAUDE_CONFIG_DIR` when set; otherwise it uses `~/.claude`. It also expands `~` prefixes.

## Useful configuration keys

```json
{
  "lineLayout": "expanded",
  "showSeparators": false,
  "pathLevels": 2,
  "elementOrder": ["project", "context", "usage", "memory", "environment", "tools", "agents", "todos"],
  "gitStatus": {
    "enabled": true,
    "showDirty": true,
    "showAheadBehind": false,
    "showFileStats": false
  },
  "display": {
    "showProject": true,
    "showContextBar": true,
    "contextValue": "percent",
    "showUsage": true,
    "usageBarEnabled": true,
    "showTools": false,
    "showAgents": false,
    "showTodos": false,
    "showSessionName": false,
    "showClaudeCodeVersion": false,
    "showDuration": false,
    "showMemoryUsage": false,
    "showConfigCounts": false,
    "showSpeed": false,
    "showTokenBreakdown": true,
    "customLine": ""
  }
}
```

## Good workflows

### 1. Minimal visibility without clutter

Use defaults or Minimal-style config:
- keep model + context bar
- keep project/git
- leave tools/agents/todos hidden

Good for users who only care about context pressure.

### 2. Actively supervising autonomous work

Enable:
- `display.showTools: true`
- `display.showAgents: true`
- `display.showTodos: true`
- optionally `display.showDuration: true`

This is the best fit when the user is letting Claude Code or subagents work for longer stretches and wants a quick glance at progress.

### 3. Context-budget management

Keep `display.showUsage: true` and `display.showTokenBreakdown: true`.

Recommend this when the user routinely hits context limits or wants a better sense of when to compact/clear/summarize.

### 4. Repo navigation awareness

Increase `pathLevels` to 2 or 3 when users jump among nested projects or monorepos.

### 5. Git-heavy work

Adjust:
- `gitStatus.showDirty`
- `gitStatus.showAheadBehind`
- `gitStatus.showFileStats`

Use file stats only when the user explicitly wants extra branch/change detail; it adds noise in smaller terminals.

## Manual operations and development

Repo build/test flow:

```bash
git clone https://github.com/jarrodwatts/claude-hud
cd claude-hud
npm ci
npm run build
npm test
```

Manual smoke test from the repo:

```bash
echo '{"model":{"display_name":"Opus"},"context_window":{"current_usage":{"input_tokens":45000},"context_window_size":200000}}' | node dist/index.js
```

## Setup/troubleshooting sequence

1. Confirm Claude Code version is new enough.
2. Confirm `node` or `bun` is available in that shell.
3. Confirm plugin installation actually exists under Claude's plugin cache.
4. Confirm `statusLine.command` was written to `settings.json`.
5. Confirm JSON in `config.json` is valid.
6. Restart Claude Code before judging success.

## Platform caveats

### Linux install EXDEV issue

The README documents a Claude Code platform limitation: installs can fail when `/tmp` is on a different filesystem.

Workaround:

```bash
mkdir -p ~/.cache/tmp && TMPDIR=~/.cache/tmp claude
```

Then install from that Claude Code session.

### Windows runtime caveat

If setup says no JavaScript runtime was found, install Node.js LTS and restart the shell before re-running setup.

### macOS restart caveat

The repo explicitly warns that on macOS a full Claude Code restart is commonly required before the HUD appears.
