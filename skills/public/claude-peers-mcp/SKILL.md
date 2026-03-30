---
name: claude-peers-mcp
description: Use the claude-peers-mcp project to let multiple Claude Code sessions on the same machine discover each other, share short status summaries, and send direct messages. Trigger when asked to set up claude-peers, install or register the MCP server, enable Claude channel-based peer messaging, coordinate work across several Claude Code terminals, inspect the local broker/peer state, or troubleshoot why peer discovery or inbound messages are not working.
---

# claude-peers-mcp

Install and use `louislva/claude-peers-mcp` as a localhost-only coordination layer for multiple Claude Code sessions.

## Quick workflow

1. Confirm the user actually wants **Claude Code sessions talking to each other on one machine**.
2. Read `references/install-and-operations.md` for install, registration, and runtime commands.
3. Read `references/coordination-patterns.md` when the task is about how to divide work, summarize progress, or ask another Claude for context.
4. Read `references/repo-truths-and-caveats.md` when validating behavior or debugging setup problems.

## What this repo provides

The repo exposes four MCP tools inside Claude Code:

- `list_peers`
- `send_message`
- `set_summary`
- `check_messages`

Use them to discover sibling Claude sessions, announce what each one is doing, and send targeted messages between peers.

## Preferred operating pattern

- Register the server at **user scope** so it is available from any directory.
- Launch Claude Code with `server:claude-peers` and the development-channel flag when immediate inbound delivery matters.
- Have each session set a short summary early.
- Use `list_peers` before messaging so you target the right peer and see repo/cwd context.
- Keep messages short, specific, and action-oriented.

## Troubleshooting route

If setup or messaging fails, check in this order:

1. Bun installed
2. Repo cloned and `bun install` completed
3. MCP server registered correctly
4. Claude launched with the needed flags for channel push
5. User is logged into `claude.ai`
6. Broker health / peer list from the CLI
7. Port or DB overrides via environment variables

See `references/repo-truths-and-caveats.md` for exact caveats and failure modes.
