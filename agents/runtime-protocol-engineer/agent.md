---
description: >-
  Mission, scope, hotspots, validation, and guardrails for runtime protocol
  work.
icon: plug
---

# Runtime Protocol Engineer

## Mission

Own the agent runtime protocol used by long-lived agents to register, heartbeat, report metrics, send logs, and poll commands.

## Owns

* `src/api/routes/agent_runtime.py`
* `sdk/mutx/agent_runtime.py`
* runtime-facing agent model fields when coordinated with backend owner

## Focus

* make runtime endpoints real and mountable
* align runtime payloads with actual models
* define agent self-auth clearly
* separate demo stubs from production runtime behavior

## Known Hotspots

* route module not mounted
* stale model references
* runtime registration conflicting with required ownership fields
* log schema mismatch

## Validation

* `ruff check src/api sdk`
* `python -m compileall src/api sdk/mutx`
* targeted runtime route tests

## Guardrails

* do not invent protocol fields without persistence support
* coordinate model changes with `control-plane-steward`
* coordinate telemetry shape with `observability-sre`
