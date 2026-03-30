#!/usr/bin/env python3
"""
Deep analysis of a single GitHub issue including comments and timeline.
"""

import sys
import json
import urllib.request
import urllib.error

def fetch_issue(owner, repo, issue_number):
    """Fetch issue details."""
    url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}"
    
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching issue: {e}", file=sys.stderr)
        sys.exit(1)

def fetch_comments(owner, repo, issue_number):
    """Fetch issue comments."""
    url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}/comments"
    
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            return json.loads(response.read().decode())
    except:
        return []

def fetch_timeline(owner, repo, issue_number):
    """Fetch issue timeline."""
    url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}/timeline"
    
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/vnd.github.mockingbird-preview+json"})
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode())
    except:
        return []

def main():
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: analyze_issue.py <owner> <repo> <issue_number>")
        print()
        print("Deep analysis of a single GitHub issue — fetches body, comments,")
        print("linked PRs, and outputs structured JSON.")
        sys.exit(0)

    if len(sys.argv) < 4:
        print("Usage: analyze_issue.py <owner> <repo> <issue_number>", file=sys.stderr)
        sys.exit(1)
    
    owner, repo, issue_number = sys.argv[1], sys.argv[2], sys.argv[3]
    
    print(f"Analyzing issue #{issue_number}...", file=sys.stderr)
    
    issue = fetch_issue(owner, repo, issue_number)
    comments = fetch_comments(owner, repo, issue_number)
    timeline = fetch_timeline(owner, repo, issue_number)
    
    # Check if it's actually a PR
    is_pr = "pull_request" in issue
    
    # Check for linked PRs
    linked_prs = []
    for event in timeline:
        if event.get("event") == "cross-referenced":
            source = event.get("source", {})
            if source.get("type") == "issue" and "pull_request" in source.get("issue", {}):
                linked_prs.append(source["issue"]["html_url"])
    
    result = {
        "number": issue["number"],
        "title": issue["title"],
        "state": issue["state"],
        "is_pull_request": is_pr,
        "body": issue.get("body", ""),
        "labels": [l["name"] for l in issue.get("labels", [])],
        "user": issue["user"]["login"],
        "created_at": issue["created_at"],
        "updated_at": issue["updated_at"],
        "comments_count": issue["comments"],
        "html_url": issue["html_url"],
        "linked_prs": linked_prs,
        "comments": [
            {
                "user": c["user"]["login"],
                "body": c["body"],
                "created_at": c["created_at"]
            }
            for c in comments
        ]
    }
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
