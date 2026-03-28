# Hermes eval — 2026-03-28

## What I did
- Installed Hermes in an isolated path at `~/.hermes-eval/src/hermes-agent`.
- Used isolated Hermes home `~/.hermes-eval/home` via `HERMES_HOME`.
- Ran OpenClaw migration from `~/.openclaw` into the isolated Hermes home.
- Applied a lean orchestration-oriented Hermes config:
  - explicit workspace cwd -> `/Users/fortune/.openclaw/workspace`
  - timezone -> `Europe/Rome`
  - slim platform toolsets for `cli` and `discord`
  - smart routing -> cheap simple turns to `gpt-5.4-mini`
  - delegation -> `gpt-5.4-mini`
- Rewired the eval config away from broken imported Anthropic mapping and toward direct OpenAI custom endpoint wiring.

## What migrated cleanly
- persona (`SOUL.md`)
- workspace instructions (`AGENTS.md`)
- memory / daily memory merge
- user profile
- user skills and shared skills
- Discord / Telegram settings
- basic command allowlist

## What did **not** migrate as a usable control plane
- multi-agent fleet was **archived**, not recreated
- routing bindings were **archived**, not recreated
- cron topology was **archived**, not recreated
- session / gateway / tool / memory-backend details need manual rebuild
- deep channel config and model aliases were archived for review

## Archived control-plane size
- archived agents: **173**
- archived cron jobs: **39**
- distinct cron agents represented: **25**
- routing bindings archived: main Discord default route only

## Hard blockers found
1. **Model auth is not production-ready after migration**
   - direct OpenAI lane in this environment is quota-exhausted
   - Hermes did not emerge with working Codex auth for `openai-codex`
   - result: the isolated Hermes install is configured, but not yet runnable for 24/7 work

2. **Live Discord cutover would collide with the current bot surface**
   - Hermes imported the Discord token
   - starting Hermes gateway while OpenClaw is live would risk duplicate/conflicting gateway consumption
   - safe path is shadow eval first, then explicit cutover

3. **Migration imports the shell, not the orchestration shape**
   - the important MUTX value is the running topology
   - Hermes does not auto-recreate that topology from OpenClaw today

## Current verdict
**No live cutover yet.**

Hermes is interesting for:
- isolated subagent delegation
- code-execution / RPC-style pipeline collapse
- low-idle remote/serverless operation
- better self-improving memory story

But for MUTX internal ops today, the migration is still blocked by:
- missing working model auth lane
- manual rebuild requirement for the fleet/cron/routing graph
- live gateway collision risk

## Best next move
Do a **bounded shadow eval** instead of a hard migration:
1. fix a real Hermes model auth lane (`hermes login` or funded direct API lane)
2. recreate **one** low-risk cron lane in Hermes
3. validate agent-to-agent delegation on real work
4. only then decide whether to move more orchestration
