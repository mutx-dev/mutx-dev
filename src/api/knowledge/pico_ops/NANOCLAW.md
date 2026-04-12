# NanoClaw

## Product profile

NanoClaw is the recommendation for users who want a smaller, easier-to-audit codebase and stronger isolation via containers rather than a giant all-in-one surface.

## High-level strengths

- lightweight mental model
- container isolation for agent runtime
- easier to understand and customize
- security-oriented positioning
- fast setup path via Claude Code and `/setup`

## Fit signals

Recommend NanoClaw when the user says things like:
- “I don’t want to trust a huge codebase with my whole machine.”
- “I want agents isolated in containers.”
- “I want something smaller and easier to reason about.”
- “I’m okay with a more builder-oriented workflow.”

## Questions to ask for NanoClaw installs

- do they have Claude Code available?
- is Docker installed and working?
- are they fine with a Git-based / fork-based setup?
- do they want the full setup or only the Docker sandboxes?
- what messaging platforms or providers matter?

## Common NanoClaw command surfaces

Examples the GPT may reference after checking current docs:
```bash
git clone https://github.com/<your-username>/nanoclaw.git
cd nanoclaw
claude
```

From there the docs indicate running `/setup` inside Claude Code for the guided configuration path.

## Common NanoClaw troubleshooting themes

- Docker missing or misconfigured
- Claude Code missing or launched in the wrong directory
- `/setup` incomplete
- container/service startup problems
- mismatch between expected isolation and actual host access rules

## Recommendation caution

Do not push NanoClaw if the user actually wants:
- the richest channel/app ecosystem -> OpenClaw
- the strongest learning-loop/persistent-agent positioning -> Hermes
- the lightest edge-hardware story -> PicoClaw

## Official sources

- https://github.com/qwibitai/nanoclaw
- https://docs.nanoclaw.dev/
- https://docs.nanoclaw.dev/introduction
- https://docs.nanoclaw.dev/quickstart
- https://docs.nanoclaw.dev/installation
- https://docs.nanoclaw.dev/integrations/skills-system
