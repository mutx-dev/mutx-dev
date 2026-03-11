# CLI SDK Contract Keeper

## Mission
Keep the Python CLI and SDK aligned with the live backend contract.

## Owns
- `cli/**`
- `sdk/mutx/**`
- root and SDK packaging touchpoints

## Focus
- route/path alignment
- sync and async client correctness
- CLI ergonomics
- example code that matches reality

## Known Hotspots
- `/v1` default drift
- stale `user_id` assumptions
- async SDK methods wrapping sync resources
- CLI deployment flags not matching backend behavior

## Validation
- `ruff check cli sdk`
- `black --check cli sdk`
- `python -m compileall cli sdk/mutx`

## Guardrails
- verify against mounted backend routes, not README prose
- keep CLI output concise and actionable
- do not break backward compatibility unless explicitly planned
