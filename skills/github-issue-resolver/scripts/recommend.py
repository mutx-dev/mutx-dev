#!/usr/bin/env python3
"""
Recommendation Engine for GitHub Issue Resolver.
Smart scoring, severity classification, effort estimation, and reasoning.
"""

import json
import os
import sys
import re
from datetime import datetime, timezone
from typing import Optional

# ── Severity Keywords ──

SEVERITY_KEYWORDS = {
    "critical": {
        "title": ["crash", "data loss", "security", "vulnerability", "cve", "injection",
                  "broken", "down", "outage", "emergency", "urgent", "blocker",
                  "authentication fail", "auth broken", "login broken", "cors",
                  "xss", "sql injection", "rce", "remote code execution",
                  "denial of service", "dos", "privilege escalation"],
        "body": ["production", "all users affected", "cannot login", "data corruption",
                "security issue", "exploit", "critical bug", "p0", "sev-0", "sev0",
                "breaks everything", "site down", "app crash", "white screen",
                "infinite loop", "memory leak.*production", "oom"],
        "labels": ["critical", "security", "p0", "sev-0", "sev0", "blocker",
                   "urgent", "hotfix", "vulnerability", "breaking"]
    },
    "high": {
        "title": ["regression", "broken", "error", "fail", "exception", "bug",
                  "not working", "doesn't work", "can't", "cannot", "unable",
                  "incorrect", "wrong", "missing", "undefined", "null pointer",
                  "type error", "runtime error"],
        "body": ["regression", "was working before", "after update", "broke",
                "stack trace", "error message", "traceback", "exception",
                "affects many", "workaround", "blocking", "p1", "sev-1", "sev1"],
        "labels": ["bug", "regression", "p1", "sev-1", "sev1", "high",
                   "high-priority", "important"]
    },
    "medium": {
        "title": ["feature", "request", "add", "support", "improve", "enhance",
                  "update", "upgrade", "refactor", "performance", "slow",
                  "inconsistent", "unexpected", "confusing"],
        "body": ["would be nice", "feature request", "enhancement",
                "proposal", "rfc", "design doc", "p2", "sev-2", "sev2",
                "suggestion", "idea"],
        "labels": ["enhancement", "feature", "feature-request", "improvement",
                   "p2", "sev-2", "sev2", "medium", "help wanted", "good first issue"]
    },
    "low": {
        "title": ["typo", "docs", "documentation", "readme", "comment",
                  "style", "formatting", "lint", "cosmetic", "minor",
                  "rename", "cleanup", "chore"],
        "body": ["typo", "spelling", "grammar", "documentation",
                "minor issue", "cosmetic", "nice to have", "low priority",
                "p3", "sev-3", "sev3", "not urgent"],
        "labels": ["documentation", "docs", "typo", "good first issue",
                   "low", "p3", "sev-3", "sev3", "chore", "cleanup",
                   "cosmetic", "minor"]
    }
}

# ── Impact Keywords ──

IMPACT_KEYWORDS = {
    "high": ["all users", "everyone", "production", "login", "authentication",
             "payment", "checkout", "data loss", "security", "crash", "unusable",
             "mobile", "api", "breaking change", "backwards compatible"],
    "medium": ["some users", "specific", "edge case", "workaround available",
               "performance", "slow", "memory", "ui glitch", "inconsistent"],
    "low": ["rare", "cosmetic", "documentation", "typo", "style",
            "dev experience", "internal", "tooling"]
}

# ── Effort Keywords ──

EFFORT_KEYWORDS = {
    "trivial": ["typo", "spelling", "one line", "simple fix", "readme",
                "comment", "string change", "text change", "rename"],
    "easy": ["small", "straightforward", "clear fix", "obvious",
             "one file", "single file", "quick fix", "minor"],
    "medium": ["multiple files", "refactor", "new feature", "api change",
               "migration", "schema change", "moderate"],
    "hard": ["architecture", "redesign", "complex", "breaking change",
             "cross-cutting", "significant", "large", "rewrite",
             "performance optimization", "concurrency", "race condition"]
}


class RecommendationEngine:
    def __init__(self):
        self.weights = {
            "severity": 0.30,
            "impact": 0.25,
            "actionability": 0.20,
            "effort_inverse": 0.10,
            "freshness": 0.10,
            "maintainer_signal": 0.05
        }

    def classify_severity(self, issue: dict) -> dict:
        """Classify issue severity: critical, high, medium, low."""
        title = (issue.get("title") or "").lower()
        body = (issue.get("body") or "").lower()
        labels = [l.lower() if isinstance(l, str) else l.get("name", "").lower()
                  for l in issue.get("labels", [])]

        scores = {"critical": 0, "high": 0, "medium": 0, "low": 0}

        for severity, keywords in SEVERITY_KEYWORDS.items():
            for kw in keywords["title"]:
                if kw in title:
                    scores[severity] += 3
            for kw in keywords["body"]:
                if kw in body:
                    scores[severity] += 2
            for kw in keywords["labels"]:
                if kw in labels:
                    scores[severity] += 5

        # Pick highest scoring severity
        best = max(scores, key=scores.get)
        if scores[best] == 0:
            best = "medium"  # Default

        icons = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}

        return {
            "level": best,
            "icon": icons[best],
            "confidence": min(scores[best] / 10, 1.0),
            "scores": scores
        }

    def assess_impact(self, issue: dict) -> dict:
        """Assess user impact: high, medium, low."""
        title = (issue.get("title") or "").lower()
        body = (issue.get("body") or "").lower()
        text = f"{title} {body}"

        scores = {"high": 0, "medium": 0, "low": 0}
        reasons = []

        for level, keywords in IMPACT_KEYWORDS.items():
            for kw in keywords:
                if kw in text:
                    scores[level] += 1
                    reasons.append(f"{kw} → {level} impact")

        # Reaction count as impact signal
        reactions = issue.get("reactions", {})
        thumbs_up = reactions.get("+1", 0) if isinstance(reactions, dict) else 0
        if thumbs_up >= 10:
            scores["high"] += 3
            reasons.append(f"{thumbs_up} 👍 reactions")
        elif thumbs_up >= 3:
            scores["medium"] += 2
            reasons.append(f"{thumbs_up} 👍 reactions")

        # Comment count as engagement signal
        comments = issue.get("comments", 0)
        if comments >= 10:
            scores["high"] += 2
            reasons.append(f"{comments} comments (high engagement)")
        elif comments >= 3:
            scores["medium"] += 1

        best = max(scores, key=scores.get)
        if scores[best] == 0:
            best = "medium"

        return {
            "level": best,
            "reasons": reasons[:5],
            "scores": scores
        }

    def assess_actionability(self, issue: dict) -> dict:
        """Assess how actionable an issue is."""
        body = (issue.get("body") or "").lower()
        score = 0
        reasons = []

        # Has reproduction steps
        repro_patterns = ["steps to reproduce", "how to reproduce", "repro",
                          "reproduction", "to reproduce", "steps:", "1.", "expected",
                          "actual", "observed"]
        for p in repro_patterns:
            if p in body:
                score += 15
                reasons.append("Has reproduction steps")
                break

        # Has expected vs actual behavior
        if "expected" in body and ("actual" in body or "instead" in body or "but" in body):
            score += 10
            reasons.append("Describes expected vs actual behavior")

        # Has error messages or stack traces
        if "error" in body or "traceback" in body or "stack trace" in body or "```" in body:
            score += 10
            reasons.append("Includes error output or code")

        # Has screenshots or images
        if "![" in body or "screenshot" in body or ".png" in body or ".jpg" in body:
            score += 5
            reasons.append("Includes visual evidence")

        # Has environment info
        if "version" in body or "os" in body or "browser" in body or "node" in body:
            score += 5
            reasons.append("Includes environment info")

        # Body length (more detail = more actionable)
        body_len = len(issue.get("body") or "")
        if body_len > 500:
            score += 10
            reasons.append("Detailed description")
        elif body_len > 200:
            score += 5
            reasons.append("Reasonable description")
        elif body_len < 50:
            score -= 10
            reasons.append("Very sparse description")

        # Not actionable signals
        if "?" in (issue.get("title") or "") and score < 10:
            score -= 5
            reasons.append("Might be a question, not actionable")

        level = "high" if score >= 25 else "medium" if score >= 10 else "low"
        return {"level": level, "score": score, "reasons": reasons}

    def estimate_effort(self, issue: dict) -> dict:
        """Estimate fix effort: trivial, easy, medium, hard."""
        title = (issue.get("title") or "").lower()
        body = (issue.get("body") or "").lower()
        text = f"{title} {body}"

        scores = {"trivial": 0, "easy": 0, "medium": 0, "hard": 0}

        for level, keywords in EFFORT_KEYWORDS.items():
            for kw in keywords:
                if kw in text:
                    scores[level] += 1

        # File count heuristic
        file_mentions = re.findall(r'[\w/]+\.\w{1,4}', body)
        unique_files = len(set(file_mentions))
        if unique_files == 0:
            pass  # Can't tell
        elif unique_files == 1:
            scores["easy"] += 2
        elif unique_files <= 3:
            scores["medium"] += 2
        else:
            scores["hard"] += 2

        best = max(scores, key=scores.get)
        if scores[best] == 0:
            best = "medium"  # Default

        icons = {"trivial": "⚡", "easy": "🟢", "medium": "🟡", "hard": "🔴"}
        time_est = {"trivial": "<15 min", "easy": "15-60 min", "medium": "1-3 hours", "hard": "3+ hours"}

        return {
            "level": best,
            "icon": icons[best],
            "time_estimate": time_est[best],
            "files_mentioned": unique_files,
            "scores": scores
        }

    def assess_freshness(self, issue: dict) -> dict:
        """Assess issue freshness."""
        updated = issue.get("updated_at")
        created = issue.get("created_at")

        if not updated:
            return {"score": 0, "days_since_update": None}

        try:
            updated_dt = datetime.fromisoformat(updated.replace("Z", "+00:00"))
            days_ago = (datetime.now(timezone.utc) - updated_dt).days

            if days_ago <= 1:
                return {"score": 100, "days_since_update": days_ago, "label": "Today"}
            elif days_ago <= 7:
                return {"score": 80, "days_since_update": days_ago, "label": "This week"}
            elif days_ago <= 30:
                return {"score": 50, "days_since_update": days_ago, "label": "This month"}
            elif days_ago <= 90:
                return {"score": 20, "days_since_update": days_ago, "label": "Recent"}
            else:
                return {"score": -20, "days_since_update": days_ago, "label": "Stale"}
        except:
            return {"score": 0, "days_since_update": None, "label": "Unknown"}

    def assess_maintainer_signal(self, issue: dict) -> dict:
        """Check for maintainer signals (labels, assignees)."""
        labels = [l.lower() if isinstance(l, str) else l.get("name", "").lower()
                  for l in issue.get("labels", [])]
        score = 0
        signals = []

        priority_labels = ["help wanted", "good first issue", "contributions welcome",
                           "accepting prs", "up for grabs"]
        for pl in priority_labels:
            if pl in labels:
                score += 20
                signals.append(f"Labeled '{pl}'")

        # Assigned = someone already working
        assignees = issue.get("assignees", [])
        if assignees:
            score -= 30
            signals.append(f"Already assigned to {len(assignees)} people")

        # Milestone = planned work
        if issue.get("milestone"):
            score += 10
            signals.append(f"Part of milestone: {issue['milestone'].get('title', '?')}")

        return {"score": score, "signals": signals}

    def compute_score(self, issue: dict) -> dict:
        """Compute weighted final score with full analysis."""
        severity = self.classify_severity(issue)
        impact = self.assess_impact(issue)
        actionability = self.assess_actionability(issue)
        effort = self.estimate_effort(issue)
        freshness = self.assess_freshness(issue)
        maintainer = self.assess_maintainer_signal(issue)

        # Normalize scores to 0-100
        severity_score = {"critical": 100, "high": 75, "medium": 50, "low": 25}[severity["level"]]
        impact_score = {"high": 100, "medium": 60, "low": 30}[impact["level"]]
        actionability_score = min(max(actionability["score"] * 2, 0), 100)
        effort_score = {"trivial": 100, "easy": 80, "medium": 50, "hard": 20}[effort["level"]]
        freshness_score = max(freshness["score"], 0)
        maintainer_score = max(min(maintainer["score"] + 50, 100), 0)

        # Weighted total
        total = (
            severity_score * self.weights["severity"] +
            impact_score * self.weights["impact"] +
            actionability_score * self.weights["actionability"] +
            effort_score * self.weights["effort_inverse"] +
            freshness_score * self.weights["freshness"] +
            maintainer_score * self.weights["maintainer_signal"]
        )

        return {
            "total_score": round(total, 1),
            "severity": severity,
            "impact": impact,
            "actionability": actionability,
            "effort": effort,
            "freshness": freshness,
            "maintainer_signal": maintainer
        }

    def generate_reasoning(self, issue: dict, analysis: dict) -> str:
        """Generate human-readable reasoning for why to fix this issue."""
        reasons = []

        # Severity reason
        sev = analysis["severity"]
        if sev["level"] == "critical":
            reasons.append("Critical issue that likely affects production or security")
        elif sev["level"] == "high":
            reasons.append("High-severity bug that impacts user experience")

        # Impact reasons
        for r in analysis["impact"]["reasons"][:2]:
            reasons.append(r)

        # Actionability
        act = analysis["actionability"]
        if act["level"] == "high":
            reasons.append("Well-documented with clear reproduction steps")
        elif act["level"] == "low":
            reasons.append("Sparse description — may need clarification")

        # Effort
        eff = analysis["effort"]
        if eff["level"] in ("trivial", "easy"):
            reasons.append(f"Quick fix (est. {eff['time_estimate']})")
        elif eff["level"] == "hard":
            reasons.append(f"Complex fix (est. {eff['time_estimate']})")

        # Freshness
        fresh = analysis["freshness"]
        if fresh.get("label") == "Today":
            reasons.append("Very fresh — just reported")
        elif fresh.get("label") == "Stale":
            reasons.append(f"Stale ({fresh['days_since_update']} days since update)")

        # Maintainer
        for s in analysis["maintainer_signal"]["signals"][:2]:
            reasons.append(s)

        return ". ".join(reasons) + "."

    def recommend(self, issues: list) -> dict:
        """Analyze all issues and return ranked recommendations."""
        analyzed = []

        for issue in issues:
            # Skip PRs
            if issue.get("pull_request"):
                continue

            analysis = self.compute_score(issue)
            reasoning = self.generate_reasoning(issue, analysis)

            # Issue type
            labels = [l.lower() if isinstance(l, str) else l.get("name", "").lower()
                      for l in issue.get("labels", [])]
            if any(l in labels for l in ["bug", "defect", "regression"]):
                issue_type = "🐛 Bug"
            elif any(l in labels for l in ["enhancement", "feature", "feature-request"]):
                issue_type = "✨ Feature"
            elif any(l in labels for l in ["documentation", "docs"]):
                issue_type = "📝 Docs"
            elif any(l in labels for l in ["security", "vulnerability"]):
                issue_type = "🔒 Security"
            else:
                issue_type = "📋 Issue"

            analyzed.append({
                "number": issue["number"],
                "title": issue["title"],
                "url": issue.get("html_url", ""),
                "type": issue_type,
                "severity": analysis["severity"],
                "impact": analysis["impact"]["level"],
                "effort": analysis["effort"],
                "actionability": analysis["actionability"]["level"],
                "freshness": analysis["freshness"],
                "maintainer_signal": analysis["maintainer_signal"],
                "total_score": analysis["total_score"],
                "reasoning": reasoning,
                "labels": [l if isinstance(l, str) else l.get("name", "")
                          for l in issue.get("labels", [])],
                "comments": issue.get("comments", 0),
                "reactions_plus1": issue.get("reactions", {}).get("+1", 0)
                                   if isinstance(issue.get("reactions"), dict) else 0
            })

        # Sort by total score descending
        analyzed.sort(key=lambda x: x["total_score"], reverse=True)

        # Build recommendation
        recommended = analyzed[0] if analyzed else None
        others = analyzed[1:] if len(analyzed) > 1 else []

        return {
            "total_found": len(analyzed),
            "recommended": recommended,
            "others": others,
            "analysis_timestamp": datetime.now(timezone.utc).isoformat()
        }

    def format_recommendation(self, result: dict) -> str:
        """Format recommendation as human-readable text."""
        if not result.get("recommended"):
            return "No actionable issues found."

        lines = []
        rec = result["recommended"]
        total = result["total_found"]

        lines.append(f"## Issues Found: {total} open (no existing PRs)\n")

        # Recommended issue
        lines.append(f"### ⭐ Recommended: #{rec['number']} — {rec['title']}")
        lines.append(f"{rec['severity']['icon']} **{rec['severity']['level'].upper()}** | "
                     f"{rec['type']} | "
                     f"Impact: {rec['impact'].capitalize()} | "
                     f"Effort: {rec['effort']['icon']} {rec['effort']['level'].capitalize()} "
                     f"({rec['effort']['time_estimate']})")
        lines.append(f"**Score:** {rec['total_score']}/100")
        lines.append(f"**Why fix this:** {rec['reasoning']}")
        if rec['comments'] > 0:
            lines.append(f"**Engagement:** {rec['comments']} comments"
                        + (f", {rec['reactions_plus1']} 👍" if rec['reactions_plus1'] > 0 else ""))
        lines.append(f"**Link:** {rec['url']}")
        lines.append("")

        # Other issues
        if result["others"]:
            lines.append("---\n### Other Issues:\n")
            for i, issue in enumerate(result["others"][:9], 2):
                lines.append(
                    f"**{i}. #{issue['number']}** — {issue['title']}\n"
                    f"   {issue['severity']['icon']} {issue['severity']['level'].capitalize()} | "
                    f"{issue['type']} | "
                    f"Effort: {issue['effort']['level'].capitalize()} | "
                    f"Score: {issue['total_score']}/100\n"
                    f"   *{issue['reasoning'][:120]}*\n"
                )

        lines.append("\n---\n**Which issue would you like to work on?** "
                    "(Enter the issue number, or say 'recommended' for the top pick)")

        return "\n".join(lines)


# ── CLI Interface ──

def main():
    """CLI: recommend.py <owner> <repo> [--json] [--top N] [--help]"""
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: recommend.py <owner> <repo> [--json] [--top N]")
        print()
        print("Fetch, score, and rank open GitHub issues for a repository.")
        print()
        print("Options:")
        print("  --json    Output raw JSON instead of formatted text")
        print("  --top N   Show top N issues (default: 10)")
        print("  --help    Show this help message")
        sys.exit(0)

    if len(sys.argv) < 3:
        print("Usage: recommend.py <owner> <repo> [--json] [--top N]", file=sys.stderr)
        sys.exit(1)

    owner, repo = sys.argv[1], sys.argv[2]
    as_json = "--json" in sys.argv
    top_n = 10
    for i, arg in enumerate(sys.argv):
        if arg == "--top" and i + 1 < len(sys.argv):
            top_n = int(sys.argv[i + 1])

    # Fetch issues using shared fetcher
    from fetch_issues import fetch_issues
    print(f"Fetching issues from {owner}/{repo}...", file=sys.stderr)
    issues = fetch_issues(owner, repo)

    # Run recommendation
    engine = RecommendationEngine()
    result = engine.recommend(issues)

    # Trim to top N
    result["others"] = result["others"][:top_n - 1]

    if as_json:
        print(json.dumps(result, indent=2))
    else:
        print(engine.format_recommendation(result))


if __name__ == "__main__":
    main()
