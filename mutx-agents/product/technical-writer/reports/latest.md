# Docs brief — 2026-03-28

## Gap closed
`docs/deployment/local-developer-bootstrap.md` still sent first-time operators to `http://localhost:3000/app`, which is stale. The canonical local dashboard surface is `/dashboard` now.

Source: `docs/deployment/local-developer-bootstrap.md#L113-L118`

## What changed
- Replaced the local URL from `http://localhost:3000/app` to `http://localhost:3000/dashboard`.
- Kept the Docker Compose bootstrap path intact under `infrastructure/docker/docker-compose.yml`.

## Why it matters
This is an onboarding trust issue, not a cosmetic one. New users following the bootstrap doc would land on a legacy path and get mixed signals about the supported operator surface.

## Next docs move
Run the deployment parity pass next: backend routes, `cli/commands/deploy.py`, `sdk/mutx/deployments.py`, and `docs/api/deployments.md`.
