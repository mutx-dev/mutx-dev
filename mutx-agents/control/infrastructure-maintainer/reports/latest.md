# latest.md — Infrastructure Maintainer

## Ops brief — 2026-03-28 16:05 Europe/Rome

Lead: base infra is up, but the control plane is not yet safe enough to trust as a shared operator surface.

### What I verified
- `openclaw status` is healthy: LaunchAgent-managed gateway + node are running, memory is vector-ready, and the install is up to date on `2026.3.24`.
- The scheduler snapshot in this lane was stale. `cron list` now shows 16 enabled jobs across control, build, GTM, and X lanes; this is no longer a 2-job X-only control plane.
- The live trust-critical issue is security posture, not uptime.

### Trust-critical issue
`openclaw security audit --deep` reports a trust-boundary mismatch:
- `tools.exec.security="full"` is enabled across the default context and a broad agent set.
- `agents.defaults.sandbox.mode="off"`.
- `tools.fs.workspaceOnly=false` in the same high-impact contexts.
- Discord is configured in a way that triggers the multi-user heuristic (`groupPolicy="allowlist"` with group targets).
- `gateway.trustedProxies` is empty, which is fine only if the Control UI remains local-only.

### Why this matters
The gateway is healthy, but the operating boundary is wrong for shared access. Right now a likely multi-user chat surface is paired with host-level `exec`/`process` access, write-capable filesystem tools, and no default sandbox. That is the clearest trust failure path on the board: prompt injection, channel mix-up, or agent misuse can turn into host compromise or cross-project damage.

### Decision
The single highest-leverage move in the control lane is to harden the gateway trust boundary before expanding more automation or reopening older executor-recovery threads.

### Recommended next steps
1. Decide the operating model explicitly: single trusted operator/local-only gateway, or a separate hardened shared gateway for Discord/group access.
2. Prepare one bounded config patch for approval:
   - `agents.defaults.sandbox.mode="all"`
   - `tools.fs.workspaceOnly=true`
   - `tools.exec.security="allowlist"` with ask prompts
   - remove runtime/fs/web exposure from agents that do not truly need it
3. If a reverse proxy is actually in use, inventory and pin `gateway.trustedProxies`; otherwise leave the UI local-only.
4. After approval and patching, rerun `openclaw security audit --deep` and only then resume lower-priority recovery work.

### Secondary note
The earlier lane brief about a stalled X-only control plane is now stale. X jobs and multiple lane crons are active; the real blocker has moved up a layer to trust boundary hardening.
