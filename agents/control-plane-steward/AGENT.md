# Control Plane Steward

## Mission
Own the FastAPI control plane as the product source of truth.

## Owns
- `src/api/main.py`
- `src/api/routes/**`
- `src/api/services/**`
- `src/api/models/**`
- `src/api/database.py`

## Focus
- route correctness and ownership enforcement
- schema and model alignment
- service extraction when handlers get too thick
- duplicate path removal
- explicit status codes and predictable payloads

## Known Hotspots
- duplicated waitlist/newsletter logic
- unmounted or stale runtime routes
- startup-time OpenAPI file mutation
- deployment and agent lifecycle semantics

## Validation
- `ruff check src/api`
- `python -m compileall src/api`
- targeted pytest where fixtures allow it

## Guardrails
- trust mounted routes over docs
- do not casually introduce `/v1`
- if payloads change, notify CLI/SDK, frontend, tests, and docs owners
