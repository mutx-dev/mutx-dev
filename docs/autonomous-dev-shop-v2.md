# Autonomous Dev Shop v2

This document defines the low-noise, high-throughput autonomous coding model for MUTX.

## Objective

Run MUTX as a 24/7 coding shop with:
- zero fake progress
- minimal idle time
- minimal token waste
- bounded concurrency
- hard ownership lines
- CI as scoreboard

## Core principle

Do not spend tokens while the system is confused.

Token-efficient autonomy means:
- one queue truth
- one orchestrator
- only a few active workers
- no duplicate task execution
- no speculative prompting when queue is empty
- no repeated retries on known broken failure classes

## Canonical lanes

- `main` — orchestrator plus low-risk docs/truth worker
- `codex` — backend worker
- `opencode` — frontend worker

Professional routing rule:
- do not route docs/truth tasks through Codex by default
- reserve Codex for backend/API/runtime work where its lane specialization matters
- let `main` absorb bounded docs/truth tasks so Codex quota pressure does not stall the whole shop

## Execution flow

1. Queue item becomes `queued`
2. `main` normalizes it into a work order
3. `main` selects exactly one worker lane
4. worker executes in exactly one worktree
5. worker returns summary + verification outcome
6. report is written
7. task is merged, parked, or blocked

## Anti-waste rules

### When queue is empty
- do not call LLMs
- sleep with exponential backoff or steady heartbeat
- emit no-op report at most on coarse interval

### When a failure class is known
If any of these happen, stop spending tokens for that lane until fixed:
- model/provider 404
- auth failure
- quota failure
- missing worktree
- stale CLI contract
- import/runtime bootstrap failure

### When a task is too vague
- do not prompt worker
- mark blocked
- request clarification upstream in queue metadata

### When a worker leaves scope
- fail guardrail
- report blocker
- do not auto-retry the same payload unchanged

## Scheduling model

Preferred:
- one long-running orchestrator daemon with backoff when idle
- optional watchdog cron for process resurrection only
- optional summary cron at low frequency

Avoid:
- many overlapping coding daemons
- many overlapping crons doing real work
- multiple independent pollers hitting the same queue

## Why the old setup wasted tokens

Observed problems from the previous substrate:
- stale command-line flags
- repeated provider failures
- repeated spawn/import failures
- multiple overlapping workspaces and loops
- queue and signal confusion

Those failures create expensive loops that do work-shaped movement without shipping.

## Recommended live policy

### OpenCode
- primary active worker until Codex quota is healthy
- use for frontend/dashboard/site tasks

### Codex
- use for backend/runtime/API tasks
- if quota is exhausted, the lane should auto-pause
- when quota resets, resume the lane and continue

### main
- must remain cheap, deterministic, and mostly non-LLM until a real task is ready

## Worktree policy

- backend tasks -> backend worktree only
- frontend tasks -> frontend worktree only
- no autonomous edits in root checkout

## Verification policy

- run the smallest truthful verification per task
- use CI as final scoreboard
- do not run full-universe validation for tiny changes unless merge stage requires it

## Operational target

Success is not “agents are busy.”
Success is:
- queue is draining
- reports are truthful
- CI is green
- shipped change volume rises
- token spend per shipped diff falls

## Relevant implementation files

- `scripts/autonomy/lane_contract.py`
- `scripts/autonomy/queue_state.py`
- `scripts/autonomy/worktree_utils.py`
- `scripts/autonomy/orchestrator_main.py`
- `scripts/autonomy/daemon_main.py`
- `scripts/autonomy/run_opencode_lane.py`
- `scripts/autonomy/run_codex_lane.py`
- `scripts/autonomy/report_status.py`
