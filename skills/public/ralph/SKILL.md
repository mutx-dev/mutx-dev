---
name: ralph
description: Run or set up the Ralph autonomous PRD-to-completion loop for a software project. Use when a user wants to: install/configure Ralph, turn a feature PRD into a Ralph execution plan, run repeated one-story-per-iteration coding loops with Amp or Claude Code, tune prompt/check commands, or understand Ralph’s workflow, memory model, and caveats. Triggers include: "use Ralph", "set up Ralph", "run Ralph on this PRD", "autonomous PRD loop", "one story per iteration", "convert PRD to prd.json", or "finish this feature with Ralph".
---

# Ralph

## Overview

Use Ralph to drive an autonomous feature loop from PRD to done in small, verifiable slices. Keep the loop simple: create or refine a PRD, convert it into `prd.json`, run `ralph.sh`, and let each fresh agent instance complete exactly one story, run checks, commit, mark the story passed, and append learnings.

## Use This Workflow

1. Confirm the project is a git repo and has real feedback loops.
   - Ralph assumes git, `jq`, and either Amp or Claude Code.
   - Require runnable quality checks; Ralph compounds damage if broken code is allowed through.
2. Ensure the work is split into small user stories.
   - One story must fit in one agent context window.
   - Prefer schema/backend/UI sequencing rather than large end-to-end stories.
3. Prepare Ralph files in the target repo.
   - Copy `ralph.sh` plus either `prompt.md` (Amp) or `CLAUDE.md` (Claude Code).
   - Create or update `prd.json` and initialize `progress.txt` if needed.
4. Run the loop.
   - Amp: `./scripts/ralph/ralph.sh [max_iterations]`
   - Claude Code: `./scripts/ralph/ralph.sh --tool claude [max_iterations]`
5. Inspect progress after each run.
   - Read `prd.json`, `progress.txt`, and recent git history.
   - If Ralph stalls, shrink stories, tighten acceptance criteria, or improve prompt/check commands.

## Core Operating Rules

- Work on exactly one story per iteration.
- Pick the highest-priority story with `passes: false`.
- Require verifiable acceptance criteria, not vague goals.
- Run project-appropriate checks before committing.
- Mark `passes: true` only after checks pass.
- Append reusable learnings to `progress.txt` and preserve durable conventions in nearby `AGENTS.md`/`CLAUDE.md` files.
- Treat browser verification as mandatory for UI stories.

## Key Files

- `ralph.sh`: outer loop; spawns a fresh tool instance every iteration; supports `--tool amp` and `--tool claude`.
- `prompt.md`: Amp iteration instructions.
- `CLAUDE.md`: Claude Code iteration instructions.
- `prd.json`: ordered story queue plus `branchName` and `passes` state.
- `progress.txt`: append-only execution memory and codebase learnings.
- `AGENTS.md` / `CLAUDE.md`: durable local guidance Ralph is expected to enrich when reusable patterns are discovered.

## Read These References As Needed

- `references/install-and-run.md`: installation, file placement, command examples, prerequisites.
- `references/prd-and-story-shaping.md`: how to shape PRDs and stories so Ralph succeeds.
- `references/loop-behavior-and-caveats.md`: orchestration model, memory model, stop conditions, archiving, and failure modes.

## Practical Guidance

- Prefer Ralph for bounded feature work with a clear spec and reliable checks.
- Avoid Ralph for giant refactors, ambiguous product discovery, or repos without trustworthy tests/typechecks.
- Tighten prompts for the specific repo: replace generic “run quality checks” with exact commands if known.
- If a story keeps failing, do not just raise iteration count; split the story or improve acceptance criteria.
- If a project has UI work, explicitly include browser-verification acceptance criteria in the PRD.
- Preserve branch naming with a `ralph/feature-name` pattern so run archives stay intelligible.

## Output Expectations

When using Ralph for a repo, produce or validate all of the following:
- a small, dependency-ordered PRD or `prd.json`
- a selected tool path (Amp or Claude Code)
- exact run command(s)
- project-specific check commands or prompt edits if needed
- caveats blocking safe autonomous execution
