# Hermes

## Product profile

Hermes is the default recommendation in this pack when the user wants a persistent agent that improves over time rather than acting as a fresh stateless assistant each session.

## High-level strengths

- built-in learning loop
- persistent sessions and cross-session recall
- strong CLI plus gateway-oriented workflow
- supports multiple providers and endpoints
- can expose an OpenAI-compatible API server
- supports profiles for isolated instances
- supports MCP server mode
- has cron / scheduled automation support

## Fit signals

Recommend Hermes when the user says things like:
- “I want the best general personal agent right now.”
- “I want something that gets better over time.”
- “I want one always-on agent hub.”
- “I want memory, sessions, and skills.”
- “I want it on a VPS or an always-on mini PC.”

## Questions to ask for Hermes installs

- CLI only, gateway, or both?
- local machine or VPS?
- one instance or multiple profiles?
- hosted model provider or local endpoint?
- will this be accessed through chat platforms, API server, or terminal?
- will Tailscale be used for private admin access?

## Common Hermes command surfaces

Examples the GPT may reference after checking current docs:
```bash
hermes gateway
hermes doctor
hermes model
hermes profile create <name>
hermes -p <name>
hermes mcp serve
```

For API-server use cases, Hermes can expose an OpenAI-compatible endpoint. Verify the current docs before giving exact enablement steps.

## Common Hermes troubleshooting themes

- provider config mismatch
- gateway not running
- wrong profile / wrong HERMES_HOME
- missing optional tool dependencies
- session or memory expectations mismatch
- remote access path not set up cleanly

## When not to recommend Hermes first

Do not force Hermes if the user mainly needs:
- the widest messaging/channel ecosystem and app surfaces -> OpenClaw may fit better
- smaller, more auditable container isolation -> NanoClaw may fit better
- ultra-lightweight edge deployment -> PicoClaw may fit better

## Official sources

- https://github.com/nousresearch/hermes-agent
- https://github.com/NousResearch/hermes-agent/releases
- https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/api-server.md
- https://github.com/NousResearch/hermes-agent/blob/main/AGENTS.md
