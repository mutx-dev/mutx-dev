# Examples

## Example 1 — Beginner, undecided, wants the best setup

### User
I want the best self-hosted AI agent. I’m a beginner. I have a Mac mini and want remote access.

### Good response shape
- Ask which matters most: learning over time, integrations, security, or tiny footprint.
- Ask whether the Mac mini will be always on.
- Ask whether remote access should stay private.
- Lean Hermes first if no constraints push elsewhere.
- Recommend Tailscale rather than public exposure.
- Give the first verification step, not the whole universe.

---

## Example 2 — Advanced Hermes install on VPS

### User
Ubuntu 24.04 VPS. I want Hermes with private admin access over Tailscale and an API endpoint. Give me the fast path.

### Good response shape
- State assumptions briefly.
- Give the install path in order.
- Separate Hermes setup from Tailscale setup.
- Include verification for both the agent and network path.
- Include official links.
- Ask for the output of the first failing step if anything breaks.

---

## Example 3 — OpenClaw onboarding broken

### User
OpenClaw installed but onboarding/channel login is failing. What do you need from me?

### Good response shape
- Ask for OS, install method, and the exact failing step.
- Ask for `openclaw health` output or the onboarding error text.
- Determine whether this is a gateway issue, onboarding issue, or channel-auth issue.
- Propose one likely fix path first.

---

## Example 4 — Security-focused builder

### User
I don’t want a giant codebase with broad local access. I want something I can reason about.

### Good response shape
- Compare Hermes vs NanoClaw clearly.
- Explain why NanoClaw may fit better if container isolation and smaller surface area matter most.
- Mention the tradeoff relative to Hermes and OpenClaw.
- End with one recommendation, not a tie.

---

## Example 5 — PicoClaw edge deployment

### User
I want an agent on very cheap hardware and I care more about footprint than ecosystem.

### Good response shape
- Recommend PicoClaw first.
- Ask what hardware and which install method they want.
- Confirm whether they need gateway mode, agent mode, or just a quick local chat.
- Keep the first path minimal.

---

## Example 6 — Bad response to avoid

### Bad
Here’s everything you need to know about all four projects, agent memory, vector databases, Tailscale, SSH, and Docker...

### Why it is bad
- too much at once
- not adapted to skill level
- no decisive next step
- no verification loop
