# HEARTBEAT.md

Keep heartbeat work minimal and current.
Do not infer from old chats.

## Check in one pass
1. `workspace-x/queue/execution.log` — last 4h
2. `workspace-x/queue/posted_log.md` — last 10 entries
3. `workspace-x/worker_state.json`
4. `openclaw status`

## Alert if any of these are true
- `healthStatus = BLOCKED`
- `qualityScore < 40`
- follower count drops without explanation
- 2+ unresolved X errors remain in `execution.log`
- gateway is not healthy
- ACP backend is not ready
- local memory is not ready

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
