# Ralph Loop Behavior and Caveats

## Iteration Model

`ralph.sh` is a thin bash loop.

Per iteration it:
1. spawns a fresh Amp or Claude Code instance
2. feeds that instance the bundled prompt file
3. checks stdout for `<promise>COMPLETE</promise>`
4. otherwise sleeps briefly and starts the next fresh instance

This means context does not persist inside the agent session itself.

## Persistent Memory Sources

The repo explicitly relies on three persistence layers:
- git history
- `progress.txt`
- `prd.json`

Additionally, the prompts instruct the agent to update nearby `AGENTS.md` or `CLAUDE.md` files with reusable patterns.

## What the Prompt Tells Each Iteration To Do

The bundled prompts instruct the agent to:
- read `prd.json`
- read `progress.txt`
- ensure the correct branch from `branchName`
- pick the highest-priority unfinished story
- implement one story only
- run quality checks
- commit with `feat: [Story ID] - [Story Title]`
- mark the story passed in `prd.json`
- append learnings to `progress.txt`

The Amp prompt also includes an Amp thread URL in the progress log format.

## Completion Contract

The loop exits only when the tool output contains exactly this completion marker:

```xml
<promise>COMPLETE</promise>
```

If stories remain unfinished, the prompt tells the agent to end normally and allow the next iteration to continue.

## Archive Behavior

When `branchName` changes between runs, `ralph.sh`:
- creates `archive/YYYY-MM-DD-feature-name/`
- copies the previous `prd.json`
- copies `progress.txt`
- resets `progress.txt`
- stores the current branch in `.last-branch`

The archive folder name strips a leading `ralph/` from the previous branch name.

## Important Caveats

- Supported tools are hard-coded to `amp` and `claude`; invalid values exit with an error.
- `set -e` is enabled in the shell script, but the actual tool invocation is wrapped with `|| true`, so failed iterations do not stop the loop.
- Ralph does not know the project’s right check commands unless the prompt or repo context makes them clear.
- The stock loop assumes committing from inside the agent is acceptable.
- Broken tests or flaky checks will poison the loop because later iterations inherit the repo state.
- Large stories degrade sharply because each iteration starts with a clean context.

## Good Use Cases

Use Ralph for:
- bounded feature implementation from an explicit PRD
- repos with stable test/typecheck commands
- teams that value incremental commits and append-only project memory
- autonomous execution where one-story-at-a-time throughput matters more than rich long-lived agent memory

## Bad Use Cases

Avoid Ralph for:
- unclear product discovery
- cross-cutting rewrites with fuzzy boundaries
- repos without reliable checks
- work that depends on long conversational memory instead of durable artifacts
