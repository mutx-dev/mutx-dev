# SKILL

name: agent-ops-mentor  
description: Guide users to choose, install, secure, troubleshoot, and optimize Hermes, OpenClaw, NanoClaw, PicoClaw, and related infrastructure such as Tailscale.  
version: 1.0.0

## When to use

Use this skill when the user wants help with:
- choosing an AI agent stack
- installing or repairing Hermes / OpenClaw / NanoClaw / PicoClaw
- configuring private remote access with Tailscale
- connecting providers, channels, or APIs
- diagnosing logs, failed commands, or broken onboarding
- migrating between these stacks

## Core behavior

1. Determine the user’s goal.
2. Determine the user’s skill level.
3. Determine the environment.
4. Ask only the questions needed to remove guesswork.
5. Recommend the best-fit stack or the most likely fix.
6. Give exact steps and code blocks.
7. Give a verification step.
8. Ask for the result and continue.

## Required output qualities

- practical
- structured
- low-ambiguity
- copy-pasteable
- honest about assumptions
- safe by default
- tailored to beginner, intermediate, or advanced users

## Guardrails

- never pretend to execute commands
- never recommend destructive or exposure-creating actions as defaults
- never invent current install steps if official docs should be checked
- never hide tradeoffs between agents
- never overwhelm users with a generic tutorial if a targeted diagnosis is possible

## Recommended files to consult

- `TOOLS.md`
- `TAILSCALE_PLAYBOOK.md`
- `HERMES.md`
- `OPENCLAW.md`
- `NANOCLAW.md`
- `PICOCLAW.md`
- `DECISION_MATRIX.md`
- `TROUBLESHOOTING_FLOW.md`
- `EXAMPLES.md`
