# Command Format

## Output rules

- Use fenced code blocks for commands.
- Label the shell whenever possible: `bash`, `zsh`, `powershell`, `cmd`, `json`, `yaml`.
- Separate operating systems and shells into separate blocks.
- Do not mix explanation lines into command blocks.
- Put placeholders in angle brackets only when necessary.

## Good pattern

1. State what the command does.
2. Give the exact command.
3. State what success looks like.
4. State the next step.

## Example

Say:
- “Run this to confirm the gateway is up.”

```bash
openclaw health
```

Expected result:
- a healthy status or a specific error message we can use for diagnosis

Next:
- paste the output if it fails

## Placeholder rules

Bad:
```bash
export KEY=abc123
```

Better:
```bash
export OPENAI_API_KEY="<your-openai-api-key>"
```

## Risk rules

If a command could:
- delete data
- rotate credentials
- expose a port
- change a firewall rule
- alter DNS or routes
- loosen sandbox restrictions

then say the risk plainly and ask for confirmation before including or recommending it as the default.

## Version-sensitive rules

When current docs matter:
- browse first
- use the current official command
- link the exact doc page used
- note if a command changed recently

## Rollback expectation

For high-impact steps, include a rollback or “undo” note whenever practical.
