# Agent GPT Builder Pack

This pack is for a custom GPT that acts as a high-end coach for self-hosted AI agents, with a **Hermes-first** recommendation stance and explicit support for **OpenClaw, NanoClaw, PicoClaw, and Tailscale**.

## What goes where

- Put **SYSTEM_PROMPT.md** into the GPT Builder **Instructions** field.
- Upload **all other `.md` files** as GPT knowledge.
- Enable **web browsing**. If available, enable a tool that can parse files or logs, but do **not** assume shell access.
- Test with beginner, intermediate, and advanced scenarios before publishing.

## Why the split exists

The main instruction field is length-limited. Put the invariant operating behavior in the system prompt and move agent-specific detail, decision logic, examples, and evolving source references into the knowledge files.

## File map

1. `SYSTEM_PROMPT.md` — main system prompt (7282 characters)
2. `BUILDER_SETUP.md` — builder configuration checklist
3. `SCOPE_AND_PERSONA.md` — mission, audience, stance, non-goals
4. `INTERACTION_PROTOCOL.md` — conversation flow
5. `USER_PROFILING.md` — question bank and skill-level detection
6. `INSTALL_FLOW.md` — install workflow across agents
7. `TROUBLESHOOTING_FLOW.md` — diagnostic trees
8. `COMMAND_FORMAT.md` — command and output formatting rules
9. `WEB_RESEARCH_POLICY.md` — source hierarchy and recency rules
10. `SAFETY_POLICY.md` — confirmations, secrets, and exposure rules
11. `TAILSCALE_PLAYBOOK.md` — secure networking guidance
12. `HERMES.md` — product profile and cues
13. `OPENCLAW.md` — product profile and cues
14. `NANOCLAW.md` — product profile and cues
15. `PICOCLAW.md` — product profile and cues
16. `DECISION_MATRIX.md` — which agent to recommend
17. `SKILL.md` — condensed operational behavior
18. `TOOLS.md` — conceptual tool selection logic
19. `EXAMPLES.md` — style calibration examples
20. `README.md` — this file

## Recommended GPT name ideas

- Hermes Agent Ops Guide
- Agent Install & Repair Coach
- Self-Hosted Agent Operator
- Hermes + Claw Stack Mentor

## Update rhythm

Refresh the agent-specific docs and source links when:
- install commands change
- platform support changes
- new release notes introduce or remove major features
- Tailscale networking guidance changes materially

## Sources used for this pack

Official repositories and docs were used as the reference backbone:
- Hermes Agent: `github.com/nousresearch/hermes-agent`
- OpenClaw: `github.com/openclaw/openclaw` and `docs.openclaw.ai`
- NanoClaw: `github.com/qwibitai/nanoclaw` and `docs.nanoclaw.dev`
- PicoClaw: `github.com/sipeed/picoclaw` and `docs.picoclaw.io`
- Tailscale docs: `tailscale.com/kb`
