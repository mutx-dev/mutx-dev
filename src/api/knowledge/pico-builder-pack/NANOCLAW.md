# NanoClaw

## Product profile

NanoClaw is the recommendation for users who want a smaller, easier-to-audit codebase and stronger isolation via containers rather than a giant all-in-one surface.

## High-level strengths

- lightweight mental model
- container isolation for agent runtime
- easier to understand and customize
- security-oriented positioning
- fast setup path via Claude Code and `/setup`
- fork-first customization model
- skills over feature bloat

## Fit signals

Recommend NanoClaw when the user says things like:

- “I don’t want to trust a huge codebase with my whole machine.”
- “I want agents isolated in containers.”
- “I want something smaller and easier to reason about.”
- “I’m okay with a more builder-oriented workflow.”

## Questions to ask for NanoClaw installs

- do they have Claude Code available?
- is Docker or Apple Container installed and working?
- are they fine with a Git-based / fork-based setup?
- are they on current OneCLI Agent Vault or old credential-proxy assumptions?
- what messaging platforms or providers matter?

## Current install realities

- the current quick start is fork or clone, `cd` into the repo, start `claude`, then run `/setup`
- commands prefixed with `/` are Claude Code skills and must be run inside the Claude Code prompt, not in the regular shell
- Node.js 20+ and Claude Code are required
- Docker is the default container runtime and works on macOS/Linux/Windows via WSL2
- Apple Container is macOS-only
- OneCLI Agent Vault is the modern credential path; current docs pin that shift to v1.2.35+
- `/setup` can install OneCLI automatically if needed
- WSL users should clone into the Linux filesystem (`~/nanoclaw`), not `/mnt/c/...`
- skills are now git branches and channels live in separate fork repos
- diagnostics are opt-in during setup and update flows

## Skill architecture to respect

- feature skills = git branches merged into your fork
- utility skills = self-contained skill directories
- operational skills = instruction-only workflows like setup/debug
- container skills = runtime skills inside agent containers

Do not answer as if the old marketplace-only skill model is still the main path.

## Common NanoClaw command surfaces

Examples the GPT may reference after checking current docs:

```bash
git clone https://github.com/<your-username>/nanoclaw.git
cd nanoclaw
claude
node --version
docker --version
onecli --help
```

Inside Claude Code, the guided path starts with:

```text
/setup
/debug
/customize
```

Depending on channel/fork choices, users may also hit skills like `/add-telegram`, `/add-whatsapp`, `/init-onecli`, or Apple-Container-related flows.

## Operator adaptation cues

- beginner: spell out where the shell ends and the Claude Code prompt begins
- intermediate: keep the order strict: prerequisites -> clone/fork -> `claude` -> `/setup` -> verify service -> add skills/channels
- advanced: if they already know Git and containers, focus on OneCLI, branch/fork state, and service health

## Common NanoClaw troubleshooting themes

- Docker missing or misconfigured
- Claude Code missing or launched in the wrong directory
- `/setup` run in the wrong place
- OneCLI Agent Vault not running or not configured
- container/service startup problems
- wrong assumption that normal shell commands can replace Claude Code skills
- stale channel forks after breaking changes
- WhatsApp re-merge or auth breakage after release changes

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
- https://docs.nanoclaw.dev/api/skills/creating-skills
- https://docs.nanoclaw.dev/api/configuration
- https://docs.nanoclaw.dev/advanced/troubleshooting
- https://docs.nanoclaw.dev/changelog
