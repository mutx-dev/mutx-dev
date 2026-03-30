# Mission Ready Checklist

An agent is mission ready when:
- workspace points at `workspace/mutx-agents/...`
- core files exist: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `TOOLS.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`, `LANE.md`
- queue/report/memory folders exist
- cron job exists with named session target
- lane guardrails are explicit
- outputs are file-first and measurable

If any of the above drift, fix the foundation before adding more automation.
