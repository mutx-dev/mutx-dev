# Repo truths and caveats

## Confirmed implementation details

These points come directly from the repository source, not just the README.

- The broker uses `Bun.serve()` on `127.0.0.1` and stores state in SQLite via `bun:sqlite`.
- Default DB path is `~/.claude-peers.db`.
- The MCP server auto-starts the broker if `/health` is not reachable.
- Broker startup wait is about 6 seconds total (`30` checks x `200ms`).
- Peer IDs are randomly generated 8-character lowercase alphanumeric strings.
- The server polls `/poll-messages` every `1000ms`.
- The server sends heartbeats every `15000ms`.
- Stale peers are cleaned by checking whether the recorded PID still exists.
- Sender context shown on inbound channel notifications is derived by a follow-up machine-wide peer lookup.

## Important caveats

### Same-machine only

This repo is built for local coordination on one machine. The broker binds to `127.0.0.1`, so it is not a multi-machine peer network out of the box.

### Channel push is special

Instant inbound delivery depends on Claude channel notifications and the development-channel launch flow. Without that mode, tool calls still exist, but `check_messages` becomes the fallback.

### Claude login requirement

The README states that `claude.ai` login is required for channels and that API-key auth alone will not work for this part.

### Local message injection is possible

The CLI can send messages using `from_id: "cli"`, and the broker accepts POSTs from localhost without auth. Treat the system as a convenience layer for local operator workflows, not a hardened security boundary.

### Summary model detail

Auto-summary uses the OpenAI Chat Completions API with model `minimax-portal/MiniMax-M2.7`, a 5-second timeout, and returns `null` quietly on failure. If `OPENAI_API_KEY` is absent or the call fails, the system simply does not auto-populate the summary.

### Repo-local `.mcp.json` is not the main installation story

The source ships a `.mcp.json`, but the README's main path is `claude mcp add --scope user ...`. Prefer the latter unless the user specifically wants project-local MCP config.

### No license file seen in the repo snapshot

The cloned repo snapshot used for this skill did not contain a `LICENSE` file. If redistribution or policy questions matter, verify the current repository state before making assumptions.

## Debug checklist

If peers do not appear or messages do not arrive:

1. Confirm the server registration command points at the correct clone path.
2. Confirm Claude was launched with `server:claude-peers`.
3. Confirm channel mode is enabled if instant delivery is expected.
4. Confirm `bun cli.ts status` shows a healthy broker and registered peers.
5. Confirm peers are using the expected scope (`machine`, `directory`, or `repo`).
6. Check whether `CLAUDE_PEERS_PORT` or `CLAUDE_PEERS_DB` overrides changed behavior.
7. If needed, kill and restart the broker.

## Source file map

- `README.md`: user-facing setup and feature summary
- `server.ts`: MCP tools, broker bootstrap, polling, channel notifications
- `broker.ts`: HTTP API, SQLite tables, peer cleanup, message delivery
- `cli.ts`: inspection and broker control commands
- `shared/summarize.ts`: optional auto-summary implementation
