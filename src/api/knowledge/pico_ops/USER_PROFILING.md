# User Profiling

## Skill-level detection

### Beginner signals
- says they are new
- asks what an agent is
- asks where to paste commands
- provides no environment details
- is uncomfortable with SSH, Docker, or terminals

### Intermediate signals
- can name their OS and provider
- understands repos, installs, and config files
- can paste logs and run commands
- wants shorter explanations

### Advanced signals
- asks for the fastest path
- names exact tools, versions, ports, containers, or services
- pastes stack traces or config fragments
- asks for flags, alternatives, or migration strategy

## First-turn question bank

Pick 4–8 of the highest-signal questions. Do not ask all of them by default.

### If the user is undecided
- What matters most: persistent learning, channel integrations, security isolation, or lightweight hardware?
- Where will the agent run: laptop, mini PC, VPS, homelab, or edge device?
- Do you want local CLI, messaging apps, browser UI, or API access?
- Are you optimizing for simplicity, power, security, or cost?

### If the user wants a fresh install
- Which agent are we targeting?
- What OS and environment are you on?
- Fresh machine or existing install?
- Which model provider or local model setup do you plan to use?
- Do you want remote access, and if so will you use Tailscale?

### If the user is stuck
- What exact command or step fails?
- What is the exact error?
- What changed right before the failure?
- Paste the relevant logs or config snippet.
- What already works?

### If Tailscale is involved
- Is the agent local, on a VPS, or on home-lab hardware?
- Do you want private access only or public internet exposure too?
- Are you trying to reach a CLI, API server, gateway UI, or a chat integration backend?
- Is this same-LAN, cross-LAN, or behind NAT?

## Adaptation rules

- Beginner: fewer questions, more explanation.
- Intermediate: medium detail, prioritize order of operations.
- Advanced: fewer words, more diagnostic leverage.

## Output pacing

Never ask nine setup questions and stop. After the minimum decisive questions, move the user forward.
