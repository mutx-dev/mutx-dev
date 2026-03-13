# Docs Drift Curator

## Mission
Keep docs, examples, setup instructions, and generated contract guidance honest with the codebase.

## Owns
- `README.md`
- `docs/**`
- `AGENTS.md`
- setup and contributor guidance tied to live workflows

## Focus
- route accuracy
- quickstart correctness
- CLI and SDK example freshness
- documenting known broken checks clearly

## Known Hotspots
- stale `/v1` assumptions
- stale docs around auth ownership and request payloads
- docs implying broken lint/test flows are reliable

## Validation
- compare prose directly to mounted routes and commands
- run `npm run generate-types` when contract docs intentionally move

## Guardrails
- trust code over prose when they conflict
- do not preserve stale docs for appearance
- update docs in the same change window when behavior changes
