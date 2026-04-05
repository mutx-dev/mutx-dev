---
description: Local-first run artifact schema for autonomous coding executions.
---

# Run Artifacts

MUTX autonomy runs now write a local-first run bundle under `.autonomy/runs/<run_id>/`.

This is inspired by Guild AI's run-directory model: keep the run inputs, command evidence, validation evidence, and generated artifacts together so a single directory explains what happened. This schema is MUTX-native and does not copy Guild AI code.

## Layout

Typical run bundle:

```text
.autonomy/runs/<run_id>/
  run.json
  inputs/work-order.json
  inputs/brief.md
  verification/receipt.json
  logs/agent-command.stdout.log
  logs/agent-command.stderr.log
  verification/01.stdout.log
  verification/01.stderr.log
  artifacts/prompt.md
  artifacts/generated.patch
  artifacts/last-response.json
  artifacts/policy-checkpoints.json
  artifacts/guardrail-failure.json
```

`run.json` is the canonical manifest. It records five required sections:

1. `params`: task and executor inputs such as issue, agent, lane, branch, labels, acceptance text, and active limits.
2. `command`: the resolved agent command, working directory, timestamps, exit code, and stdout/stderr artifact references.
3. `verification`: repo-native validation commands plus per-command pass/fail results, aggregate counts, and a durable receipt artifact path.
4. `artifacts`: a digest-backed manifest for copied inputs, generated files, and logs stored inside the run directory.
5. `provenance`: local-first execution context, including executor host details, `git_before`, `git_after`, and SHA-256 digests for copied input artifacts.

When executor checkpoints run, the artifact set may also include `artifacts/policy-checkpoints.json`. It records explicit allow or deny decisions for high-risk execution boundaries such as patch application and validation execution, along with the applied limits and rejected commands.

`verification/receipt.json` is the fast inspection surface. It summarizes the overall run status, the verification verdict, the aggregate command counts, and direct references to the backing evidence artifacts such as verification logs, input copies, command logs, checkpoint records, and guardrail failures. The executor refreshes this receipt again during finalization so failed or skipped validation still leaves a durable receipt.

## Example

```json
{
  "schema_version": "mutx.autonomy.run/v1alpha1",
  "run_id": "issue-123-20260404T101530Z",
  "status": "completed",
  "params": {
    "issue": 123,
    "agent": "control-plane-steward",
    "branch": "autonomy/control-plane-steward/issue-123-fix-routes"
  },
  "command": {
    "status": "succeeded",
    "argv": [
      "python",
      "scripts/autonomy/hosted_llm_executor.py",
      "--agent",
      "control-plane-steward"
    ],
    "stdout_artifact": "logs/agent-command.stdout.log"
  },
  "verification": {
    "status": "passed",
    "commands": [
      "python3 -m compileall scripts/autonomy"
    ],
    "summary": {
      "command_count": 1,
      "completed_count": 1,
      "passed_count": 1,
      "failed_count": 0,
      "not_run_count": 0,
      "stopped_early": false
    },
    "receipt_artifact": "verification/receipt.json"
  },
  "artifacts": [
    {
      "name": "work_order",
      "kind": "input",
      "path": "inputs/work-order.json"
    }
  ],
  "provenance": {
    "capture_mode": "local-first",
    "git_before": {
      "branch": "autonomy/control-plane-steward/issue-123-fix-routes"
    }
  }
}
```

## Notes

- The run directory is meant to be durable even when `.autonomy/prompts/latest.md` or `.autonomy/last-response.json` are overwritten by later executions.
- Provenance is intentionally local-first: it captures the local work order, brief, command, git state, and verification evidence before any optional PR or workflow artifact handoff.
- The receipt is evidence-first rather than prose-first. It is meant to answer "what ran, what proved it, and what was the verdict?" without reconstructing that from the full manifest by hand.
- Full source-tree snapshots are not part of `v1alpha1`. The schema keeps commit and worktree provenance now and leaves full source capture for a later version if needed.
- The checkpoint artifact is MUTX-native. It borrows the idea of policy-gated execution checkpoints from the open-source LACP harness model without copying upstream code.
