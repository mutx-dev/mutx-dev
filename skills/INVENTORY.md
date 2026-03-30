# MUTX Skills Inventory

Installed via clawhub unless noted otherwise. Last updated: 2026-03-24.

---

## Bundled (Pre-installed with OpenClaw)

### `coding-agent`
**What it does:** Delegates coding tasks to Codex, Claude Code, or Pi agents via background process.

**Key trigger phrases:**
- "build this feature"
- "refactor the codebase"
- "review this PR"
- "implement this"
- "create a new app"
- "work on this issue"

**Configuration:** Requires `claude`, `codex`, `opencode`, or `pi` binary in PATH. Claude Code: use `--print --permission-mode bypassPermissions`. Codex/Pi/OpenCode: PTY required.

**Location:** `/opt/homebrew/lib/node_modules/openclaw/skills/coding-agent/` (bundled)

---

## Installed via Clawhub

### `session-logs`
**What it does:** Searches and analyzes your own session logs (older/parent conversations) using jq. Reads JSONL session files stored at `~/.clawdbot/agents/<agentId>/sessions/`.

**Key trigger phrases:**
- "what did we discuss before"
- "search my conversation history"
- "find earlier sessions"
- "what was said in the previous chat"
- "look up old conversations"

**Configuration:** Requires `jq` and `rg` (ripgrep) binaries. No API keys needed.

**Skills installed at:** `/Users/fortune/.openclaw/workspace/skills/session-logs/`

---

### `xurl`
**What it does:** Twitter content intelligence — analyzes profiles, threads, and conversations to extract insights for content creation, positioning, and lead generation. Note: processes provided content, doesn't directly access Twitter API.

**Key trigger phrases:**
- "analyze this Twitter profile"
- "break down this thread"
- "find pain points on Twitter"
- "extract content opportunities"
- "lead intelligence from Twitter"

**Configuration:** No API key required — processes text/URLs you provide. Check reference docs in `references/` for detailed guides.

**Skills installed at:** `/Users/fortune/.openclaw/workspace/skills/xurl/`

---

### `github-ops`
**What it does:** Full GitHub operations automation — creates repos, pushes code, creates releases, updates files via GitHub API. Fully autonomous, no user intervention needed once configured.

**Key trigger phrases:**
- "create a new repository"
- "push code to GitHub"
- "create a release"
- "update the README"
- "deploy to GitHub"

**Configuration:** Requires `GITHUB_TOKEN` env var. Also needs `git` and `curl` binaries. Token should be stored securely (e.g., `~/.openclaw/secrets/github_token.txt`).

**Skills installed at:** `/Users/fortune/.openclaw/workspace/skills/github-ops/`

---

### `github-issue-resolver`
**What it does:** Autonomous GitHub issue resolver — discovers, analyzes, and fixes open GitHub issues with a 5-layer guardrail system. One issue at a time, requires approval before dangerous actions.

**Key trigger phrases:**
- "fix GitHub issues"
- "resolve issues in repo"
- "work on GitHub bugs"
- "fix issue #X"
- "analyze this repository's issues"

**Configuration:** Requires `GITHUB_TOKEN` env var. Python 3 required for guardrail scripts. See `scripts/` for `guardrails.py`, `recommend.py`, `sandbox.py`, `audit.py`.

**Guardrails:**
- Never touches protected branches (main, master, production)
- Never modifies .env, secrets, CI configs
- Never force pushes
- One issue at a time, all actions logged

**Skills installed at:** `/Users/fortune/.openclaw/workspace/skills/github-issue-resolver/`

---

### `codex-sub-agents`
**What it does:** Spawns OpenAI Codex sub-agents for parallel coding tasks. Enables orchestrating multiple Codex workers on different issues/PRs simultaneously.

**Key trigger phrases:**
- "spawn Codex workers"
- "run multiple coding agents"
- "delegate to Codex sub-agents"
- "run codex in background"

**Configuration:** Requires Codex CLI (`npm i -g @openai/codex`) and authentication (`codex login`). Uses OpenAI API/ChatGPT Pro subscription.

**Note:** This skill was already on clawhub and is now installed alongside the bundled `coding-agent`.

**Skills installed at:** `/Users/fortune/.openclaw/workspace/skills/codex-sub-agents/`

---

## Search Results — Not Installed

### `gh-issues` skill — NOT FOUND on clawhub
The task mentioned `gh-issues` but no matching skill exists on clawhub. The closest alternatives installed:
- **`github-issue-resolver`** — autonomous issue fixing with guardrails
- **`github-ops`** — general GitHub operations

For GitHub issues management, use `github-issue-resolver` (for fixing) or `github-ops` + direct `gh` CLI commands.

---

## MUTX-Specific Skills — NOT FOUND on clawhub
Searched clawhub for "mutx" and "agent fleet" — no MUTX-specific skills available.

---

## Summary

| Skill | Purpose | Installed |
|-------|---------|-----------|
| `coding-agent` | Delegate to Codex/Claude Code/Pi (bundled) | ✅ Bundled |
| `codex-sub-agents` | Spawn Codex sub-agents in parallel | ✅ clawhub |
| `github-issue-resolver` | Auto-fix GitHub issues with guardrails | ✅ clawhub |
| `github-ops` | GitHub repos/releases/deploys | ✅ clawhub |
| `xurl` | Twitter content intelligence | ✅ clawhub |
| `session-logs` | Search conversation history | ✅ clawhub |
| `gh-issues` | (not on clawhub, use github-issue-resolver) | ❌ |
