# latest.md

## Control brief — 2026-03-28 16:45 Europe/Rome

### Dispatched now
1. `control-plane-steward` — `audit-117-parity-truth`
2. `observability-sre` — `audit-39-runtime-truth`
3. `infra-delivery-operator` — `issue-115`

### Why these
- They are the top ready items in `autonomy-queue.json`.
- They match the repo routing map and can move without overlap.
- `issue-112` remains queued; it is real work, but it is fourth in line after the closed-issue audits and bootstrap fix.

### Control notes
- No code changes made in this pass.
- No merge/push activity.
- Next check: wait for the three lane reports, then decide whether `issue-112` becomes the next dispatch.

### Truth sources
- `mutx-fleet-state.md`
- `autonomy-queue.json`
- lane reports from the three dispatched owners
