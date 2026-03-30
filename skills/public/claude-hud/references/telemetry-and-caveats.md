# Claude HUD telemetry and caveats


## Contents

- [Telemetry model](#telemetry-model)
- [Repo truths that matter](#repo-truths-that-matter)
  - [It is a native statusline plugin](#it-is-a-native-statusline-plugin)
  - [Context percentage prefers Claude Code's native number](#context-percentage-prefers-claude-codes-native-number)
  - [Buffered percentage is a compatibility heuristic](#buffered-percentage-is-a-compatibility-heuristic)
  - [Usage limits are conditional](#usage-limits-are-conditional)
  - [Tool / agent / todo lines are transcript-derived](#tool-agent-todo-lines-are-transcript-derived)
  - [Transcript parsing is cached](#transcript-parsing-is-cached)
  - [Session name is derived from transcript metadata](#session-name-is-derived-from-transcript-metadata)
  - [Memory usage is approximate system RAM](#memory-usage-is-approximate-system-ram)
- [Default behavior worth remembering](#default-behavior-worth-remembering)
- [Good explanations to give users](#good-explanations-to-give-users)
  - [“Why don't I see tools/agents/todos?”](#why-dont-i-see-toolsagentstodos)
  - [“Why don't I see usage?”](#why-dont-i-see-usage)
  - [“Why is the context number different?”](#why-is-the-context-number-different)
  - [“Why isn't the HUD showing after setup?”](#why-isnt-the-hud-showing-after-setup)
- [References into the repo](#references-into-the-repo)

## Telemetry model

Claude HUD combines multiple data sources:

1. **Claude Code stdin JSON**
   - model identity
   - context window size
   - current token usage
   - native `used_percentage` when Claude Code provides it
   - subscriber `rate_limits` when available
   - transcript path
   - cwd

2. **Session transcript JSONL**
   - tool invocations/results
   - agent task launches/completions
   - todo writes and updates
   - session slug / custom title

3. **Local filesystem/config inspection**
   - git branch and dirty/ahead/behind/file stats
   - CLAUDE.md/rules/MCP/hooks counts
   - installed Claude Code version
   - approximate system RAM usage

## Repo truths that matter

### It is a native statusline plugin

The HUD renders through Claude Code's statusline API. That means:
- no extra terminal panes
- no browser UI
- no separate long-running service
- it only knows what Claude Code stdin and the transcript expose

### Context percentage prefers Claude Code's native number

`src/stdin.ts` prefers `context_window.used_percentage` when Claude Code supplies it. This is the most accurate and should match Claude Code's own `/context` output.

Only older versions fall back to manual token math.

### Buffered percentage is a compatibility heuristic

The repo contains an empirically derived `AUTOCOMPACT_BUFFER_PERCENT = 0.165` for older fallback calculations. This is explicitly documented in code as unofficial and may need adjustment if Claude Code behavior changes.

Do not describe that value as an Anthropic guarantee.

### Usage limits are conditional

Subscriber usage comes only from stdin `rate_limits`.

Implications:
- API-key-only users do not get subscriber usage windows.
- Bedrock sessions intentionally suppress usage display in the HUD.
- Older Claude Code versions that do not emit `rate_limits` will not show usage.
- Weekly-only/free accounts can render only the weekly window.

### Tool / agent / todo lines are transcript-derived

These lines are not guaranteed to appear immediately or forever. They depend on transcript activity and are hidden by default unless enabled.

Tool parsing details from `src/transcript.ts`:
- running tool = `tool_use` without matching `tool_result`
- completed/error tool = matching `tool_result`
- file/command target is extracted heuristically from tool input

Agent parsing details:
- subagents are inferred from `Task` tool uses
- status becomes completed when the matching tool result appears

Todo parsing details:
- supports `TodoWrite`
- also supports `TaskCreate` / `TaskUpdate`
- status normalization maps variants like `not_started`, `running`, `done`

### Transcript parsing is cached

The plugin caches parsed transcript results under the Claude HUD plugin directory using a hash of the transcript path plus file size/mtime state. This matters when debugging because stale-looking behavior may actually be cache reuse until the transcript file changes.

### Session name is derived from transcript metadata

The HUD can show either a custom title or the session slug when `display.showSessionName` is enabled. It is not an independently managed HUD-only field.

### Memory usage is approximate system RAM

`display.showMemoryUsage` shows host-level used RAM approximation from OS total/free memory, not precise Claude Code process memory or memory pressure. The README explicitly notes that cache/buffers can make the number look higher than perceived pressure.

## Default behavior worth remembering

From `DEFAULT_CONFIG` in `src/config.ts`:
- `lineLayout: expanded`
- `pathLevels: 1`
- git enabled with dirty marker
- usage shown when available
- tools/agents/todos hidden by default
- session name/version/duration/memory/config counts hidden by default
- token breakdown enabled by default
- custom line empty by default

## Good explanations to give users

### “Why don't I see tools/agents/todos?”

Because those lines are off by default and also only render when there is actual transcript activity.

### “Why don't I see usage?”

Most likely causes:
- API-key session
- Bedrock session
- Claude Code has not emitted `rate_limits` yet
- older Claude Code version
- `display.showUsage` disabled

### “Why is the context number different?”

If Claude Code supplies native `used_percentage`, the HUD follows it. If not, the HUD falls back to token-based calculation, which is inherently more approximate.

### “Why isn't the HUD showing after setup?”

Most common answer: Claude Code has not been fully restarted after `statusLine` was written.

## References into the repo

Useful files when deeper verification is needed:
- `README.md`
- `CLAUDE.README.md`
- `commands/setup.md`
- `commands/configure.md`
- `src/stdin.ts`
- `src/transcript.ts`
- `src/config.ts`
- `src/index.ts`
- `src/render/lines/usage.ts`
