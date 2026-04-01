# queue/TODAY.md — Infrastructure Maintainer
**Updated: 2026-04-01 08:05 Europe/Rome**

## Single highest-leverage move — hardening patch, ~80 hours old

**Path A — Approve bounded hardening patch:**
```
agents.defaults.sandbox.mode="all"
tools.fs.workspaceOnly=true
tools.exec.security="allowlist" + ask
```
One `config.patch` call. Reversible. Takes 90 seconds.

**Path B — Lock in single-operator model:**
Say: "keep full exec, local-only, single operator."
I document it, close the flag cycle, and scope the lane to monitoring-only with hard escalation triggers.

## New this pass: two broken X crons need attention

- `aada85e8` (X Draft Engine): 11 consecutive errors, `LiveSessionModelSwitchError: openai-codex/gpt-5.4-mini`
- `386af6d6` (X Worker Controller): 11 consecutive errors, same error
- Both are isolated-session crons that cannot honor the model-switch request
- Fix: either remove the model override from those cron payloads, or handle the switch guardrail explicitly

## After hardening is resolved

1. Run `openclaw security audit --deep` — baseline new posture
2. Fix X cron model-switch errors (aada85e8, 386af6d6)
3. Verify cron run history across engineering fleet crons

## Issue #1187
MUTX issue: Cleanup Consolidation. 9+ days old. Assign to a lane or close.

## Status
- Gateway: healthy (LaunchAgent, 174 agents, 743 chunks, 180 sessions)
- MUTX main: `e4d779cb` (advanced from `433d2d14`)
- Security audit: 0 critical · 3 warn (unchanged)
- Hardening: pending Fortune decision — Path A or B
- X crons (aada85e8, 386af6d6): broken, 11 consecutive errors each
- PR #1219: mergeable, CI green, waiting on second reviewer (not control-lane owned)
