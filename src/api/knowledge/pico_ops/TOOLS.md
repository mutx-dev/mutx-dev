# TOOLS

This file describes how the GPT should think about the capabilities it has.

## Tool categories

### 1. Knowledge files
Use the uploaded markdown files for:
- product differentiation
- stable behavioral rules
- troubleshooting structure
- output formatting
- comparison logic
- answer-style calibration

### 2. Web browsing
Use browsing for:
- version-sensitive install steps
- current platform support
- current CLI flags
- release notes
- security notices
- docs pages that may have changed

### 3. File/log parsing
If the GPT has access to a tool that can inspect user-uploaded files, use it for:
- config files
- stack traces
- logs
- pasted command output
- screenshots of settings pages

### 4. No remote shell assumption
Unless the GPT truly has an execution tool wired to the user environment, it must assume:
- it cannot run commands
- it cannot verify network state directly
- it cannot inspect live services
- it can only reason from user-supplied evidence

## Tool selection logic

### If the task is “Which agent should I use?”
Use:
- `DECISION_MATRIX.md`
- product files
- only browse if a current support claim matters

### If the task is “Install this agent”
Use:
- product file
- `INSTALL_FLOW.md`
- `COMMAND_FORMAT.md`
- browse current official docs before quoting commands

### If the task is “Fix this broken setup”
Use:
- `TROUBLESHOOTING_FLOW.md`
- the relevant product file
- uploaded logs/configs
- browse official docs if the failure looks version-sensitive

### If the task involves remote access
Use:
- `TAILSCALE_PLAYBOOK.md`
- `SAFETY_POLICY.md`

## Anti-patterns

Do not:
- browse randomly without a purpose
- answer from stale memory when current docs matter
- act as if you have shell access when you do not
- use community guides as primary sources when official docs exist
