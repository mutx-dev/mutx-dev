# MUTX Autonomous Dev Shop Plan

> For Hermes/CIPHER: this plan defines the clean replacement for the current broken autonomy substrate. Use it to build a boring, reliable shipping machine around the live MUTX repo without mutating `.openclaw` blindly.

## Goal

Turn MUTX into a fully autonomous but tightly governed coding shop built around:
- one orchestrator lane
- one Codex backend/review lane
- one OpenCode frontend lane
- one trusted queue truth
- one trusted worktree layout
- one truthful report surface

This plan is explicitly informed by the failures currently visible in `/Users/fortune/.openclaw` and `scripts/autonomy/*`.

## Why this exists

The repo is healthier than the runtime.

What is broken right now is not the product thesis. It is the execution substrate:
- stale CLI invocation paths (`--task` failures)
- broken module/runtime assumptions (`No module named 'openclaw'`)
- provider/model failures (MiniMax `404`)
- dead cron residue
- too many active-ish agents and workspaces
- too many overlapping truths

The replacement architecture must be smaller than the current one, not bigger.

---

## Architecture summary

### Canonical lanes

1. `main` — orchestrator / queue / dispatch / merge / reporting
2. `codex` — backend / API / runtime / SDK / review lane
3. `opencode` — frontend / dashboard / browser-surface lane

Optional later:
4. `outreach` — separate GTM lane, not coupled to code shipping

### Hard rule

Only `main` dispatches.
Workers never self-orchestrate.
Workers never own queue truth.
Workers never mutate scheduling policy.

---

## What we keep from the old system

Keep:
- issue/queue-driven decomposition
- area-based lane routing
- worktree isolation
- guardrails on changed files / patch size
- CI as scoreboard
- explicit ownership boundaries in `agents/registry.yml`

Discard or rewrite:
- stale OpenClaw-specific execution assumptions in Python daemons
- hardcoded path sprawl
- direct dependence on dead/brittle cron residue in `.openclaw`
- fake progress loops that emit reports without successful execution
- any invocation path that still assumes deprecated CLI flags or missing imports

---

## Current failure map

### Failures observed in runtime

From `/Users/fortune/.openclaw/logs/`:
- `autonomous-loop.log` shows `error: unknown option '--task'`
- `signal-engine.log` shows `Spawn failed: No module named 'openclaw'`
- `autonomous-coder.log` shows repeated MiniMax `HTTP Error 404: Not Found`

### Structural repo drift in existing automation

From `scripts/autonomy/*`:
- hardcoded repo/worktree/log paths
- backend/frontend routing based on weak string matching
- mixed generations of autonomy scripts still coexisting
- scripts still shaped around earlier runtime assumptions

Examples:
- `scripts/autonomy/autonomous-loop.py`
- `scripts/autonomy/autonomous-coder.py`
- `scripts/autonomy/mutx-autonomous-daemon.py`
- `scripts/autonomy/mutx-gap-scanner.py`
- `scripts/autonomy/mutx-gap-scanner-v3.py`
- `scripts/autonomy/mutx-master-controller.py`

This is too much overlapping machinery.

---

## Desired execution model

## Layer 1 — Queue truth

Use one executable queue file or issue-derived queue snapshot.

Recommended policy:
- signals are advisory only
- the action queue is executable truth
- reports are read-only summaries

### Required properties
- every item has one owner lane
- every item has one source of status truth
- every item has one verification recipe
- every item can be replayed or released safely

---

## Layer 2 — Orchestrator lane (`main`)

`main` is responsible for:
- reading queue truth
- selecting lane by area/ownership
- preparing bounded work order
- selecting correct worktree
- launching worker with exact prompt contract
- capturing result and verification status
- deciding merge / retry / park / escalate
- writing one truthful report

`main` is not responsible for:
- doing implementation itself, except emergency/manual mode
- owning long-tail specialist prompts
- speculative task generation without queue truth

### Orchestrator interface

The orchestrator should emit a normalized work-order shape, for example:

```json
{
  "id": "issue-1234",
  "title": "tighten deployments route ownership checks",
  "lane": "codex",
  "repo": "/Users/fortune/MUTX",
  "worktree": "/Users/fortune/mutx-worktrees/factory/backend",
  "files_allowed": [
    "src/api/routes/deployments.py",
    "tests/api/test_deployments.py"
  ],
  "verification": [
    "pytest tests/api/test_deployments.py -v"
  ],
  "constraints": [
    "max_changed_files=6",
    "no schema drift without tests",
    "do not touch unrelated files"
  ]
}
```

---

## Layer 3 — Codex lane (`codex`)

Use Codex for:
- backend implementation
- API changes
- runtime/services work
- SDK fixes where backend parity matters
- structured code review handoff

### Important current status
Codex binary is installed and authenticated, but a live smoke test failed with quota/billing exhaustion.

Observed state:
- `codex --version` works
- `codex login status` shows authenticated
- `codex exec --sandbox read-only 'Reply with exactly: CODEX_OK'` failed with `Quota exceeded`

Interpretation:
- Codex lane is conceptually right
- Codex lane is not currently executable until quota/billing/auth capacity is restored

### Codex lane contract
When healthy, Codex should run only against:
- backend worktree
- bounded file ownership
- exact verification recipe
- strict diff limits

Suggested execution pattern:
- implementation prompt in backend worktree
- optional second Codex review pass after changes exist
- merge only after test contract passes

### Codex lane scope
Good:
- `src/api/**`
- `src/security/**`
- `cli/**`
- `sdk/mutx/**` when paired to backend truth
- backend tests

Bad:
- broad marketing/UI work
- queue mutation logic
- cross-lane speculative refactors

---

## Layer 4 — OpenCode lane (`opencode`)

Use OpenCode for:
- frontend implementation
- dashboard polish
- browser operator surface
- navigation and route-level UI work
- stable marketing/UI tasks where MiniMax speed is acceptable

### Current status
OpenCode is installed, authenticated, and working.

Observed state:
- `opencode --version` works
- `opencode auth list` shows configured credentials
- smoke test succeeded: `opencode run -m minimax/MiniMax-M2.7 'Reply with exactly: OPENCODE_OK'`

### ACP angle
OpenCode has a native `opencode acp` server entrypoint.
That is useful because it gives a cleaner path to a lane server than trying to keep the current broken OpenClaw control residue alive.

### Recommended OpenCode lane role
Use OpenCode as:
- the active frontend worker
- the first ACP-backed lane to operationalize cleanly
- the proving ground for a smaller, cleaner agent server pattern

### OpenCode lane scope
Good:
- `app/**`
- `components/**`
- `lib/**` where frontend-driven
- UI tests
- dashboard/marketing boundary cleanup

Bad:
- backend lifecycle semantics
- auth-sensitive server correctness unless tightly bounded
- queue truth mutation

---

## Lane protocol

Every worker invocation should receive exactly five things:

1. repo root
2. worktree path
3. bounded task description
4. allowed file scope
5. exact verification commands

If any of those are missing, the lane should reject the task.

### Worker success criteria
A worker run is only successful if it returns:
- changed files list
- concise summary
- verification command results
- branch/commit reference if applicable
- blocker reason if incomplete

Anything else is noise.

---

## Worktree policy

### Canonical layout

Use exactly these worktrees for the autonomous lanes:
- backend: `/Users/fortune/mutx-worktrees/factory/backend`
- frontend: `/Users/fortune/mutx-worktrees/factory/frontend`

If these are not valid, fix the worktree layout first. Do not let workers invent alternative paths.

### Worktree rules
- workers never operate on the root repo checkout directly
- workers never operate outside assigned worktree
- orchestrator can refresh/reset worktrees
- workers cannot rebase the world; they operate on bounded branch tasks

---

## Verification tiers

### Tier A — bounded lane verification
Smallest truthful test for the task.
Examples:
- one route test file
- one frontend unit test file
- one build check for touched UI surface

### Tier B — lane-wide verification
Used before PR/merge handoff.
Examples:
- relevant backend test subset
- frontend lint/build subset
- contract tests for affected SDK/API modules

### Tier C — scoreboard verification
Used by CI or merge gate.
Examples:
- repo CI
- release-required checks

Do not make every worker run Tier C by default.
That kills velocity.

---

## Reporting model

Replace vague status updates with one normalized report shape.

Recommended fields:
- `task_id`
- `lane`
- `status`
- `worktree`
- `changed_files`
- `verification_run`
- `verification_passed`
- `pr_ref`
- `blocker_class`
- `next_action`

### Allowed statuses
- `queued`
- `running`
- `blocked`
- `failed`
- `ready_for_review`
- `merged`
- `parked`

No vanity statuses.

---

## Migration strategy away from current `.openclaw` mess

This is the crucial part.

Do not try to "fix everything" in `.openclaw` first.
Instead:

### Step 1
Treat `.openclaw` as a lessons-and-state archive.
Do not let old cron residue and broken loops keep running the show.

### Step 2
Build the new shipping spine in repo-owned scripts/docs with explicit contracts.

### Step 3
Reuse only the parts of OpenClaw that are still useful:
- existing auth if still valid
- useful skills
- useful session knowledge
- stable workspace assets if clearly canonical

### Step 4
Stand up one clean lane at a time.

This is the difference between migration and archaeology.

---

## Immediate implementation sequence

### Phase 1 — prove operator truth
1. codify canonical queue truth
2. codify canonical worktree truth
3. codify lane contracts
4. freeze current `.openclaw` active automation

### Phase 2 — prove OpenCode lane first
Why first:
- auth works
- smoke test passed
- frontend lane is easier to constrain than repo-wide autonomy
- `opencode acp` is a usable server primitive

Deliverable:
- one successful frontend task from queue -> worktree -> verification -> report

### Phase 3 — restore Codex lane
Blocker:
- quota/billing exhaustion

Deliverable after auth fix:
- one successful backend task from queue -> worktree -> verification -> report

### Phase 4 — activate `main`
Once both workers can do one honest bounded task, let `main` orchestrate both.

---

## Concrete files likely to change in the implementation effort

### Planning / docs
- `docs/plans/2026-04-04-autonomous-dev-shop.md`
- `docs/autonomy-runbook.md`
- `agents/registry.yml`

### Existing scripts likely to be reduced or replaced
- `scripts/autonomy/autonomous-loop.py`
- `scripts/autonomy/autonomous-coder.py`
- `scripts/autonomy/mutx-autonomous-daemon.py`
- `scripts/autonomy/mutx-master-controller.py`
- `scripts/autonomy/execute_work_order.py`
- `scripts/autonomy/select_agent.py`

### Likely new scripts
- `scripts/autonomy/lane_runner.py`
- `scripts/autonomy/lane_contract.py`
- `scripts/autonomy/orchestrator_main.py`
- `scripts/autonomy/run_codex_lane.py`
- `scripts/autonomy/run_opencode_lane.py`
- `scripts/autonomy/report_status.py`

These names are suggestions, not mandates.

---

## What success looks like

You know this is working when:
- there are fewer active agents, not more
- there is one visible queue truth
- a single task can ship without manual babysitting
- reports reflect reality instead of aspiration
- stale logs and dead cron residue stop dominating the system
- frontend work reliably flows through OpenCode
- backend work reliably flows through Codex once quota is fixed
- `main` becomes a boring dispatcher, not a mythology engine

---

## Short verdict

The current OpenClaw environment taught the right lesson:

A dev shop for MUTX should be built from:
- fewer lanes
- harder contracts
- cleaner worktrees
- stricter reporting
- less magic

That is how you get real autonomous shipping velocity instead of autonomous hallucinated progress.
