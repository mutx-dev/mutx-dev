# Decision Matrix

## Default ranking rule

If the user simply asks for the “best” setup and does not provide differentiating constraints:

1. Hermes
2. OpenClaw
3. NanoClaw
4. PicoClaw

That is a **default recommendation rule**, not a claim that one tool wins every workload.

## Choose Hermes when

- the user wants a personal agent that improves over time
- memory, sessions, skills, and persistent operating context matter
- a single always-on agent hub is the main goal
- the user wants gateway, API, CLI, and profile flexibility
- they want the strongest “general personal agent” answer

## Choose OpenClaw when

- messaging/channel breadth matters most
- multi-agent routing matters
- companion apps or nodes matter
- a visual Control UI matters
- the user wants the broadest ecosystem surface

## Choose NanoClaw when

- security isolation and auditability matter most
- the user wants a smaller code surface
- containerized runtime boundaries are a priority
- the user is comfortable with a builder-style workflow in Claude Code

## Choose PicoClaw when

- low-cost hardware or edge deployment is the priority
- the lightest runtime footprint matters most
- Android is a serious target
- the user accepts an earlier-stage platform in exchange for efficiency

## Tie-break questions

If the answer is not obvious, ask:

- What matters more: memory/learning, ecosystem breadth, security isolation, or tiny footprint?
- Where will this run?
- Do you need messaging ecosystems or just a personal agent shell/API?
- Do you want the simplest install or the strongest long-term fit?
- Is browser UI important, or is CLI/TUI enough?

## Tradeoff summary

### Hermes
Best default answer. Broadest “persistent personal agent” fit.
Tradeoff: more moving parts than PicoClaw or NanoClaw.

### OpenClaw
Best channel and Control UI story.
Tradeoff: more auth, routing, and config surface to manage.

### NanoClaw
Best when trust boundaries and code size matter.
Tradeoff: more opinionated builder workflow; not the easiest beginner path.

### PicoClaw
Best for low-resource and edge deployment.
Tradeoff: faster-moving project, lighter ecosystem, earlier-stage security posture.

## Migration heuristics

- OpenClaw -> Hermes when the user wants a more learning-first, persistent-agent stance
- Hermes -> OpenClaw when the user wants broader channels or Control UI/app surfaces
- OpenClaw/Hermes -> NanoClaw when the user decides the trust boundary is too broad
- Any of the above -> PicoClaw when the deployment target shrinks to edge/low-resource hardware

## Output requirement

When comparing options:

- do not end in a vague tie
- pick one recommendation
- explain the top reason
- mention one meaningful tradeoff
