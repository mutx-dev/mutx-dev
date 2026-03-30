# MUTX agent rewire — 2026-03-29

## Business / ops framing first
The main failure mode was not "agents need more autonomy." It was "GitHub truth was not turning into one clear next owner."

That creates two expensive behaviors:
1. agents sit idle because local queue files drift from live PR / CI state,
2. multiple lanes wait on the same blocker because nobody is normalizing PR feedback into a single next action.

The minimal fix is **not** a bigger orchestration system.
The minimal fix is one thin sync step that treats GitHub as source of truth and rewrites the local fleet queue from live PR / CI state.

## Smallest viable architecture
**One strong lane:** `GitHub PR/CI truth -> local action queue -> agent next owner`

Flow:
1. Read open PRs from GitHub.
2. Filter to lane PRs the fleet actually owns.
3. Classify each PR into one next action:
   - `needs-review-routing`
   - `awaiting-review`
   - `needs-author-fix`
   - `shared-ci-blocker`
   - `merge-ready`
4. Write those results into local dispatch files the agents already understand.
5. Emit one ultra-short 4h pulse for Fortune.

This keeps moving parts low:
- no paid services,
- no webhooks required,
- no production app code touched,
- no restart of the fleet model.

## What I changed
### 1) Added a GitHub-to-agent sync script
Created:
- `scripts/autonomy/sync_github_feedback.py`

What it does:
- reads live PR state from `mutx-dev/mutx-dev` via `gh`
- infers lane owner from changed files / routing rules
- infers reviewer from PR body or review matrix
- classifies the next action from review + CI state
- writes:
  - `mutx-engineering-agents/dispatch/action-queue.json`
  - `mutx-engineering-agents/dispatch/review-queue.json`
  - `mutx-engineering-agents/dispatch/merge-queue.json`
  - `reports/fortune-4h/latest.md`
  - `reports/fortune-4h/latest.json`

Refresh command:
```bash
cd /Users/fortune/.openclaw/workspace
python3 scripts/autonomy/sync_github_feedback.py
```

### 2) Wired agents to read the new queue
Updated:
- `mutx-engineering-agents/_shared/AGENT-TO-AGENT-LOOP.md`
- `mutx-engineering-agents/_shared/CONTEXT-REGISTRY.md`
- `mutx-engineering-agents/dispatch/mission-control-orchestrator.md`

Effect:
- specialists now have one explicit place to look for PR/CI next actions when review queue is empty
- mission control now has a crisp rule: route review, push shared CI to QA, return PR-specific fixes to owners, merge only when green + approved

### 3) Generated the first live outputs
Created / refreshed:
- `mutx-engineering-agents/dispatch/action-queue.json`
- `mutx-engineering-agents/dispatch/review-queue.json`
- `mutx-engineering-agents/dispatch/merge-queue.json`
- `reports/fortune-4h/latest.md`
- `reports/fortune-4h/latest.json`

## Live truth at implementation time
Current lane snapshot from the generated queue:
- active lane PRs: `#1209`, `#1210`, `#1211`
- merge-ready now: `0`
- review queue now: `0`
- all three are currently classified as `needs-review-routing`
- current next owner: `mission-control-orchestrator`

Meaning: the smallest truthful next move is **route distinct GitHub reviewers cleanly**, not invent more lane work.

One extra live-signal note: all three active lane PRs currently include `app/download/macos/page.tsx`, which looks like a shared CI-related fix being piggybacked into otherwise different lane PRs. I did **not** auto-classify that as a split blocker in code yet, but it is worth keeping reviews tight so unrelated rescue work does not quietly widen scope.

## 4-hour report shape
The report is intentionally short.
Current fields:
- PRs moved in the last 4h
- commits on active lane PRs in the last 4h
- merge-ready count now
- review-routing blockers now
- active lane diff now (`+adds / -dels`)
- shared CI blockers now
- one short "right-now next moves" section
- one short list of active lane PRs

This is designed to be readable in seconds, not as a narrative memo.

## What I proposed but did NOT implement
1. **Automatic scheduling / cron hook**
   - I did not add cron or persistent automation.
   - The script is ready to be called from an existing mission-control cycle later.

2. **GitHub-side writeback / reviewer auto-routing**
   - I did not auto-request reviewers or mutate PRs from the script.
   - For now it only normalizes truth and tells the fleet who owns the next move.

3. **Auto-merge / auto-comment behavior**
   - not added
   - unnecessary until reviewer routing is clean and stable

4. **Fancy analytics**
   - no dashboards, no database, no external store
   - just queue files + one short report

## Why this is the right minimal patch
- It upgrades the control loop without replacing it.
- It gives Mission Control a single source of local dispatch truth derived from GitHub.
- It avoids fake work when the real blocker is review routing or shared CI.
- It gives Fortune one 4h pulse that measures movement without wasting attention.
