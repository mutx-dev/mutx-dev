#!/usr/bin/env python3
"""
Sandbox — Command allowlist enforcer and safe execution wrapper.
Wraps all shell commands through guardrails before execution.
"""

import json
import os
import sys
import subprocess
import shlex
from datetime import datetime, timezone

# Import siblings
sys.path.insert(0, os.path.dirname(__file__))
from guardrails import Guardrails, GuardrailError
from audit import AuditLogger


class Sandbox:
    def __init__(self, config_path=None):
        self.guardrails = Guardrails(config_path)
        self.audit = AuditLogger(config_path)
        self._working_dir = None
        self._repo = None
        self._issue = None

    def set_context(self, repo: str = None, issue: int = None, working_dir: str = None):
        """Set the current working context."""
        self._repo = repo
        self._issue = issue
        self._working_dir = working_dir

    def execute(self, command: str, action_type: str = "run_command",
                cwd: str = None, dry_run: bool = False) -> dict:
        """Execute a command through guardrails."""
        
        # Step 1: Check command against guardrails
        cmd_check = self.guardrails.check_command(command)
        if not cmd_check["allowed"] and not cmd_check.get("requires_approval"):
            self.audit.log_guardrail_block(action_type, cmd_check["reason"],
                                            {"command": command})
            return {
                "executed": False,
                "blocked": True,
                "reason": cmd_check["reason"],
                "command": command
            }

        # Step 2: Check action gate
        gate = self.guardrails.check_action(action_type)

        # Step 3: If requires approval, return approval request
        if gate["needs_approval"] or cmd_check.get("requires_approval"):
            return {
                "executed": False,
                "blocked": False,
                "needs_approval": True,
                "action": action_type,
                "command": command,
                "gate_message": gate.get("message", "This action requires approval."),
                "reason": cmd_check.get("reason", "Gate requires approval")
            }

        # Step 4: Dry run mode
        if dry_run or self.guardrails.behavior.get("dryRunDefault", False):
            self.audit.log_action(action_type, {"command": command, "dry_run": True},
                                  result="dry_run", issue=self._issue, repo=self._repo)
            return {
                "executed": False,
                "dry_run": True,
                "command": command,
                "message": f"[DRY RUN] Would execute: {command}"
            }

        # Step 5: Execute
        work_dir = cwd or self._working_dir
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                cwd=work_dir,
                timeout=self.guardrails.behavior.get("timeoutMinutes", 15) * 60
            )

            success = result.returncode == 0
            self.audit.log_action(
                action_type,
                {
                    "command": command,
                    "return_code": result.returncode,
                    "stdout_lines": len(result.stdout.splitlines()),
                    "stderr_lines": len(result.stderr.splitlines())
                },
                result="success" if success else "failed",
                issue=self._issue,
                repo=self._repo
            )

            return {
                "executed": True,
                "success": success,
                "return_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "command": command
            }

        except subprocess.TimeoutExpired:
            self.audit.log_action(action_type, {"command": command}, result="timeout",
                                  issue=self._issue, repo=self._repo)
            return {
                "executed": False,
                "timeout": True,
                "command": command,
                "message": f"Command timed out after {self.guardrails.behavior.get('timeoutMinutes', 15)} minutes"
            }

        except Exception as e:
            self.audit.log_action(action_type, {"command": command, "error": str(e)},
                                  result="error", issue=self._issue, repo=self._repo)
            return {
                "executed": False,
                "error": str(e),
                "command": command
            }

    def execute_approved(self, command: str, action_type: str = "run_command",
                         cwd: str = None, approved_by: str = "user") -> dict:
        """Execute a previously-approved command (bypasses gate, not safety checks)."""
        
        # Still check command safety (blocked commands stay blocked even with approval)
        cmd_check = self.guardrails.check_command(command)
        if not cmd_check["allowed"] and not cmd_check.get("requires_approval"):
            self.audit.log_guardrail_block(action_type, cmd_check["reason"],
                                            {"command": command, "approved_by": approved_by})
            return {
                "executed": False,
                "blocked": True,
                "reason": f"Blocked even with approval: {cmd_check['reason']}"
            }

        # Log the approval
        self.audit.log_guardrail_approval(action_type, approved_by)

        # Execute
        work_dir = cwd or self._working_dir
        try:
            result = subprocess.run(
                command, shell=True, capture_output=True, text=True,
                cwd=work_dir,
                timeout=self.guardrails.behavior.get("timeoutMinutes", 15) * 60
            )

            success = result.returncode == 0
            self.audit.log_action(
                action_type,
                {"command": command, "return_code": result.returncode, "approved_by": approved_by},
                result="success" if success else "failed",
                issue=self._issue, repo=self._repo,
                approved_by=approved_by
            )

            return {
                "executed": True,
                "success": success,
                "return_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "command": command,
                "approved_by": approved_by
            }

        except Exception as e:
            return {"executed": False, "error": str(e), "command": command}

    def check_file_safe(self, file_path: str) -> dict:
        """Check if a file is safe to read/modify."""
        path_check = self.guardrails.check_path(file_path)
        self_check = self.guardrails.check_self_modify(file_path)

        if not path_check["allowed"]:
            self.audit.log_guardrail_block("file_access", path_check["reason"],
                                            {"path": file_path})
            return path_check

        if not self_check["allowed"]:
            self.audit.log_guardrail_block("self_modify", self_check["reason"],
                                            {"path": file_path})
            return self_check

        return {"allowed": True, "path": file_path}

    def check_diff_safe(self, diff_content: str, file_path: str = None) -> dict:
        """Check if a diff is within size limits."""
        lines = len(diff_content.splitlines())
        size_check = self.guardrails.check_diff_size(lines)

        if file_path and self._issue:
            self.audit.log_diff(self._issue, file_path, diff_content, self._repo)

        return size_check

    def get_status(self) -> dict:
        """Get current sandbox status."""
        return {
            "repo": self._repo,
            "issue": self._issue,
            "working_dir": self._working_dir,
            "current_issue_lock": self.guardrails.get_current_issue(),
            "audit_summary": self.audit.get_summary(),
            "behavior": self.guardrails.behavior
        }


# ── CLI Interface ──

def main():
    if "--help" in sys.argv or "-h" in sys.argv or len(sys.argv) < 2:
        print("Usage: sandbox.py <command> [args...]")
        print()
        print("Safe command execution wrapper — all commands go through guardrails.")
        print()
        print("Commands:")
        print("  run <cmd...>            Execute command (requires guardrail approval)")
        print("  run_approved <cmd...>   Execute pre-approved command")
        print("  check_file <path>       Check if file is safe to access")
        print("  check_diff <diff|->     Check diff content (use - for stdin)")
        print("  status                  Show sandbox status")
        if len(sys.argv) < 2:
            sys.exit(1)
        sys.exit(0)

    sandbox = Sandbox()
    cmd = sys.argv[1]

    if cmd == "run" and len(sys.argv) >= 3:
        command = " ".join(sys.argv[2:])
        result = sandbox.execute(command)
        print(json.dumps(result, indent=2))

    elif cmd == "run_approved" and len(sys.argv) >= 3:
        command = " ".join(sys.argv[2:])
        result = sandbox.execute_approved(command)
        print(json.dumps(result, indent=2))

    elif cmd == "check_file" and len(sys.argv) >= 3:
        result = sandbox.check_file_safe(sys.argv[2])
        print(json.dumps(result, indent=2))

    elif cmd == "check_diff" and len(sys.argv) >= 3:
        diff = sys.stdin.read() if sys.argv[2] == "-" else sys.argv[2]
        result = sandbox.check_diff_safe(diff)
        print(json.dumps(result, indent=2))

    elif cmd == "status":
        print(json.dumps(sandbox.get_status(), indent=2))

    else:
        print(f"Unknown: {cmd}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
