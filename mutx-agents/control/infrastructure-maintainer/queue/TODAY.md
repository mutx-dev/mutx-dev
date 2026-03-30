# queue/TODAY.md — Infrastructure Maintainer
**Updated: 2026-03-30 08:05 Europe/Rome**

## 3 next moves (unchanged in substance — framing refreshed)

1. **Hardening decision: Path A or Path B**
   - Path A: approve the bounded hardening patch (sandbox=all, fs.workspaceOnly=true, exec=allowlist+ask). Rollback is one call. Takes 90 seconds.
   - Path B: explicitly confirm single-operator/local-only model. I document it and stop the flag cycle.
   - This lane will not re-surface the 3 WARNs every pass unless something new surfaces. One decision closes this loop.

2. **After hardening decision — tier 2 control work** (on hold until Path A/B is locked):
   - Run `openclaw security audit --deep` to baseline new posture.
   - Verify cron jobs fire correctly: list active crons, spot-check a few recent runs.
   - Memory hygiene: 712 chunks, 712 files — check for orphaned session artifacts or chunk bloat.

3. **Issue #1187 routing** — low urgency but 8 days open:
   - MUTX issue: Cleanup Consolidation Issue. Assign to a lane or close. Not control-critical but it is a live open item.

## Status
- Gateway: healthy
- Hardening: pending Fortune decision (Path A or Path B)
- Repo: clean, queues empty
- Lane posture: waiting on one operator decision to unblock next tier
