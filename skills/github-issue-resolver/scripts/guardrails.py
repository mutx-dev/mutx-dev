#!/usr/bin/env python3
"""
Guardrails Enforcement Engine for GitHub Issue Resolver.
Validates every action against guardrails.json before execution.
"""

import json
import os
import sys
import fnmatch
import re
from pathlib import Path
from datetime import datetime

GUARDRAILS_PATH = os.path.join(os.path.dirname(__file__), "..", "guardrails.json")

class GuardrailError(Exception):
    """Raised when an action violates guardrails."""
    pass

class Guardrails:
    def __init__(self, config_path=None):
        path = config_path or GUARDRAILS_PATH
        with open(path, "r") as f:
            self.config = json.load(f)
        self.scope = self.config.get("scope", {})
        self.gates = self.config.get("gates", {})
        self.commands = self.config.get("commands", {})
        self.behavior = self.config.get("behavior", {})
        self._current_issue = None
        self._state_file = os.path.join(os.path.dirname(path), ".guardrails-state.json")
        self._load_state()

    def _load_state(self):
        """Load persistent state (current issue lock, etc.)."""
        if os.path.exists(self._state_file):
            with open(self._state_file, "r") as f:
                self._state = json.load(f)
        else:
            self._state = {"current_issue": None, "locked_at": None, "repo": None}

    def _save_state(self):
        """Save persistent state."""
        with open(self._state_file, "w") as f:
            json.dump(self._state, f, indent=2)

    # ── Repo Scope ──

    def check_repo(self, owner: str, repo: str) -> dict:
        """Check if repo is allowed."""
        repos_config = self.scope.get("repos", {})
        mode = repos_config.get("mode", "allowlist")
        full_name = f"{owner}/{repo}"

        # ── INPUT VALIDATION ──
        # Block dangerous characters in owner/repo names
        valid_pattern = re.compile(r'^[a-zA-Z0-9._-]*$')
        if not valid_pattern.match(owner):
            return {"allowed": False, "reason": f"Invalid owner name '{owner}': contains illegal characters"}
        if not valid_pattern.match(repo):
            return {"allowed": False, "reason": f"Invalid repo name '{repo}': contains illegal characters"}
        # Length limits
        if len(owner) > 100 or len(repo) > 100:
            return {"allowed": False, "reason": f"Owner/repo name too long (max 100 chars each)"}

        if mode == "allowlist":
            allowed = repos_config.get("allowed", [])
            if len(allowed) == 0:
                # Empty allowlist = all repos allowed (first-run friendly)
                return {"allowed": True, "reason": "No repo restrictions configured (empty allowlist)"}
            if full_name in allowed or f"{owner}/*" in allowed:
                return {"allowed": True, "reason": f"Repo {full_name} is in allowlist"}
            return {"allowed": False, "reason": f"Repo {full_name} is NOT in allowlist. Allowed: {allowed}"}
        
        elif mode == "denylist":
            denied = repos_config.get("denied", [])
            if full_name in denied:
                return {"allowed": False, "reason": f"Repo {full_name} is in denylist"}
            return {"allowed": True, "reason": f"Repo {full_name} is not denied"}

        return {"allowed": True, "reason": "No repo restrictions"}

    # ── Branch Safety ──

    def check_branch(self, branch_name: str) -> dict:
        """Check if branch is safe to use."""
        branches = self.scope.get("branches", {})
        protected = branches.get("protected", [])

        # ── BRANCH NAME SANITIZATION ──
        # Block shell metacharacters in branch names
        dangerous_branch_chars = [";", "|", "&", "`", "$", "(", ")", "{", "}", "<", ">", "!", "'", '"', " "]
        for dc in dangerous_branch_chars:
            if dc in branch_name:
                return {"allowed": False, "reason": f"Branch '{branch_name}' contains dangerous character '{dc}'"}

        # Block refs/ prefix (direct ref manipulation)
        if branch_name.startswith("refs/"):
            return {"allowed": False, "reason": f"Branch '{branch_name}' uses raw ref path (not allowed)"}

        for pattern in protected:
            if fnmatch.fnmatch(branch_name, pattern):
                return {
                    "allowed": False,
                    "reason": f"Branch '{branch_name}' is protected (matches '{pattern}')"
                }

        return {"allowed": True, "reason": f"Branch '{branch_name}' is safe to use"}

    def suggest_branch(self, issue_number: int) -> str:
        """Suggest a safe branch name."""
        prefix = self.scope.get("branches", {}).get("workPrefix", "fix-issue-")
        return f"{prefix}{issue_number}"

    # ── Path Safety ──

    def check_path(self, file_path: str) -> dict:
        """Check if file path is safe to read/modify."""
        import unicodedata

        paths_config = self.scope.get("paths", {})
        denied = paths_config.get("denied", [])
        deny_patterns = paths_config.get("denyPatterns", [])

        normalized = file_path.replace("\\", "/")

        # ── LENGTH LIMIT ──
        if len(normalized) > 500:
            return {"allowed": False, "reason": f"Path too long ({len(normalized)} chars, max 500)"}

        # ── GLOB / WILDCARD CHARACTERS IN PATH ──
        # Block glob metacharacters — paths should be exact, not patterns
        for gc in ["*", "?", "[", "]"]:
            if gc in normalized:
                return {"allowed": False, "reason": f"Path contains glob character '{gc}' (must be exact path)"}

        # ── UNICODE NORMALIZATION ──
        # Normalize unicode to catch homoglyph attacks (full-width dots, etc.)
        normalized_nfkc = unicodedata.normalize("NFKC", normalized)

        # Block unicode control characters (RTL override, zero-width, etc.)
        for ch in normalized:
            cat = unicodedata.category(ch)
            if cat.startswith("C") and ch not in ("\t",):  # Control chars except tab
                return {"allowed": False, "reason": f"Path contains dangerous unicode control character (category {cat})"}

        # ── PATH TRAVERSAL PREVENTION ──
        # Block any path containing .. (directory traversal) — check both raw and normalized
        if ".." in normalized or ".." in normalized_nfkc:
            return {"allowed": False, "reason": f"Path '{file_path}' contains directory traversal (..)"}

        # Block absolute paths (must stay within repo)
        if normalized.startswith("/") or normalized_nfkc.startswith("/"):
            return {"allowed": False, "reason": f"Path '{file_path}' is absolute (must be relative to repo root)"}

        # Block tilde expansion (~/something)
        if normalized.startswith("~") or normalized_nfkc.startswith("~"):
            return {"allowed": False, "reason": f"Path '{file_path}' contains tilde expansion (not allowed)"}

        # Block URL-encoded traversal attempts (single and double encoded)
        lower_norm = normalized.lower()
        if "%2e" in lower_norm or "%2f" in lower_norm or "%25" in lower_norm:
            return {"allowed": False, "reason": f"Path '{file_path}' contains URL-encoded characters (possible traversal)"}

        # Block null bytes
        if "\x00" in normalized:
            return {"allowed": False, "reason": "Path contains null byte (injection attempt)"}

        # ── STRIP WHITESPACE for matching (catch ".env " with trailing space) ──
        stripped = normalized.strip()
        stripped_nfkc = normalized_nfkc.strip()

        # Use CASE-INSENSITIVE matching for all path checks (catches .ENV, .Env, etc.)
        lower_stripped = stripped.lower()
        lower_nfkc = stripped_nfkc.lower()

        # Check exact denies (case-insensitive)
        for d in denied:
            d_lower = d.lower()
            if d.endswith("/"):
                if lower_stripped.startswith(d_lower) or f"/{d_lower}" in lower_stripped:
                    return {"allowed": False, "reason": f"Path '{file_path}' is in denied directory '{d}'"}
                if lower_nfkc.startswith(d_lower) or f"/{d_lower}" in lower_nfkc:
                    return {"allowed": False, "reason": f"Path '{file_path}' (normalized) is in denied directory '{d}'"}
            else:
                basename_lower = os.path.basename(lower_stripped)
                basename_nfkc = os.path.basename(lower_nfkc)
                if fnmatch.fnmatch(basename_lower, d_lower):
                    return {"allowed": False, "reason": f"Path '{file_path}' matches denied pattern '{d}'"}
                if fnmatch.fnmatch(basename_nfkc, d_lower):
                    return {"allowed": False, "reason": f"Path '{file_path}' (normalized) matches denied pattern '{d}'"}

        # Check glob patterns (case-insensitive)
        for pattern in deny_patterns:
            p_lower = pattern.lower()
            if fnmatch.fnmatch(lower_stripped, p_lower):
                return {"allowed": False, "reason": f"Path '{file_path}' matches deny pattern '{pattern}'"}
            if fnmatch.fnmatch(lower_nfkc, p_lower):
                return {"allowed": False, "reason": f"Path '{file_path}' (normalized) matches deny pattern '{pattern}'"}

        # ── HIDDEN FILE VARIANTS ──
        # Block files that look like hidden variants of denied names (._env, .env~, etc.)
        basename = os.path.basename(stripped)
        basename_nfkc = os.path.basename(stripped_nfkc)
        # Strip leading ._ and trailing ~ for matching
        clean_base = basename.lower().lstrip("._").rstrip("~").rstrip(" ")
        clean_nfkc = basename_nfkc.lower().lstrip("._").rstrip("~").rstrip(" ")
        for d in denied:
            if d.endswith("/"):
                continue
            d_clean = d.lower().lstrip("._").rstrip("~")
            if d_clean and (fnmatch.fnmatch(clean_base, d_clean) or fnmatch.fnmatch(clean_nfkc, d_clean)):
                return {"allowed": False, "reason": f"Path '{file_path}' looks like a variant of denied pattern '{d}'"}

        # Check dependency file modification (case-insensitive)
        files_config = self.scope.get("files", {})
        deny_modify = files_config.get("denyModify", [])
        for dm in deny_modify:
            if basename.lower() == dm.lower() or basename_nfkc.lower() == dm.lower():
                return {
                    "allowed": False,
                    "reason": f"File '{basename}' is a dependency file. Modification requires explicit approval.",
                    "requires_approval": True
                }

        return {"allowed": True, "reason": f"Path '{file_path}' is safe"}

    # ── Command Safety ──

    def check_command(self, command: str) -> dict:
        """Check if a shell command is allowed."""
        cmd_stripped = command.strip()
        blocked = self.commands.get("blocked", [])
        allowed = self.commands.get("allowed", [])
        block_patterns = self.commands.get("blockPatterns", [])

        # Empty/whitespace = blocked
        if not cmd_stripped:
            return {"allowed": False, "reason": "Empty command"}

        # ── LENGTH LIMITS ──
        if len(cmd_stripped) > 2000:
            return {"allowed": False, "reason": f"Command too long ({len(cmd_stripped)} chars, max 2000)"}

        # ── SHELL INJECTION DETECTION ──
        # Block any command containing shell metacharacters that could chain commands
        dangerous_chars = ["|", ";", "&&", "||", "`", "$(", ">>", ">&", "<(", ">(", "<<<"]
        for dc in dangerous_chars:
            if dc in cmd_stripped:
                return {"allowed": False, "reason": f"Command blocked: contains shell metacharacter '{dc}'"}

        # Block environment variable expansion ($VAR, ${VAR}) — can leak secrets
        if re.search(r'\$[A-Za-z_{]', cmd_stripped):
            return {"allowed": False, "reason": "Command blocked: contains environment variable expansion ($VAR)"}

        # Block output redirection to files
        if re.search(r'(?<!["\'])>\s*[/\w~.]', cmd_stripped):
            return {"allowed": False, "reason": "Command blocked: contains output redirect"}

        # Block commands with newlines (injection via multiline)
        if "\n" in cmd_stripped or "\r" in cmd_stripped:
            return {"allowed": False, "reason": "Command blocked: contains newline (injection attempt)"}

        # Block glob/wildcard expansion in arguments (not in quoted strings)
        # This prevents `cat *`, `rm *.py`, etc.
        if re.search(r'(?<!["\'])\*(?!["\'])', cmd_stripped):
            return {"allowed": False, "reason": "Command blocked: contains wildcard/glob expansion (*)"}

        # ── BLOCKED COMMANDS (deny wins over allow) ──
        # Match blocked entries as: starts-with OR as a whole word/boundary in command
        cmd_lower = cmd_stripped.lower()
        for b in blocked:
            b_lower = b.lower()
            # Check if command starts with blocked entry
            if cmd_lower.startswith(b_lower):
                return {"allowed": False, "reason": f"Command blocked: starts with '{b}'"}
            # Check as whole word boundary (not substring of another word)
            pattern = r'(?:^|[\s;|&])' + re.escape(b_lower) + r'(?:$|[\s;|&=\'"])'
            if re.search(pattern, cmd_lower):
                return {"allowed": False, "reason": f"Command blocked: contains '{b}'"}

        # Check block patterns
        for pattern in block_patterns:
            if re.match(pattern, cmd_stripped):
                return {"allowed": False, "reason": f"Command blocked: matches pattern '{pattern}'"}

        # Force push check (behavior override)
        if self.behavior.get("noForceEver", True):
            if "--force" in cmd_stripped or " -f " in cmd_stripped or cmd_stripped.endswith(" -f"):
                if "push" in cmd_stripped:
                    return {"allowed": False, "reason": "Force push is permanently blocked"}

        # ── REMOTE URL HIJACKING ──
        if cmd_stripped.startswith("git push"):
            parts = cmd_stripped.split()
            if len(parts) >= 3:
                remote = parts[2]
                if remote.startswith("http") or remote.startswith("git@") or remote.startswith("ssh://"):
                    return {"allowed": False, "reason": f"Command blocked: cannot push to arbitrary remote URL '{remote}'"}

        # ── ALLOWLIST CHECK ──
        matched_allow = None
        cmd_lower = cmd_stripped.lower()
        for a in allowed:
            # Empty string in allowlist is a misconfiguration — skip it
            if not a:
                continue
            # Case-insensitive allowlist matching
            if cmd_lower.startswith(a.lower()):
                matched_allow = a
                break

        if not matched_allow:
            return {
                "allowed": False,
                "reason": f"Command '{cmd_stripped[:50]}...' not in allowlist. Request approval.",
                "requires_approval": True
            }

        # ── ARGUMENT SAFETY CHECK ──
        # Even for allowed commands, check that arguments don't reference
        # sensitive paths outside the working directory.
        # But skip content inside quotes (commit messages, etc.)
        raw_args = cmd_stripped[len(matched_allow):].strip()

        # Remove quoted strings before argument checking (commit messages are safe)
        import shlex
        try:
            args = shlex.split(raw_args)
        except ValueError:
            # Malformed quoting — treat all tokens as args
            args = raw_args.split()

        for arg in args:
            # Skip flags (arguments starting with -)
            if arg.startswith("-"):
                continue
            # Skip common non-path arguments
            if arg in (".", "./", "--", ""):
                continue

            # Check for absolute paths in arguments
            if arg.startswith("/"):
                return {"allowed": False, "reason": f"Command blocked: absolute path '{arg}' in arguments (must stay in repo)"}

            # Check for home directory references
            if arg.startswith("~"):
                return {"allowed": False, "reason": f"Command blocked: home directory reference '{arg}' in arguments"}

            # Check for path traversal in arguments
            if ".." in arg:
                return {"allowed": False, "reason": f"Command blocked: path traversal '{arg}' in arguments"}

            # Check arguments that look like paths against path guardrails
            if "/" in arg or arg.startswith("."):
                path_check = self.check_path(arg)
                if not path_check["allowed"]:
                    return {"allowed": False, "reason": f"Command blocked: argument '{arg}' fails path check — {path_check['reason']}"}

        return {"allowed": True, "reason": f"Command allowed: matches '{matched_allow}'"}

    # ── Action Gates ──

    def get_gate(self, action: str) -> dict:
        """Get the gate level for an action."""
        gate = self.gates.get(action, {"level": "approve", "message": "Unknown action. Requires approval."})
        return gate

    def check_action(self, action: str) -> dict:
        """Check if action can proceed and what gate applies."""
        gate = self.get_gate(action)
        level = gate.get("level", "approve")

        return {
            "action": action,
            "level": level,
            "message": gate.get("message"),
            "auto_proceed": level == "auto",
            "needs_notify": level == "notify",
            "needs_approval": level == "approve"
        }

    # ── Issue Lock ──

    def lock_issue(self, owner: str, repo: str, issue_number: int) -> dict:
        """Lock onto a single issue (one-at-a-time)."""
        if not self.behavior.get("oneIssueAtATime", True):
            return {"locked": True, "reason": "Multi-issue mode enabled"}

        current = self._state.get("current_issue")
        if current and current != issue_number:
            return {
                "locked": False,
                "reason": f"Already working on issue #{current} in {self._state.get('repo')}. "
                          f"Abandon it first before starting #{issue_number}."
            }

        self._state["current_issue"] = issue_number
        self._state["repo"] = f"{owner}/{repo}"
        self._state["locked_at"] = datetime.utcnow().isoformat()
        self._save_state()
        return {"locked": True, "reason": f"Locked onto issue #{issue_number}"}

    def unlock_issue(self) -> dict:
        """Release issue lock."""
        prev = self._state.get("current_issue")
        self._state["current_issue"] = None
        self._state["repo"] = None
        self._state["locked_at"] = None
        self._save_state()
        return {"unlocked": True, "previous_issue": prev}

    def get_current_issue(self) -> dict:
        """Get current locked issue."""
        return {
            "issue": self._state.get("current_issue"),
            "repo": self._state.get("repo"),
            "locked_at": self._state.get("locked_at")
        }

    # ── Diff Size Check ──

    def check_diff_size(self, diff_lines) -> dict:
        """Check if diff size is within limits."""
        import math
        max_lines = self.behavior.get("maxDiffLines", 200)

        # Handle NaN, infinity, and non-numeric types
        try:
            if math.isnan(diff_lines) or math.isinf(diff_lines):
                return {"allowed": False, "reason": f"Invalid diff size: {diff_lines}", "diff_lines": diff_lines, "limit": max_lines}
        except (TypeError, ValueError):
            return {"allowed": False, "reason": f"Invalid diff size type: {type(diff_lines).__name__}", "diff_lines": diff_lines, "limit": max_lines}

        if diff_lines > max_lines:
            return {
                "allowed": False,
                "reason": f"Diff is {diff_lines} lines (limit: {max_lines}). Requires approval to proceed.",
                "requires_approval": True,
                "diff_lines": diff_lines,
                "limit": max_lines
            }
        return {"allowed": True, "diff_lines": diff_lines, "limit": max_lines}

    # ── Self-Modification Check ──

    def check_self_modify(self, file_path: str) -> dict:
        """Prevent agent from modifying its own files."""
        if not self.behavior.get("noSelfModify", True):
            return {"allowed": True}

        # Case-insensitive check
        lower_path = file_path.lower()

        self_paths = [
            "github-issue-resolver/",
            "guardrails.json",
            "guardrails.py",
            "audit.py",
            "sandbox.py",
            "recommend.py",
            "skill.md",
            "pentest.py",
            "test_all.py",
        ]

        for sp in self_paths:
            if sp.lower() in lower_path:
                return {
                    "allowed": False,
                    "reason": f"Self-modification blocked: cannot edit '{file_path}'"
                }

        return {"allowed": True}

    # ── Full Validation ──

    def validate_full(self, action: str, **kwargs) -> dict:
        """Run all applicable guardrail checks for an action."""
        results = {"action": action, "checks": [], "allowed": True}

        # Gate check
        gate = self.check_action(action)
        results["gate"] = gate
        results["checks"].append({"check": "gate", "result": gate})

        # Repo check
        if "owner" in kwargs and "repo" in kwargs:
            repo_check = self.check_repo(kwargs["owner"], kwargs["repo"])
            results["checks"].append({"check": "repo", "result": repo_check})
            if not repo_check["allowed"]:
                results["allowed"] = False
                results["blocked_by"] = "repo"
                return results

        # Branch check
        if "branch" in kwargs:
            branch_check = self.check_branch(kwargs["branch"])
            results["checks"].append({"check": "branch", "result": branch_check})
            if not branch_check["allowed"]:
                results["allowed"] = False
                results["blocked_by"] = "branch"
                return results

        # Path check
        if "path" in kwargs:
            path_check = self.check_path(kwargs["path"])
            results["checks"].append({"check": "path", "result": path_check})
            if not path_check["allowed"]:
                results["allowed"] = False
                results["blocked_by"] = "path"
                return results

            # Self-modify check
            self_check = self.check_self_modify(kwargs["path"])
            results["checks"].append({"check": "self_modify", "result": self_check})
            if not self_check["allowed"]:
                results["allowed"] = False
                results["blocked_by"] = "self_modify"
                return results

        # Command check
        if "command" in kwargs:
            cmd_check = self.check_command(kwargs["command"])
            results["checks"].append({"check": "command", "result": cmd_check})
            if not cmd_check["allowed"]:
                results["allowed"] = False
                results["blocked_by"] = "command"
                return results

        # Diff size check
        if "diff_lines" in kwargs:
            diff_check = self.check_diff_size(kwargs["diff_lines"])
            results["checks"].append({"check": "diff_size", "result": diff_check})
            if not diff_check["allowed"]:
                results["needs_approval"] = True

        return results


# ── CLI Interface ──

def main():
    if "--help" in sys.argv or "-h" in sys.argv or len(sys.argv) < 2:
        print("Usage: guardrails.py <check_type> [args...]")
        print()
        print("Guardrail enforcement engine — validates actions before execution.")
        print()
        print("Commands:")
        print("  repo <owner> <repo>          Check if repo is allowed")
        print("  branch <name>                Check if branch is allowed")
        print("  path <file_path>             Check if file path is allowed")
        print("  command <cmd...>             Check if shell command is allowed")
        print("  action <action_name>         Check action gate level")
        print("  issue_lock <owner> <repo> <#> Lock onto an issue")
        print("  issue_unlock                 Unlock current issue")
        print("  diff <line_count>            Check if diff size is within limits")
        print("  validate <action> [k=v...]   Full validation with all checks")
        if len(sys.argv) < 2:
            sys.exit(1)
        sys.exit(0)

    g = Guardrails()
    check = sys.argv[1]

    if check == "repo" and len(sys.argv) >= 4:
        print(json.dumps(g.check_repo(sys.argv[2], sys.argv[3]), indent=2))

    elif check == "branch" and len(sys.argv) >= 3:
        print(json.dumps(g.check_branch(sys.argv[2]), indent=2))

    elif check == "path" and len(sys.argv) >= 3:
        print(json.dumps(g.check_path(sys.argv[2]), indent=2))

    elif check == "command" and len(sys.argv) >= 3:
        print(json.dumps(g.check_command(" ".join(sys.argv[2:])), indent=2))

    elif check == "action" and len(sys.argv) >= 3:
        print(json.dumps(g.check_action(sys.argv[2]), indent=2))

    elif check == "issue_lock" and len(sys.argv) >= 5:
        print(json.dumps(g.lock_issue(sys.argv[2], sys.argv[3], int(sys.argv[4])), indent=2))

    elif check == "issue_unlock":
        print(json.dumps(g.unlock_issue(), indent=2))

    elif check == "diff" and len(sys.argv) >= 3:
        print(json.dumps(g.check_diff_size(int(sys.argv[2])), indent=2))

    elif check == "validate" and len(sys.argv) >= 3:
        action = sys.argv[2]
        kwargs = {}
        for arg in sys.argv[3:]:
            if "=" in arg:
                k, v = arg.split("=", 1)
                kwargs[k] = int(v) if v.isdigit() else v
        print(json.dumps(g.validate_full(action, **kwargs), indent=2))

    else:
        print(f"Unknown check: {check}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
