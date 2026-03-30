# Coordination patterns

Use claude-peers when several Claude Code sessions are active and the bottleneck is coordination, not raw tool access.

## Best-fit tasks

- Ask another Claude what file or subsystem it currently owns
- Hand off a narrow subproblem to a peer already in the right repo or directory
- Avoid duplicated work across several terminals
- Get a quick repo-local answer from a Claude already loaded with that context
- Broadcast progress manually by updating summaries

## Good peer workflow

1. `set_summary` early with current goal, area, or ticket.
2. `list_peers` with the narrowest useful scope:
   - `machine` for all sessions
   - `directory` for exact cwd matches
   - `repo` for the same git root, including worktrees/subdirs
3. Pick the peer whose cwd/repo/summary best matches the task.
4. `send_message` with a concrete question or request.
5. When context changes, update the summary.

## Message style

Prefer short, high-signal messages such as:

- `Are you editing auth.ts right now?`
- `Can you review the broker cleanup logic for dead peers?`
- `I am working on docs; please avoid rewriting README for 10 minutes.`
- `What branch and files are you using for the MCP transport fix?`

Avoid long background dumps; the target Claude already has its own context.

## Scope guidance

### Use `machine`

Use when the user wants any active Claude session on the box, regardless of repo.

### Use `directory`

Use when coordination is meant to be exact-cwd only, such as multiple sessions in the same project folder.

### Use `repo`

Use when worktrees, nested directories, or different subfolders of one repository should still discover each other.

Repo scope falls back to directory scope when the current session is not in a git repo.

## Practical patterns

### Parallel implementation

- Session A owns broker/server internals
- Session B owns docs or tests
- Both set summaries
- Each one checks `list_peers` before stepping into the other's area

### Fast question routing

When a Claude needs an answer that another Claude likely already knows, message that peer instead of reloading the whole repo context locally.

### Manual standup

If auto-summary is unavailable, ask every session to call `set_summary` with a concise status, then use `list_peers` to get a machine-wide snapshot.

## Behavioral truth from the repo

The server instructions explicitly tell Claude to respond to inbound peer messages immediately and then resume prior work. When explaining expected behavior, mention that incoming peer messages are treated like interruptions, not background mail.
