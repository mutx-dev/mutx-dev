# Activation Guide

This repo is now set up with the team definitions and a GitHub-native control-tower scaffold. You do not need to run anything locally.

## What Is Already In Repo

- agent definitions under `agents/`
- ownership map in `agents/registry.yml`
- control-tower workflow in `.github/workflows/autonomous-shipping.yml`
- GitHub-hosted dispatcher in `.github/workflows/autonomous-dispatch.yml`
- scoped intake template in `.github/ISSUE_TEMPLATE/agent-task.yml`
- updated CI and PR template for truthful validation

## Smallest Real Deployment

1. Protect `main` in GitHub.
2. Enable auto-merge for PRs.
3. Create labels from `docs/autonomy/OPERATING_MODEL.md`.
4. Add repo variables for the hosted runner executor.
5. Add `GITHUB_MODELS_TOKEN` as a GitHub Actions secret for the default hosted executor, or set `AUTONOMY_EXECUTOR_SETUP_CMD` if your coding tool needs installation on the GitHub runner.
6. Optionally set `AUTONOMY_AGENT_CMD_TEMPLATE` in repo or org variables to override the default coding command.
7. Optionally set `AUTONOMY_OPEN_PR=true` if the executor should auto-commit, push, and open a draft PR when changes exist.
8. Let `.github/workflows/autonomous-dispatch.yml` claim `autonomy:ready` issues, generate a work order, and invoke the executor on `ubuntu-latest`.

## Hosted Runner Shape

- GitHub-hosted `ubuntu-latest`
- ephemeral checkout each run
- GitHub CLI authenticated with `GITHUB_TOKEN`
- Python 3.11 and Node 20 available in workflow

## Executor Variables

- `AUTONOMY_EXECUTOR_SETUP_CMD`: optional install/bootstrap shell command for the hosted runner
- `AUTONOMY_AGENT_CMD_TEMPLATE`: command template invoked after branch prep
- `AUTONOMY_OPEN_PR`: `true` or `false`
- `AUTONOMY_BASE_BRANCH`: optional, defaults to `main`
- `AUTONOMY_BRIEF_DIR`: optional, defaults to `.autonomy/briefs`
- `AUTONOMY_MODEL`: optional, defaults to `gpt-4.1-mini`
- `AUTONOMY_MAX_PATCH_BYTES`: optional, defaults to `50000`
- `AUTONOMY_MAX_CHANGED_FILES`: optional, defaults to `6`
- `AUTONOMY_REVIEWER_MAP`: optional JSON object mapping reviewer-agent ids to GitHub logins
- `AUTONOMY_STALE_CLAIM_MINUTES`: optional, defaults to `120`

## Required Secret

- `GITHUB_MODELS_TOKEN`: preferred for the default hosted executor in `scripts/autonomy/hosted_llm_executor.py`

## Optional Secret

- `OPENAI_API_KEY`: alternate provider for the same hosted executor if you do not use GitHub Models

Example:

```text
AUTONOMY_EXECUTOR_SETUP_CMD=pip install openai
AUTONOMY_AGENT_CMD_TEMPLATE=python scripts/autonomy/github_hosted_agent.py --agent {agent} --brief {brief} --work-order {work_order}
AUTONOMY_OPEN_PR=true
```

If `AUTONOMY_AGENT_CMD_TEMPLATE` is unset but `GITHUB_MODELS_TOKEN` or `OPENAI_API_KEY` is present, the workflow falls back to:

```text
python scripts/autonomy/hosted_llm_executor.py --agent {agent} --brief {brief} --work-order {work_order}
```

If a generated patch exceeds the configured size or file-count guardrails, or if model-suggested validation commands fall outside the executor allowlist, the executor stops, writes `.autonomy/guardrail-failure.json`, and records the checkpoint decision in `.autonomy/policy-checkpoints.json`.

If `AUTONOMY_REVIEWER_MAP` is set, the executor also assigns the mapped GitHub login to the PR and leaves a reviewer-routing comment.

When the executor opens or updates a PR, it also posts the required handoff comment: `@codex please review` (idempotent if already present).

If an issue stays labeled `autonomy:claimed` past `AUTONOMY_STALE_CLAIM_MINUTES` and no open PR exists for the claimed branch, the dispatch workflow automatically releases the claim and comments on the issue.

The dispatch workflow writes `autonomy-queue-health.json` each run and uploads it as a workflow artifact. It hard-fails when both open `autonomy:ready` issues and open PRs are zero, and logs a queue-handoff violation when ready issues exist but open PRs are zero.

## Dispatch Logic

Use `scripts/autonomy/select_agent.py` to map labels to a specialist and release lane.
Use `scripts/autonomy/build_work_order.py` to pick the highest-priority unclaimed issue and create an executor-ready work order.
Use `scripts/autonomy/execute_work_order.py` to create the branch, write the brief, optionally comment on the issue, invoke the hosted coding command, and optionally open a draft PR.

Example:

```bash
python scripts/autonomy/select_agent.py \
  --issue 123 \
  --labels autonomy:ready autonomy:safe area:cli-sdk risk:low size:s

python scripts/autonomy/build_work_order.py \
  --queue autonomy-queue.json \
  --output autonomy-work-order.json

python scripts/autonomy/execute_work_order.py autonomy-work-order.json
```

## Recommended First Automation

- let the orchestrator open or update a queue summary every 15 minutes
- let only 2 to 4 agents author code at first
- require reviewer assignment before merge
- auto-merge only `safe-auto-merge` lane changes

## Do Not Enable Yet

- unattended infra applies
- unattended auth-breaking changes
- unattended production migrations
- unattended runtime protocol rewrites

## Expansion Path

1. Stabilize CI truthfulness.
2. Let safe lanes auto-merge.
3. Add staging deployment gates.
4. Add a second reviewer agent for backend and runtime changes.
5. Expand the active pool to all 10 agents.
