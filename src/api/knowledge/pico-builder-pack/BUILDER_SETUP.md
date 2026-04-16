# Builder Setup

## Minimum builder configuration

1. Create a new GPT.
2. Paste the contents of `SYSTEM_PROMPT.md` into **Instructions**.
3. Upload every other markdown file in this pack as knowledge.
4. Enable **web browsing**.
5. If available, enable a tool for reading uploaded files or parsing logs/config snippets.
6. Do **not** rely on tools the GPT does not actually have.

## Current GPT builder facts to respect

- Building and editing GPTs is limited to the **web** experience.
- GPTs can be built conversationally or configured directly in the editor.
- GPTs can include **instructions, knowledge, capabilities, apps, actions, and version history**.
- A GPT can use **either apps or actions, but not both at the same time**.
- In Enterprise/Edu/Business workspaces, admins can restrict apps and actions.
- ChatGPT Skills are a separate feature from GPT knowledge files; do not treat them as interchangeable.

## Recommended builder behavior

- Browsing should be used for anything version-sensitive:
  - install commands
  - release changes
  - CLI flags
  - platform support
  - docs that may have moved
- The GPT should **never** claim it ran a remote command or inspected a live machine.
- The GPT should prefer official links over blogs when commands or support matrices matter.
- If the builder workspace supports apps, actions, or skills, keep the prompt aware of those boundaries but do not hallucinate that they exist in every deployment.

## Suggested conversation starters

- “Help me choose between Hermes, OpenClaw, NanoClaw, and PicoClaw.”
- “Install Hermes on an Ubuntu VPS and wire in Tailscale.”
- “My OpenClaw gateway is broken. Diagnose it from these logs.”
- “I want the safest minimal setup for a personal agent. What should I run?”
- “Give me a beginner-safe install plan and then an advanced fast path.”
- “I need a private remote dashboard without opening ports.”

## Knowledge upload order

If you want a deliberate upload order, use:

1. `SYSTEM_PROMPT.md`
2. `SKILL.md`
3. `TOOLS.md`
4. `SAFETY_POLICY.md`
5. `WEB_RESEARCH_POLICY.md`
6. `TAILSCALE_PLAYBOOK.md`
7. product files
8. `TROUBLESHOOTING_FLOW.md`
9. `INSTALL_FLOW.md`
10. `COMMAND_FORMAT.md`
11. `DECISION_MATRIX.md`
12. `EXAMPLES.md`

This is not mandatory, but it keeps core behavior and safety files more prominent.

## Acceptance tests

Run at least these before publishing:

- A beginner asks for the “best” stack without any details.
- An advanced user wants direct Hermes commands for a VPS.
- A user posts a broken OpenClaw or NanoClaw setup and wants diagnosis.
- A user wants PicoClaw on low-cost hardware or Android.
- A user wants private remote access via Tailscale instead of opening ports.
- A user asks a version-sensitive install question and the GPT actually checks docs before answering.
- A user pastes a bad config and the GPT asks for the smallest decisive fix, not a full reinstall.

## Failure conditions

The GPT is not ready if it:

- answers with generic tutorials instead of asking diagnostic questions
- recommends public exposure before private networking options
- mixes shells in one code block
- recommends a stack without comparing fit
- invents current commands without checking docs when freshness matters
- asks for real name or email only to populate telemetry
- acts like apps, actions, skills, or custom tools exist when they are not enabled
