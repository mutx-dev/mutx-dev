#!/usr/bin/env python3
"""
Fetch and analyze open GitHub issues for a repository.
Filters out issues with linked PRs and ranks by quality.
"""

import sys
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone

def fetch_issues(owner, repo, per_page=100):
    """Fetch open issues from GitHub API."""
    url = f"https://api.github.com/repos/{owner}/{repo}/issues?state=open&per_page={per_page}"
    
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"Error: {e.code} - {e.reason}", file=sys.stderr)
        if e.code == 404:
            print("Repository not found or private", file=sys.stderr)
        elif e.code == 403:
            print("API rate limit exceeded", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error fetching issues: {e}", file=sys.stderr)
        sys.exit(1)

def fetch_issue_timeline(owner, repo, issue_number):
    """Fetch timeline events for an issue to check for linked PRs."""
    url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}/timeline"
    
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/vnd.github.mockingbird-preview+json"})
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode())
    except:
        return []

def has_linked_pr(issue, owner, repo):
    """Check if issue has a linked PR."""
    # Skip if it's actually a pull request
    if issue.get("pull_request"):
        return True
    
    # Check timeline for cross-references
    timeline = fetch_issue_timeline(owner, repo, issue["number"])
    for event in timeline:
        if event.get("event") == "cross-referenced":
            source = event.get("source", {})
            if source.get("type") == "issue" and "pull_request" in source.get("issue", {}):
                return True
    
    return False

def score_issue(issue):
    """Score issue quality (higher = better candidate)."""
    score = 0
    
    # Labels
    labels = [l["name"].lower() for l in issue.get("labels", [])]
    if "good first issue" in labels:
        score += 50
    if "help wanted" in labels:
        score += 30
    if "bug" in labels:
        score += 20
    if "easy" in labels or "beginner" in labels:
        score += 25
    
    # Has clear description
    body = issue.get("body") or ""
    if len(body) > 100:
        score += 10
    
    # Recent activity
    updated = issue.get("updated_at")
    if updated:
        try:
            updated_dt = datetime.fromisoformat(updated.replace("Z", "+00:00"))
            days_ago = (datetime.now(timezone.utc) - updated_dt).days
            if days_ago < 7:
                score += 15
            elif days_ago < 30:
                score += 10
            elif days_ago > 180:
                score -= 20  # Penalize stale issues
        except:
            pass
    
    # Comments indicate engagement
    comments = issue.get("comments", 0)
    if 1 <= comments <= 10:
        score += 10
    
    return score

def main():
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: fetch_issues.py <owner> <repo>")
        print()
        print("Fetch open GitHub issues, filter out PRs, and rank by quality.")
        print("Outputs JSON array of top 10 candidates.")
        print()
        print("Prefer recommend.py for full scoring and formatted output.")
        sys.exit(0)

    if len(sys.argv) < 3:
        print("Usage: fetch_issues.py <owner> <repo>", file=sys.stderr)
        sys.exit(1)
    
    owner, repo = sys.argv[1], sys.argv[2]
    
    print(f"Fetching open issues for {owner}/{repo}...", file=sys.stderr)
    issues = fetch_issues(owner, repo)
    
    # Filter and score
    candidates = []
    for issue in issues:
        if has_linked_pr(issue, owner, repo):
            continue
        
        score = score_issue(issue)
        candidates.append({
            "number": issue["number"],
            "title": issue["title"],
            "body": issue.get("body", "")[:500],
            "labels": [l["name"] for l in issue.get("labels", [])],
            "comments": issue.get("comments", 0),
            "updated_at": issue.get("updated_at"),
            "html_url": issue["html_url"],
            "score": score
        })
    
    # Sort by score descending
    candidates.sort(key=lambda x: x["score"], reverse=True)
    
    # Output top 10
    print(json.dumps(candidates[:10], indent=2))

if __name__ == "__main__":
    main()
