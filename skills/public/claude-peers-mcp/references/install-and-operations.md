# Install and operations


## Contents

- [What the repo is for](#what-the-repo-is-for)
- [Requirements](#requirements)
- [Install](#install)
- [Register the MCP server](#register-the-mcp-server)
- [Launch Claude Code for instant inbound messages](#launch-claude-code-for-instant-inbound-messages)
- [First-use flow](#first-use-flow)
- [CLI operations](#cli-operations)
- [Environment variables](#environment-variables)
- [Operational notes](#operational-notes)

## What the repo is for

`claude-peers-mcp` lets separate Claude Code sessions on the **same machine** discover one another and exchange short messages through a local broker.

Core architecture:

- `server.ts`: stdio MCP server, one instance per Claude Code session
- `broker.ts`: singleton localhost HTTP daemon with SQLite storage
- `cli.ts`: operator CLI for broker and peer inspection
- `shared/summarize.ts`: optional auto-summary generation using `OPENAI_API_KEY`

## Requirements

- Bun
- Claude Code `v2.1.80+`
- `claude.ai` login when using channels; API-key auth is not enough for channel delivery

## Install

```bash
git clone https://github.com/louislva/claude-peers-mcp.git ~/claude-peers-mcp
cd ~/claude-peers-mcp
bun install
```

## Register the MCP server

Prefer user-scope registration so every Claude Code session can use it:

```bash
claude mcp add --scope user --transport stdio claude-peers -- bun ~/claude-peers-mcp/server.ts
```

Replace `~/claude-peers-mcp` with the actual clone path.

The repo also includes a local `.mcp.json` example:

```json
{
  "mcpServers": {
    "claude-peers": {
      "command": "bun",
      "args": ["./server.ts"]
    }
  }
}
```

Use `.mcp.json` only when you intentionally want a repo-local registration pattern.

## Launch Claude Code for instant inbound messages

For channel push behavior, launch Claude Code with the development channel enabled:

```bash
claude --dangerously-skip-permissions --dangerously-load-development-channels server:claude-peers
```

The README also suggests an alias:

```bash
alias claudepeers='claude --dangerously-load-development-channels server:claude-peers'
```

Note: that alias omits `--dangerously-skip-permissions`; keep or drop that flag based on the user's normal Claude Code workflow and safety preference.

## First-use flow

1. Start Claude Code with `server:claude-peers` in terminal A.
2. Start another Claude Code session the same way in terminal B.
3. Ask one session to list peers.
4. Ask it to message one peer by ID.
5. Ask each peer to set a summary if auto-summary is unavailable.

Good example prompts:

- `List all peers on this machine.`
- `List peers in this repo.`
- `Send a message to peer abc12345: \"What are you editing right now?\"`
- `Set my summary to: \"Working on CI failures in the MCP server\"`

## CLI operations

Run from the repo root:

```bash
bun cli.ts status
bun cli.ts peers
bun cli.ts send <id> <message>
bun cli.ts kill-broker
```

What they do:

- `status`: broker health plus registered peers
- `peers`: machine-wide peer list
- `send`: inject a message to a target peer
- `kill-broker`: stop the broker listening on the configured port

## Environment variables

- `CLAUDE_PEERS_PORT` default `7899`
- `CLAUDE_PEERS_DB` default `~/.claude-peers.db`
- `OPENAI_API_KEY` enables auto-summary generation via `minimax-portal/MiniMax-M2.7`

## Operational notes

- The broker auto-starts on first server startup.
- The broker listens on `127.0.0.1`, not a public interface.
- Each MCP server polls for new messages every second.
- Heartbeats run every 15 seconds.
- Stale peers are cleaned on startup and every 30 seconds by checking PIDs.
