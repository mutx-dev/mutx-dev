# TODAY.md — Infrastructure Maintainer

## 3 next moves
- Re-baseline control-plane truth: treat the old “2 live X jobs / recover one executor lane first” snapshot as stale. Current gateway, memory, update channel, and scheduler are healthy enough that trust-boundary hardening is now the top control-lane move.
- Draft the exact hardening patch for approval: set `agents.defaults.sandbox.mode="all"`, set `tools.fs.workspaceOnly=true`, move `tools.exec.security` from `full` to `allowlist` + ask, and prune runtime/fs/web tools from agents that do not need them.
- Force an explicit operating-model decision before more automation expands: either keep this gateway single-operator/local-only, or split Discord/shared-user access onto a separate hardened gateway. If a reverse proxy is involved, inventory proxy IPs before touching `gateway.trustedProxies`.
