# PicoClaw

## Product profile

PicoClaw is the recommendation for ultra-lightweight deployment, low-cost hardware, Android, and edge-device use cases where footprint matters more than a huge ecosystem.

## High-level strengths

- written in Go
- very small resource footprint
- launcher / browser-based setup path
- TUI launcher for headless environments
- model-centric provider configuration
- sandboxed workspace defaults
- good fit for low-cost hardware and edge scenarios

## Fit signals

Recommend PicoClaw when the user says things like:

- “I want this on tiny hardware.”
- “I want the lightest possible agent stack.”
- “I want a launcher/web UI setup path.”
- “I want edge deployment more than ecosystem breadth.”
- “I want Android or embedded-device options.”

## Questions to ask for PicoClaw installs

- what hardware is this running on?
- binary, launcher, Docker, source, or Android app workflow?
- which provider/model is being configured?
- does the user need gateway mode or agent mode?
- will access stay private on the LAN/Tailscale or be exposed more broadly?

## Current install realities

- the official website download is still the recommended fast path
- the docs keep the core source install lighter than the full launcher development path
- the core docs still show a Go 1.21+ source path, so do not tell users they need the full Go + Node + pnpm stack unless they are actually building launcher/Web UI components
- the repo README currently calls for Go 1.25+, Node.js 22+, and pnpm 10.33.0+ for launcher / Web UI development builds
- the workspace is `~/.picoclaw/`
- config lives at `~/.picoclaw/config.json`
- config schema `2` is current
- `.security.yml` is a first-class place for secrets
- in schema `2`, model credentials should come from `.security.yml`; `config.json` `api_key` can be ignored for `model_list`
- the release package includes `picoclaw-launcher` for browser-based setup at `http://localhost:18800`
- headless installs can use `picoclaw-launcher-tui`
- adding `-public` to the launcher broadens exposure to all interfaces, so it is not a safe default
- Docker and Android are now first-class documented install paths
- the gateway handles all enabled channels concurrently
- `restrict_to_workspace` defaults to `true`

## Common PicoClaw command surfaces

Examples the GPT may reference after checking current docs:

```bash
picoclaw onboard
picoclaw agent -m "Hello"
picoclaw agent
picoclaw gateway
picoclaw status
picoclaw cron list
picoclaw-launcher
picoclaw-launcher-tui
```

If the user wants the GUI path, remember that the launcher is local by default. For remote admin, prefer Tailscale or another private path rather than telling them to make the launcher public immediately.

## Operator adaptation cues

- beginner: start with the launcher, confirm the browser opens on `http://localhost:18800`, then configure provider -> channel -> gateway in that order
- intermediate: decide early whether they are doing launcher, Docker, or source, because those paths diverge quickly
- advanced: if they are building from source or running on odd hardware, give the build/runtime prerequisites first and keep debugging checkpoints focused on bind address, provider config, and gateway state

## Common PicoClaw troubleshooting themes

- config version mismatch
- provider config errors
- secrets stored in the wrong file
- launcher reachable locally but not remotely because it is bound only to localhost
- macOS Gatekeeper blocking the unsigned launcher on first run
- workspace restriction surprises
- unsupported or incomplete edge-hardware assumptions
- early-development bugs
- user trying to disable safety boundaries too early

## Important caution

The official repo warns that PicoClaw is in rapid early development and should not be treated as mature production infrastructure without care. It also warns about scam domains and unofficial token/crypto claims. Keep the GPT aligned with the official domain and docs.

## Official sources

- https://github.com/sipeed/picoclaw
- https://github.com/sipeed/picoclaw/releases
- https://picoclaw.io/
- https://docs.picoclaw.io/docs/
- https://docs.picoclaw.io/docs/getting-started/
- https://docs.picoclaw.io/docs/installation/
- https://docs.picoclaw.io/docs/installation/android/
- https://docs.picoclaw.io/docs/configuration/
- https://docs.picoclaw.io/docs/configuration/security-sandbox/
- https://docs.picoclaw.io/docs/configuration/config-reference
- https://docs.picoclaw.io/docs/channels/
- https://docs.picoclaw.io/docs/docker/
