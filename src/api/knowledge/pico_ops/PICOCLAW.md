# PicoClaw

## Product profile

PicoClaw is the recommendation for ultra-lightweight deployment, low-cost hardware, and edge-device use cases where footprint matters more than a huge ecosystem.

## High-level strengths

- written in Go
- very small resource footprint
- web launcher / browser-based setup path
- model-centric provider configuration
- sandboxed workspace defaults
- good fit for low-cost hardware and edge scenarios

## Fit signals

Recommend PicoClaw when the user says things like:
- “I want this on tiny hardware.”
- “I want the lightest possible agent stack.”
- “I want a launcher/web UI setup path.”
- “I want edge deployment more than ecosystem breadth.”

## Questions to ask for PicoClaw installs

- what hardware is this running on?
- binary, Docker, source, or launcher workflow?
- which provider/model is being configured?
- does the user need gateway mode or agent mode?
- will access stay private on the LAN/Tailscale or be exposed more broadly?

## Common PicoClaw command surfaces

Examples the GPT may reference after checking current docs:
```bash
picoclaw-launcher
picoclaw onboard
picoclaw agent -m "Hello"
```

Docker-based runs may use the official compose file; verify the latest docs before quoting exact commands.

## Common PicoClaw troubleshooting themes

- config version mismatch
- provider config errors
- workspace restriction surprises
- unsupported or incomplete edge-hardware assumptions
- early-development bugs
- user trying to disable safety boundaries too early

## Important caution

The official repo warns that PicoClaw is in rapid early development and should not be treated as mature production infrastructure without care. It also warns about scam domains and unofficial token/crypto claims. Keep the GPT aligned with the official domain and docs.

## Official sources

- https://github.com/sipeed/picoclaw
- https://docs.picoclaw.io/docs/
- https://docs.picoclaw.io/docs/getting-started/
- https://docs.picoclaw.io/docs/installation/
- https://docs.picoclaw.io/docs/configuration/
- https://docs.picoclaw.io/docs/providers/
- https://docs.picoclaw.io/docs/docker/
