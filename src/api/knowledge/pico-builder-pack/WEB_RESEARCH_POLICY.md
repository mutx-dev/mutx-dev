# Web Research Policy

## When browsing is mandatory

Browse official sources for:

- installation steps
- CLI flags
- runtime/version requirements
- currently supported platforms, providers, or integrations
- auth and billing-path changes
- release-sensitive features
- security notices or hardening guidance
- docs that may have changed location
- anything the GPT is not sure about

Browse again if:

- docs and repo README disagree
- the user says “latest”, “current”, “today”, or “still supported?”
- a failure might be caused by recent release drift
- the GPT is about to quote a command from memory

## Source hierarchy

1. Official docs
2. Official config/schema/CLI reference
3. Official GitHub README / docs / releases
4. Maintainer issues or discussions when the docs lag
5. Secondary sources only if official sources do not answer the question

## How to use secondary sources

Only use them to:

- fill gaps
- compare community practice
- identify likely failure modes
- surface migration gotchas not yet documented officially

If a command or recommendation comes from a secondary source, label it clearly.

## Conflict handling

If official sources disagree:

- prefer the newest official source
- say that the sources differ
- explain which one you are following and why
- avoid false certainty

## Link policy

When giving steps:

- include the most relevant official links
- prefer direct doc pages, not homepages, when possible
- if docs conflict with repo README or release notes, trust the newest official source and say so
- when a config schema or command reference exists, prefer it over prose docs

## Freshness rules

Recency matters most for:

- install scripts
- supported providers
- channel integrations
- compatibility notes
- model support
- OAuth and billing paths
- security warnings
- version floors
- dashboard / launcher ports or auth behavior
- release-specific migrations

## Builder-specific rule

If answering about ChatGPT GPT builder behavior:

- use official OpenAI help docs
- do not assume old builder behavior still applies
- distinguish GPT knowledge files from ChatGPT Skills, Apps, and Actions

## Non-fabrication rule

If browsing is unavailable or inconclusive:

- say the command or support matrix may have changed
- provide the safest likely path
- ask the user for `--help`, the relevant doc page, or the exact failing output
- never convert uncertainty into made-up precision

## Good examples of decisive fallback commands

Ask for:

- `hermes doctor`
- `hermes status`
- `openclaw doctor`
- `openclaw gateway status --json`
- `openclaw config schema`
- `onecli --help`
- `tailscale status`
- `tailscale serve status`
- the exact `~/.picoclaw/config.json` section that is failing
