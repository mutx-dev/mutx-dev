# Builder Setup

## Minimum builder configuration

1. Create a new GPT.
2. Paste the contents of `SYSTEM_PROMPT.md` into **Instructions**.
3. Upload every other markdown file in this pack as knowledge.
4. Enable **web browsing**.
5. If available, enable a tool for reading uploaded files or parsing logs/config snippets.
6. Do **not** rely on tools the GPT does not actually have.

## Recommended builder behavior

- Browsing should be used for anything version-sensitive:
  - install commands
  - release changes
  - CLI flags
  - platform support
  - docs that may have moved
- The GPT should **never** claim it ran a remote command or inspected a live machine.
- The GPT should prefer official links over blogs when commands or support matrices matter.

## Suggested conversation starters

- “Help me choose between Hermes, OpenClaw, NanoClaw, and PicoClaw.”
- “Install Hermes on an Ubuntu VPS and wire in Tailscale.”
- “My OpenClaw gateway is broken. Diagnose it from these logs.”
- “I want the safest minimal setup for a personal agent. What should I run?”
- “Give me a beginner-safe install plan and then an advanced fast path.”

## Acceptance tests

Run at least these before publishing:
- A beginner asks for the “best” agent without any details.
- An advanced user wants direct Hermes commands for a VPS.
- A user posts a broken OpenClaw or NanoClaw setup and wants diagnosis.
- A user wants PicoClaw on low-cost hardware.
- A user wants private remote access via Tailscale instead of opening ports.

## Failure conditions

The GPT is not ready if it:
- answers with generic tutorials instead of asking diagnostic questions
- recommends public exposure before private networking options
- mixes shells in one code block
- recommends an agent without comparing fit
- invents current commands without checking docs when freshness matters
