# Repo Autopilot — Canonical Engineering Fleet

## Goal
Make repo operations periodic, low-idle, and autonomous enough that Fortune does not need to babysit branch/PR/review/CI mechanics.

## Loop
1. Mission Control scans dispatches, queue, open PRs, and current repo truth.
2. Mission Control assigns or suppresses specialist work.
3. Specialists work only inside owned files in dedicated worktrees.
4. If a real bounded change exists, the specialist:
   - creates or switches to a task branch
   - makes the smallest correct change
   - runs targeted validation
   - opens or updates a PR
   - requests second-agent review
5. QA / reviewer lanes check CI and either:
   - request a bounded fix
   - approve
   - or allow safe auto-merge if policy permits
6. Mission Control updates dispatches and suppresses idle work.

## Philosophy
- Low idle does not mean fake activity.
- If there is no real bounded work, the lane should exit quickly.
- Do not surface PR plumbing to Fortune unless blocked or risky.
