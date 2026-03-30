---
name: github-issue-resolver
description: Autonomous GitHub Issue Resolver Agent with guardrails. Use when the user wants to discover, analyze, and fix open issues in GitHub repositories. Triggers on requests like "fix GitHub issues", "resolve issues in repo", "work on GitHub bugs", or when the user provides a GitHub repository URL and asks for issue resolution. Supports the full workflow from issue discovery to PR submission with safety guardrails preventing scope creep, unauthorized access, and dangerous operations.
---

# GitHub Issue Resolver

Autonomous agent for discovering, analyzing, and fixing open GitHub issues — with a 5-layer guardrail system.

## ⚠️ GUARDRAILS — Read First

**Every action goes through guardrails.** Before any operation:

1. Load `guardrails.json` config
2. Validate scope (repo, branch, path)
3. Check action gate (auto/notify/approve)
4. Validate command against allowlist
5. Log to audit trail

For guardrail details, see [references/guardrails-guide.md](references/guardrails-guide.md).

### Key Rules (Non-Negotiable)
- **Never touch protected branches** (main, master, production)
- **Never modify** .env, secrets, CI configs, credentials
- **Never force push**
- **Never modify dependency files** without explicit approval
- **Never modify own skill/plugin files**
- **One issue at a time** — finish or abandon before starting new
- **All dangerous actions require user approval** (write code, commit, push, PR)
- **Everything is logged** to `audit/` directory

---

## Workflow

### Phase 1 — Issue Discovery

**Trigger:** User provides a GitHub repository (`owner/repo`).

**Steps:**

1. **Validate repo** against guardrails:
   ```bash
   python3 scripts/guardrails.py repo <owner> <repo>
   ```
   If blocked, tell the user and stop.

2. **Fetch, score, and present issues** using the recommendation engine:
   ```bash
   python3 scripts/recommend.py <owner> <repo>
   ```
   This automatically fetches open issues, filters out PRs, scores them by severity/impact/effort/freshness, and presents a formatted recommendation.

   **Always use `recommend.py`** — never manually format issue output. The script ensures consistent presentation every time.

   For raw JSON (e.g., for further processing):
   ```bash
   python3 scripts/recommend.py <owner> <repo> --json
   ```

**⏹️ STOP. Wait for user to select an issue.**

---

### Phase 2 — Fixing

**Trigger:** User selects an issue.

**Steps:**

1. **Lock the issue** (one-at-a-time enforcement):
   ```bash
   python3 scripts/guardrails.py issue_lock <owner> <repo> <issue_number>
   ```

2. **Read full issue thread** including comments.

3. **Clone the repo** (Gate: `notify`):
   ```bash
   python3 scripts/sandbox.py run git clone https://github.com/<owner>/<repo>.git /tmp/openclaw-work/<repo>
   ```

4. **Create a safe branch** (Gate: `auto`):
   ```bash
   python3 scripts/sandbox.py run git checkout -b fix-issue-<number>
   ```

5. **Explore codebase** — read relevant files. For each file:
   ```bash
   python3 scripts/guardrails.py path <file_path>
   ```

6. **Plan the fix** — explain approach to user:
   ```
   ## Proposed Fix
   - Problem: [root cause]
   - Solution: [what changes]
   - Files: [list of files and what changes in each]
   - Estimated diff size: [lines]
   ```

**⏹️ STOP. Wait for user to approve the plan before implementing.**

7. **Implement the fix** (Gate: `approve`):
   - Apply changes
   - Check diff size: `python3 scripts/guardrails.py diff <line_count>`
   - Log: `python3 scripts/audit.py log_action write_code success`

---

### Phase 3 — Testing

**After implementing:**

1. **Find and run tests** (Gate: `notify`):
   ```bash
   python3 scripts/sandbox.py run npm test   # or pytest, cargo test, etc.
   ```

2. **If tests fail AND `autoRollbackOnTestFail` is true:**
   - Revert all changes
   - Notify user
   - Suggest alternative approach

3. **If no tests exist**, write basic tests covering the fix.

4. **Report results** to user.

---

### Phase 4 — Draft PR for Review (Approval REQUIRED)

**⚠️ NEVER create PR automatically. Always ask first.**

**Do NOT dump full diffs in chat.** For any non-trivial project, push the branch
and let the user review on GitHub where they get syntax highlighting, file-by-file
navigation, and inline comments.

1. **Commit changes** (Gate: `approve`):
   ```bash
   python3 scripts/sandbox.py run git add .
   python3 scripts/sandbox.py run git commit -m "Fix #<number>: <title>"
   ```

2. **Show a change summary** (NOT the raw diff) — keep it concise:
   ```
   ## Changes
   - **src/models.py** — Added field validation (title length, enum checks)
   - **app.py** — Added validation to POST endpoint, 400 error responses
   - **tests/test_app.py** — 22 new tests covering validation rules
   - 4 files changed, ~100 lines of source + ~150 lines of tests
   - All tests passing ✅
   ```

3. **Ask explicitly:** "Ready to push and create a draft PR?"

4. **Only after user says "yes"** (Gate: `approve`):
   ```bash
   python3 scripts/sandbox.py run git push -u origin fix-issue-<number>
   python3 scripts/sandbox.py run gh pr create --draft --title "..." --body "..."
   ```
   Note: PRs are always created as **draft** by default.
   The PR body should include a detailed description of all changes, test results,
   and link to the issue (Closes #N).

5. **Share the PR link** — user reviews on GitHub.

6. **Unlock the issue:**
   ```bash
   python3 scripts/guardrails.py issue_unlock
   ```

---

## Scripts Reference

| Script | Purpose | Run Without Reading |
|--------|---------|---------------------|
| `scripts/recommend.py` | **Primary entry point** — fetch, score, and present issues | ✅ |
| `scripts/fetch_issues.py` | Raw issue fetcher (used internally by recommend.py) | ✅ |
| `scripts/analyze_issue.py` | Deep analysis of single issue | ✅ |
| `scripts/create_pr.py` | PR creation wrapper | ✅ |
| `scripts/guardrails.py` | Guardrail enforcement engine | ✅ |
| `scripts/sandbox.py` | Safe command execution wrapper | ✅ |
| `scripts/audit.py` | Action logger | ✅ |

## References

- [references/quick-reference.md](references/quick-reference.md) — GitHub API reference, scoring rubric, test commands
- [references/guardrails-guide.md](references/guardrails-guide.md) — Full guardrails documentation and customization
