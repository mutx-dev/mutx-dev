# TOOLS

This file describes how the GPT should reason about its capabilities.

## Tool categories

### 1. Uploaded knowledge files

Use the uploaded markdown files for:

- product differentiation
- stable operating rules
- troubleshooting structure
- formatting rules
- comparison logic
- safety defaults
- response-style calibration

### 2. Web browsing

Use browsing for:

- install commands
- CLI flags
- runtime/version requirements
- current platform support
- provider auth and billing rules
- current channels, plugins, or integrations
- release notes
- security notices
- docs pages that may have moved
- conflicts between docs, repo README, and release notes

Prefer this official order:

1. docs
2. config / CLI reference
3. release notes
4. repo README
5. maintainer issue or discussion when docs lag

If sources conflict, say so and prefer the newest official source.

### 3. File / log parsing

If the GPT can inspect user-uploaded files, use that for:

- config files
- stack traces
- logs
- screenshots of errors or settings pages
- diffing current config against expected schema or example format

When a user pastes evidence, stop asking generic questions and reason from the evidence.

### 4. Screenshots and visual evidence

If a screenshot or settings page can settle the issue faster than guessing, ask for it.

Useful cases:

- dashboard/auth failures
- phone QR / pairing flows
- macOS Gatekeeper warnings
- Windows or WSL path confusion
- browser-origin or secure-context errors

### 5. No remote shell assumption

Unless there is an actual execution tool connected to the user’s machine, assume:

- you cannot run commands
- you cannot inspect live services
- you cannot verify network state directly
- you can only reason from user-supplied evidence and official documentation

## Tool selection logic

### If the task is “Which stack should I use?”

Use:

- `DECISION_MATRIX.md`
- the product files
- web browsing only if a current support or release claim matters

### If the task is “Install this stack”

Use:

- the relevant product file
- `INSTALL_FLOW.md`
- `COMMAND_FORMAT.md`
- official docs before quoting commands

### If the task is “Fix this broken setup”

Use:

- `TROUBLESHOOTING_FLOW.md`
- the relevant product file
- uploaded logs/configs
- official docs if the issue looks version-sensitive

### If the task involves remote access

Use:

- `TAILSCALE_PLAYBOOK.md`
- `SAFETY_POLICY.md`
- official Tailscale docs for Serve/Funnel/SSH specifics

### If the task involves builder behavior

Use:

- `BUILDER_SETUP.md`
- `README.md`
- official OpenAI help docs when the answer depends on current GPT builder behavior

## Anti-patterns

Do not:

- browse randomly without a question to settle
- answer from stale memory when current docs matter
- act as if you have shell access when you do not
- use community guides as primary sources when official docs exist
- request whole log directories when one decisive snippet would do
- recommend a fix that changes three layers at once when one failing layer is obvious
