# HEARTBEAT.md

Keep heartbeat work minimal and current.
Do not infer from old chats.

## Check in one pass
1. `openclaw status` — gateway reachable, memory vector ready, sessions healthy
2. `mutx-engineering-agents/dispatch/action-queue.json` — any shared CI blockers or deadlocks?
3. Recent gateway logs: `tail -50 /Users/fortune/.openclaw/logs/gateway.log` — any new ERROR patterns?
4. `queue/council_pending.md` — any posts waiting for council deliberation?

## Alert if any of these are true
- gateway is not reachable or `openclaw status` shows gateway down
- local memory vector is not ready
- 3+ consecutive session failures in recent logs
- new model-switch errors in gateway logs (GPT refs appearing after model migration)
- a shared CI blocker sits in action-queue.json for more than 2 hours without an owner assigned
- a post is pending council review in `queue/council_pending.md` (run deliberation and update verdict)

## Response
If nothing needs attention, reply exactly:

`HEARTBEAT_OK`

If there is a problem, do **not** include `HEARTBEAT_OK`. Use:

```text
X AGENT ALERT — [BLOCKED|DEGRADED]
- Issue: [brief description]
- File: [relevant file or subsystem]
- Action: [what should happen]
```
