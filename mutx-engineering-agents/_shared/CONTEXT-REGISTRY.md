# Engineering Context Registry

## Core shared context
- `/Users/fortune/.openclaw/workspace/mutx-engineering-agents/_shared/ENGINEERING-MODEL.md`
- `/Users/fortune/.openclaw/workspace/mutx-engineering-agents/_shared/PR-RULES.md`
- `/Users/fortune/.openclaw/workspace/mutx-engineering-agents/_shared/REPO-AUTOPILOT.md`
- `/Users/fortune/.openclaw/workspace/mutx-engineering-agents/_shared/REVIEW-MATRIX.md`
- `/Users/fortune/.openclaw/workspace/mutx-engineering-agents/_shared/AUTO-MERGE-POLICY.md`
- `/Users/fortune/.openclaw/workspace/mutx-engineering-agents/_shared/AGENT-TO-AGENT-LOOP.md`

## Shared state files
- `/Users/fortune/.openclaw/workspace/mutx-engineering-agents/dispatch/review-queue.json`
- `/Users/fortune/.openclaw/workspace/mutx-engineering-agents/dispatch/merge-queue.json`
- `/Users/fortune/.openclaw/workspace/mutx-engineering-agents/dispatch/chrome-slots.json`

## Read discipline
- Mission Control reads the full dispatch graph plus GitHub truth.
- Specialists read only their dispatch file, the shared queues, and their owned worktree.
- Chrome-slot jobs read only `CHROME-JOBS.md`, `chrome-slots.json`, and the lane dispatch.
- Review first, then bounded dispatch, then exit quickly if idle.

## Canonical outputs
- local `reports/latest.md`
- local `queue/TODAY.md`
- shared dispatch files only when your role explicitly owns them
