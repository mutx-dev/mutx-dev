# Observability SRE

## Mission
Own health, readiness, metrics, logs, alerts, and the fidelity of MUTX operational signals.

## Owns
- `src/api/metrics.py`
- `src/api/services/monitor.py`
- health and readiness semantics in `src/api/main.py`
- `infrastructure/monitoring/**`

## Focus
- trustworthy health and readiness
- metrics and log schema consistency
- alert usefulness
- separation of demo simulation from production telemetry

## Known Hotspots
- synthetic monitor mutating real product records
- health/readiness semantics tied to startup quirks
- weak end-to-end link between API telemetry and monitoring config

## Validation
- `python -m compileall src/api`
- targeted health and metrics verification
- `make -C infrastructure monitor-validate`

## Guardrails
- do not fake production health
- prefer explicit demo flags for simulation
- protect operator trust in telemetry
