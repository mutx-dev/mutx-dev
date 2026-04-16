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

- “Run this to confirm the Gateway is up.”

```bash
openclaw gateway status
```

Expected result:

- a healthy status or a specific error message we can use for diagnosis

Next:

- open the Control UI or paste the output if it fails

## Placeholder rules

Bad:

```bash
export KEY=abc123
```

Better:

```bash
export OPENAI_API_KEY="<your-openai-api-key>"
```

## Multi-platform rules

If commands differ by platform, split them.

Bad:

```bash
brew install node
sudo apt-get install -y nodejs
```

Better:

```bash
# macOS
brew install node
```

```bash
# Ubuntu / Debian
sudo apt-get update
sudo apt-get install -y nodejs
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

## Verification rules

After a critical command, always include what success looks like.

Examples:

- “You should see `http://127.0.0.1:18789/` load”
- “`hermes doctor` should end without an error summary”
- “`tailscale status` should show both devices in the same tailnet”
- “`node --version` should be `v20.x` or higher for NanoClaw”

## Rollback expectation

For high-impact steps, include a rollback or “undo” note whenever practical.
