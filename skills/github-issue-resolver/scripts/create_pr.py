#!/usr/bin/env python3
"""
Create a GitHub Pull Request using the GitHub CLI (gh).
"""

import sys
import subprocess
import json

def run_cmd(cmd, check=True):
    """Run shell command and return output."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"Command failed: {cmd}", file=sys.stderr)
        print(f"Error: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    return result.stdout.strip()

def main():
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: create_pr.py <branch_name> <title> <body_file> <issue_number>")
        print()
        print("Create a draft pull request via GitHub CLI (gh).")
        print("Requires: gh CLI installed and authenticated.")
        sys.exit(0)

    if len(sys.argv) < 5:
        print("Usage: create_pr.py <branch_name> <title> <body_file> <issue_number>", file=sys.stderr)
        sys.exit(1)
    
    branch_name = sys.argv[1]
    title = sys.argv[2]
    body_file = sys.argv[3]
    issue_number = sys.argv[4]
    
    # Check if gh CLI is installed
    try:
        run_cmd("which gh", check=True)
    except:
        print("Error: GitHub CLI (gh) is not installed", file=sys.stderr)
        print("Install from: https://cli.github.com/", file=sys.stderr)
        sys.exit(1)
    
    # Check if logged in
    try:
        run_cmd("gh auth status", check=True)
    except:
        print("Error: Not logged into GitHub CLI", file=sys.stderr)
        print("Run: gh auth login", file=sys.stderr)
        sys.exit(1)
    
    # Read body from file
    try:
        with open(body_file, 'r') as f:
            body = f.read()
    except Exception as e:
        print(f"Error reading body file: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Create branch if not exists
    current_branch = run_cmd("git branch --show-current")
    if current_branch != branch_name:
        run_cmd(f"git checkout -b {branch_name}")
    
    # Push branch
    print(f"Pushing branch {branch_name}...", file=sys.stderr)
    run_cmd(f"git push -u origin {branch_name}")
    
    # Create PR
    print("Creating Pull Request...", file=sys.stderr)
    cmd = f'gh pr create --title "{title}" --body-file "{body_file}"'
    
    try:
        pr_url = run_cmd(cmd)
        print(json.dumps({
            "success": True,
            "url": pr_url,
            "branch": branch_name,
            "title": title
        }))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
