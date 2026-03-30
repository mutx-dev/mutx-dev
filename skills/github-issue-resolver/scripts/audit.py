#!/usr/bin/env python3
"""
Audit Logger for GitHub Issue Resolver.
Logs every action with timestamps, context, and results.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

class AuditLogger:
    def __init__(self, config_path=None):
        guardrails_path = config_path or os.path.join(
            os.path.dirname(__file__), "..", "guardrails.json"
        )
        with open(guardrails_path, "r") as f:
            config = json.load(f)
        
        audit_config = config.get("audit", {})
        self.enabled = audit_config.get("enabled", True)
        self.log_actions = audit_config.get("logActions", True)
        self.log_diffs = audit_config.get("logDiffs", True)
        self.log_decisions = audit_config.get("logDecisions", True)
        
        # Audit directory relative to skill root
        skill_root = os.path.dirname(os.path.dirname(__file__))
        log_dir_name = audit_config.get("logDir", "audit")
        self.log_dir = os.path.join(skill_root, log_dir_name)
        
        # Create directories
        self._today_dir = os.path.join(self.log_dir, datetime.now().strftime("%Y-%m-%d"))
        os.makedirs(self._today_dir, exist_ok=True)
        os.makedirs(os.path.join(self._today_dir, "diffs"), exist_ok=True)
        
        # Session log file
        self._session_id = datetime.now(timezone.utc).strftime("%H%M%S")
        self._session_file = os.path.join(self._today_dir, f"session-{self._session_id}.json")
        self._entries = []
        self._load_session()

    def _load_session(self):
        """Load existing session entries if file exists."""
        if os.path.exists(self._session_file):
            with open(self._session_file, "r") as f:
                data = json.load(f)
                self._entries = data.get("entries", [])

    def _save_session(self):
        """Save session to disk."""
        data = {
            "session_id": self._session_id,
            "started_at": self._entries[0]["timestamp"] if self._entries else None,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "entry_count": len(self._entries),
            "entries": self._entries
        }
        with open(self._session_file, "w") as f:
            json.dump(data, f, indent=2)

    def log_action(self, action: str, details: dict = None, result: str = "success",
                   issue: int = None, repo: str = None, phase: str = None,
                   approved_by: str = None):
        """Log an action."""
        if not self.enabled or not self.log_actions:
            return

        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": "action",
            "action": action,
            "result": result,
            "issue": issue,
            "repo": repo,
            "phase": phase,
            "approved_by": approved_by,
            "details": details or {}
        }
        self._entries.append(entry)
        self._save_session()
        return entry

    def log_decision(self, decision: str, reason: str, context: dict = None,
                     issue: int = None, repo: str = None):
        """Log a decision made by the agent."""
        if not self.enabled or not self.log_decisions:
            return

        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": "decision",
            "decision": decision,
            "reason": reason,
            "issue": issue,
            "repo": repo,
            "context": context or {}
        }
        self._entries.append(entry)
        self._save_session()
        return entry

    def log_diff(self, issue_number: int, file_path: str, diff_content: str,
                 repo: str = None):
        """Save a diff to the diffs directory."""
        if not self.enabled or not self.log_diffs:
            return

        safe_filename = file_path.replace("/", "_").replace("\\", "_")
        diff_file = os.path.join(
            self._today_dir, "diffs",
            f"issue-{issue_number}-{safe_filename}.patch"
        )
        with open(diff_file, "w") as f:
            f.write(diff_content)

        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": "diff",
            "issue": issue_number,
            "repo": repo,
            "file": file_path,
            "diff_file": diff_file,
            "lines": len(diff_content.splitlines())
        }
        self._entries.append(entry)
        self._save_session()
        return entry

    def log_guardrail_block(self, action: str, reason: str, details: dict = None):
        """Log when a guardrail blocks an action."""
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": "guardrail_block",
            "action": action,
            "reason": reason,
            "details": details or {}
        }
        self._entries.append(entry)
        self._save_session()
        return entry

    def log_guardrail_approval(self, action: str, approved_by: str = "user"):
        """Log when user approves a gated action."""
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": "guardrail_approval",
            "action": action,
            "approved_by": approved_by
        }
        self._entries.append(entry)
        self._save_session()
        return entry

    def get_summary(self) -> dict:
        """Get session summary."""
        actions = [e for e in self._entries if e["type"] == "action"]
        blocks = [e for e in self._entries if e["type"] == "guardrail_block"]
        approvals = [e for e in self._entries if e["type"] == "guardrail_approval"]
        decisions = [e for e in self._entries if e["type"] == "decision"]
        diffs = [e for e in self._entries if e["type"] == "diff"]

        return {
            "session_id": self._session_id,
            "total_entries": len(self._entries),
            "actions": len(actions),
            "guardrail_blocks": len(blocks),
            "guardrail_approvals": len(approvals),
            "decisions": len(decisions),
            "diffs_saved": len(diffs),
            "session_file": self._session_file
        }

    def generate_decisions_md(self, issue_number: int = None) -> str:
        """Generate a human-readable decisions.md."""
        lines = [f"# Decisions Log — {datetime.now().strftime('%Y-%m-%d')}\n"]

        if issue_number:
            lines.append(f"## Issue #{issue_number}\n")

        for entry in self._entries:
            ts = entry.get("timestamp", "")[:19]
            etype = entry.get("type", "")

            if etype == "decision":
                lines.append(f"### [{ts}] {entry['decision']}")
                lines.append(f"**Reason:** {entry['reason']}\n")

            elif etype == "action":
                status = "✅" if entry["result"] == "success" else "❌"
                lines.append(f"- [{ts}] {status} `{entry['action']}` — {entry['result']}")

            elif etype == "guardrail_block":
                lines.append(f"- [{ts}] 🛡️ **BLOCKED** `{entry['action']}` — {entry['reason']}")

            elif etype == "guardrail_approval":
                lines.append(f"- [{ts}] ✅ **APPROVED** `{entry['action']}` by {entry['approved_by']}")

        md_content = "\n".join(lines)
        md_file = os.path.join(self._today_dir, "decisions.md")
        with open(md_file, "w") as f:
            f.write(md_content)

        return md_content


# ── CLI Interface ──

def main():
    if "--help" in sys.argv or "-h" in sys.argv or len(sys.argv) < 2:
        print("Usage: audit.py <command> [args...]")
        print()
        print("Audit logger — tracks all actions for accountability.")
        print()
        print("Commands:")
        print("  log_action <action> [result]     Log an action (default result: success)")
        print("  log_decision <decision> <reason>  Log a decision with reasoning")
        print("  log_block <action> <reason>       Log a guardrail block")
        print("  summary                           Show audit summary")
        print("  decisions_md [issue_num]           Generate decisions markdown")
        if len(sys.argv) < 2:
            sys.exit(1)
        sys.exit(0)

    logger = AuditLogger()
    cmd = sys.argv[1]

    if cmd == "log_action":
        action = sys.argv[2] if len(sys.argv) > 2 else "unknown"
        result = sys.argv[3] if len(sys.argv) > 3 else "success"
        entry = logger.log_action(action, result=result)
        print(json.dumps(entry, indent=2))

    elif cmd == "log_decision":
        decision = sys.argv[2] if len(sys.argv) > 2 else "unknown"
        reason = sys.argv[3] if len(sys.argv) > 3 else "no reason"
        entry = logger.log_decision(decision, reason)
        print(json.dumps(entry, indent=2))

    elif cmd == "log_block":
        action = sys.argv[2] if len(sys.argv) > 2 else "unknown"
        reason = sys.argv[3] if len(sys.argv) > 3 else "no reason"
        entry = logger.log_guardrail_block(action, reason)
        print(json.dumps(entry, indent=2))

    elif cmd == "summary":
        print(json.dumps(logger.get_summary(), indent=2))

    elif cmd == "decisions_md":
        issue = int(sys.argv[2]) if len(sys.argv) > 2 else None
        md = logger.generate_decisions_md(issue)
        print(md)

    else:
        print(f"Unknown command: {cmd}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
