# MUTX Lane Baseline Checklist

Use this before enabling any autonomous lane.

## 1. Repo truth
- [ ] canonical repo is `/Users/fortune/MUTX`
- [ ] root checkout is not used for autonomous edits
- [ ] backend worktree exists and is clean enough to use
- [ ] frontend worktree exists and is clean enough to use

## 2. Queue truth
- [ ] one executable queue source selected
- [ ] signal files are advisory only
- [ ] reports are read-only summaries
- [ ] every queue item has lane, verification, and bounds

## 3. Runtime truth
- [ ] one canonical `.openclaw/openclaw.json`
- [ ] old `.bak` and `.clobbered` variants archived
- [ ] active scheduler state intentionally on or intentionally off
- [ ] no zombie automation loops left running

## 4. Worker truth

### OpenCode
- [x] binary installed
- [x] auth present
- [x] smoke test passed
- [ ] ACP-backed lane wired to queue contract

### Codex
- [x] binary installed
- [x] auth present
- [ ] quota/billing healthy
- [ ] smoke test passes
- [ ] backend lane wired to queue contract

## 5. Worktree truth
- [ ] backend lane maps only to backend worktree
- [ ] frontend lane maps only to frontend worktree
- [ ] no lane writes to root repo checkout
- [ ] workers reject tasks without explicit worktree path

## 6. Verification truth
- [ ] bounded test recipe exists per task
- [ ] lane-wide validation recipe exists before PR/merge
- [ ] CI remains final scoreboard
- [ ] reports include actual command results

## 7. Failure policy
- [ ] repeated CLI/runtime/provider errors auto-disable lane
- [ ] failed task is marked blocked or failed, not silently retried forever
- [ ] stale claim / stale branch cleanup is deterministic
- [ ] manual recovery steps are documented

## 8. Immediate blockers observed on 2026-04-04
- Codex auth exists but current exec path fails with quota exceeded
- OpenCode auth exists and smoke test succeeds
- current `.openclaw` logs still show stale failures:
  - `unknown option '--task'`
  - `No module named 'openclaw'`
  - MiniMax `404`

## 9. Go / no-go rule
Do not enable multi-lane autonomous shipping until:
1. OpenCode can complete one bounded real task end-to-end
2. Codex can complete one bounded real task end-to-end
3. `main` can report both honestly
