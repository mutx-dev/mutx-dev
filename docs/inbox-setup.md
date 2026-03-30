# Inbox Setup — mutx-dev / OpenClaw

## Overview

This doc covers the OpenClaw inbox configuration for the mutx-dev workspace — what it currently looks like, what channels are active, and how to configure routing for 24/7 work receipt via Discord.

**TL;DR:** Discord is the active inbox channel. The gateway runs as a LaunchAgent (persistent 24/7). Thread bindings are enabled so Discord threads get their own agent sessions. The inbox contract is implicit — no explicit `inbox` block exists yet in `openclaw.json`.

---

## Current Configuration

### Gateway Status
- **Status:** Running (LaunchAgent, pid active)
- **Bind:** Loopback only (`127.0.0.1:18789`)
- **Config:** `~/.openclaw/openclaw.json`
- **Auth:** Token-based (`bfa2cb590fa37eff55b89fcd4045948961bad6ca19645bd1`)

> **Note on bind:** Gateway is loopback-only, meaning it only accepts local connections. The MacBook Pro runs the OpenClaw companion/daemon and connects locally. This is fine for Discord ops since the bot token handles the external connection.

### Active Channels

| Channel  | Enabled | DM Policy   | Group Policy  | Notes                            |
|----------|---------|-------------|---------------|----------------------------------|
| Discord  | ✅ yes  | allowlist   | allowlist     | Bot token configured             |
| Telegram | ❌ no   | —           | —             | Disabled                         |
| WhatsApp | ❌ no   | —           | —             | Disabled                         |

### Discord-Specific Config

```json
"discord": {
  "enabled": true,
  "dmPolicy": "allowlist",
  "allowFrom": ["804823236222779413"],   // Fortune's Discord user ID
  "groupPolicy": "allowlist",
  "streaming": "off",
  "threadBindings": {
    "enabled": true,
    "idleHours": 168,      // 7 days idle before thread considered stale
    "maxAgeHours": 0,       // 0 = no max age
    "spawnSubagentSessions": true,   // Threads can spawn subagents
    "spawnAcpSessions": true        // Threads can spawn ACP sessions (Codex, etc.)
  }
}
```

### Existing Bindings

Three route bindings currently defined:

1. **`main` agent → Discord (default account)** — catch-all for Discord
2. **`codex` ACP → Discord DM from `804823236222779413`** — persistent session, `backend` worktree
3. **`opencode` ACP → Discord DM from `804823236222779413`** — persistent session, `frontend` worktree

---

## Inbox Contract Status

**No explicit `inbox` block exists in `openclaw.json`.**

The "inbox" for 24/7 Discord work is currently handled implicitly through:
- The `main` agent binding to Discord (catches all Discord messages)
- Thread bindings create isolated sessions per Discord thread
- ACP bindings route DMs to specific agents (codex/opencode)
- Session continuity via `threadBindings.idleHours: 168` (7 days)

### What "Inbox Contract" Means Here

In OpenClaw, an inbox contract would define:
- Which channel(s) accept inbound work
- How work items are routed to agents
- Whether work is processed synchronously or queued asynchronously
- Conversation context rules (threading, session lifetime, etc.)

Currently, Discord → `main` agent is the inbox. Fortune's Discord DM or mentions route to the main agent, which then decides what to do (handle directly, spawn subagent, route to codex/opencode, etc.).

---

## What's Configured for 24/7 Ops

### ✅ Already Good
- Gateway runs as LaunchAgent — survives logout/restart, runs 24/7
- Discord bot token active, bot is online
- Thread bindings: Discord threads get their own sessions
- `spawnSubagentSessions: true` and `spawnAcpSessions: true` on Discord threads
- `idleHours: 168` (7 days) — threads stay alive long enough for async work
- `main` agent routes from Discord

### ⚠️ Gaps / Things to Consider

1. **No explicit work queue / inbox contract block** — work goes directly to the main agent session. For high-volume 24/7 ops, consider adding an `inbox` block with queue-based routing if the volume grows.

2. **DM allowlist only (`804823236222779413`)** — only Fortune's Discord ID can DM. If others need to submit work, add their IDs to `allowFrom`.

3. **No inbound routing rules** — messages aren't automatically routed to Codex/opencode based on content. The `main` agent decides. For more automated routing, you'd add pattern-match rules or named inbox queues.

4. **Gateway loopback only** — if you want to connect from outside the machine (e.g., mobile companion app over tailscale), you'd need to change `gateway.bind` to `lan` or configure tailscale. Currently not an issue for Discord-only ops.

5. **No rate limiting on inbound** — Discord has its own rate limits; OpenClaw doesn't currently apply additional inbound rate limits. Keep an eye on the `autonomy-queue.json` and Discord message frequency.

---

## How to Set Up New Channels

### Adding a New Discord Channel/Guild

1. Get the guild ID and channel IDs from Discord (developer mode → right-click)
2. Add to `channels.discord.accounts.default.guilds`:

```json
"guilds": {
  "YOUR_GUILD_ID": {
    "requireMention": false,
    "users": ["804823236222779413"],
    "channels": {
      "CHANNEL_ID_1": {},
      "CHANNEL_ID_2": {}
    }
  }
}
```

3. Run `openclaw gateway restart` to reload config

### Enabling Telegram (if needed)

```json
"channels": {
  "telegram": {
    "enabled": true,
    "dmPolicy": "pairing",
    "botToken": "YOUR_BOT_TOKEN",
    "groupPolicy": "allowlist"
  }
}
```

Then restart gateway.

### Adding a New Binding/Routing Rule

Add to the `bindings` array in `openclaw.json`:

```json
{
  "type": "route",
  "agentId": "main",
  "match": {
    "channel": "discord",
    "accountId": "default",
    "guildId": "SPECIFIC_GUILD_ID",     // optional
    "channelId": "SPECIFIC_CHANNEL_ID"  // optional
  }
}
```

Or for ACP sessions (Codex/opencode-style persistent sessions):

```json
{
  "type": "acp",
  "agentId": "codex",
  "match": {
    "channel": "discord",
    "accountId": "default",
    "guildId": "...",
    "channelId": "..."
  },
  "acp": {
    "mode": "persistent",
    "label": "worktree-backend",
    "cwd": "/Users/fortune/mutx-worktrees/factory/backend",
    "backend": "acpx"
  }
}
```

---

## How to Configure Inbox Rules

### Pattern-Based Routing

OpenClaw routes messages through bindings (evaluated top to bottom, first match wins). To route based on message content, the `main` agent handles it and dispatches — there's no built-in regex/content-based routing in the binding layer.

For content-based routing, you'd configure the `main` agent to parse the message and forward to the appropriate subagent or ACP session.

### Queue-Based Inbox (If Volume Grows)

If you want messages to queue rather than all hit `main` simultaneously:

1. Add an `inbox` block to `openclaw.json` (if supported in your OpenClaw version)
2. Or use `autonomy-queue.json` in the workspace as a work queue — the `main` agent reads from it and processes items sequentially/asynchronously

Current setup relies on the `main` agent's concurrency (`maxConcurrent: 6`) to handle multiple inbound items.

### Session/Thread Rules

```json
"threadBindings": {
  "enabled": true,
  "idleHours": 168,      // keep thread session alive 7 days after last message
  "maxAgeHours": 0,      // no hard max age
  "spawnSubagentSessions": true,
  "spawnAcpSessions": true
}
```

- **`idleHours`**: After a thread goes quiet for this long, its session is archived. 168h = 7 days.
- **`maxAgeHours: 0`**: No hard cutoff on thread age.
- **`spawnSubagentSessions`**: Thread can spin up subagents (e.g., for parallel issue tackling).
- **`spawnAcpSessions`**: Thread can spin up Codex/opencode ACP sessions.

---

## Best Practices for 24/7 Ops

### Gateway
- Keep the LaunchAgent healthy: `openclaw gateway status`
- Watch `/tmp/openclaw/openclaw-YYYY-MM-DD.log` for errors
- If Discord goes silent, check the bot token hasn't been revoked

### Discord
- Bot must be in a server with appropriate permissions (send messages, create threads, react)
- `dmPolicy: allowlist` with `allowFrom` is correct for single-user ops
- `threadBindings.spawnAcpSessions: true` lets threads launch Codex sessions — useful for async code review

### Sessions
- `session.maintenance.mode: enforce` is on — sessions auto-prune after 7 days
- Keep `threadBindings.idleHours` aligned with your work rhythm (7 days is sane for most ops)
- `maxDiskBytes: 500mb` for session storage is configured; monitor with `openclaw status`

### Subagents
- Max 12 concurrent subagents (`agents.defaults.subagents.maxConcurrent: 12`)
- Archive after 180 min (`archiveAfterMinutes: 180`)
- Announce timeout 15s — if a subagent doesn't report back in 15s, the parent assumes it died

### Rate Limits
- Discord API rate limits apply; OpenClaw doesn't override them
- If doing high-volume GitHub ops, watch GitHub API rate limits
- Log and back off on 429s (already in AGENTS.md)

### Security
- `elevated.exec.allowFrom` is set to `804823236222779413` (Fortune) for Discord and webchat
- If adding new users to Discord allowlist, update `elevated.allowFrom.discord`
- Gateway token is in `openclaw.json` — don't share it

---

## File Locations

| File | Purpose |
|------|---------|
| `~/.openclaw/openclaw.json` | Main config (channels, bindings, agents, plugins) |
| `~/.openclaw/workspace/autonomy-queue.json` | Work queue |
| `~/.openclaw/workspace/mutx-fleet-state.md` | Fleet status |
| `/tmp/openclaw/openclaw-YYYY-MM-DD.log` | Gateway logs |
| `~/Library/LaunchAgents/ai.openclaw.gateway.plist` | LaunchAgent plist |

---

## Quick Reference: Commands

```bash
# Check gateway status
openclaw gateway status

# Restart gateway (after config changes)
openclaw gateway restart

# View recent logs
tail -100 /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log

# Check openclaw version
openclaw --version
```
