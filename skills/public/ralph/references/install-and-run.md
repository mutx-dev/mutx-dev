# Ralph Install and Run

## What Ralph Actually Needs

- A git repo for the target project
- `jq`
- One supported coding tool:
  - Amp CLI
  - Claude Code CLI
- A project with meaningful feedback loops such as typecheck, lint, tests, or browser verification

Ralph does not orchestrate arbitrary tools out of the box. The shipped loop supports only `amp` and `claude` via `--tool`.

## File Placement Patterns

The README shows copying Ralph into `scripts/ralph/` inside the target repo:

```bash
mkdir -p scripts/ralph
cp /path/to/ralph/ralph.sh scripts/ralph/
cp /path/to/ralph/prompt.md scripts/ralph/prompt.md
# or
cp /path/to/ralph/CLAUDE.md scripts/ralph/CLAUDE.md
chmod +x scripts/ralph/ralph.sh
```

Ralph expects these working files beside the prompt/script bundle:
- `prd.json`
- `progress.txt`
- optional `archive/`
- internal `.last-branch`

Because `ralph.sh` sets `SCRIPT_DIR` from its own location, keep `ralph.sh`, prompt file, `prd.json`, and `progress.txt` in the same working directory unless you intentionally rewrite the script.

## Run Commands

```bash
# default tool: amp
./scripts/ralph/ralph.sh
./scripts/ralph/ralph.sh 20

# explicit tool selection
./scripts/ralph/ralph.sh --tool amp 20
./scripts/ralph/ralph.sh --tool claude 20
```

Default `MAX_ITERATIONS` is 10.

## Amp-Specific Note

The README recommends enabling auto-handoff:

```json
{
  "amp.experimental.autoHandoff": { "context": 90 }
}
```

Use this when larger stories may approach one context window. It does not remove the need to keep stories small.

## Claude Code Marketplace Path

The repo also ships a Claude marketplace plugin with two skills:
- `prd`
- `ralph`

Install path shown in the repo:

```text
/plugin marketplace add snarktank/ralph
/plugin install ralph-skills@ralph-marketplace
```

Use this only when the target environment is Claude Code and the user wants the packaged marketplace workflow instead of copying files manually.

## Minimum Safe Customization

Before running Ralph in a real project, edit the copied prompt file to include:
- exact quality-check commands
- repo-specific conventions
- known gotchas
- browser-verification instructions if the repo has UI work

The stock prompts say “run quality checks” but rely on the agent to infer the actual commands.
