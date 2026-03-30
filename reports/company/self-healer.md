# Self-Healer Log

## 2026-03-19 00:44 Europe/Rome
- Read fleet state + company roster. `reports/company/self-healer.md` did not exist yet, so this initializes the log.
- Cron scheduler health: enabled, store path healthy, 19 jobs loaded.
- 12-role company health: most company jobs are present and scheduled; several were actively running during inspection.
- Gateway/OpenClaw health:
  - `openclaw gateway status` probe OK
  - launch agent loaded, gateway bound on loopback `127.0.0.1:18789`
  - RPC probe OK
  - `openclaw status --deep` completed successfully
  - doctor warning only: Telegram group policy allowlist is configured with no allowed senders, so Telegram group messages would be silently dropped if Telegram were enabled (currently it is disabled, so this is non-blocking)
- Worker state (`workspace-x/worker_state.json`): no X runs yet, no rate-limit hits, no worker-state corruption.
- Legacy cron health:
  - disabled legacy X jobs still show the known old cron-shape schedule errors (`Cannot read properties of undefined (reading 'kind')`), but they remain disabled, so no repair needed tonight.
  - disabled legacy UI/main/healer jobs remain disabled; no flapping detected.
- Material issues found:
  1. `MUTX Backend Executor v1` timed out at the full 540s cron limit on its latest run (`cron: job execution timed out`). This is a real throughput risk if repeated.
  2. `MUTX CEO v1` and `MUTX CTO v1` both produced valid summaries but their latest runs failed final delivery with: `Discord recipient is required. Use "channel:<id>" for channels or "user:<id>" for DMs.` This looks like a delivery-target/config problem, not a model/runtime crash.
- Safe action taken: none yet beyond logging. I did **not** disable jobs or churn config on first sighting because:
  - CEO/CTO each have only 1 observed delivery failure so far
  - Backend Executor has only 1 observed timeout so far
  - disabled legacy jobs are already contained
- Fix plan for next pass if issues repeat:
  - If Backend Executor times out again, narrowly increase only that job's timeoutSeconds (e.g. 540 -> 900) instead of changing company-wide cadence.
  - If CEO/CTO delivery fails again, patch only those jobs with explicit announce targeting or convert them to file-only/no-announce behavior until recipient resolution is clear.
  - Keep Self-Healer focused on narrow per-job remediation, not broad gateway config churn.

## 2026-03-19 01:26 Europe/Rome
- Re-checked cron + gateway health after the next company wave.
- Cron scheduler is still healthy: enabled, 19 jobs loaded, no store corruption.
- Gateway/OpenClaw is still up and responsive:
  - `openclaw gateway status` OK, LaunchAgent loaded, RPC probe OK
  - `openclaw status --deep` shows Discord healthy and the gateway reachable locally
  - still only non-blocking warnings (`trustedProxies` unset for reverse-proxy use, possible multi-user exposure heuristic, Telegram allowlist warning while Telegram is disabled)
- Worker state re-check via `/Users/fortune/.openclaw/workspace-x/worker_state.json`: still clean (`rateLimitHits: 0`, no X errors, no corruption).
- Material update vs last note:
  1. The backend timeout did **not** repeat. `MUTX Backend Executor v1` recovered on the next run and shipped/pushed a real fix (`e3a2962`, UTC `Z` timestamp parsing across SDK resources/tests, 49 tests passed). So timeout escalation is not warranted yet.
  2. The delivery-target problem is broader than first observed. Recent runs for `MUTX PR Opener v1`, `MUTX Backend Executor v1`, and `MUTX PR Healer v2` all completed real work, wrote good summaries, and then still ended in cron `error` because delivery had no Discord recipient. Earlier CEO saw the same class of failure. This is now the main company-health issue.
  3. `MUTX CTO v1` and `MUTX CRO v1` currently show `ok` execution with `not-delivered`/`not-delivered`-style status rather than hard error, which reinforces that the core agent runs are mostly fine; the fragility is in announce routing, not model/runtime execution.
- Safe repair choice tonight: **no broad cron patch yet**. I did not flip all jobs to `delivery.mode=none` because the explicit company intent was to report back here, and I do not have a trustworthy Discord recipient id to hard-code from this isolated run.
- Narrow fix plan now:
  - preferred: patch company jobs with an explicit `delivery.channel`/`delivery.to` target once the correct Discord destination is known
  - fallback: if delivery errors keep compounding before the recipient is known, temporarily switch the affected jobs to file-only/no-announce so cron health reflects real execution instead of false-red delivery failures
  - continue leaving disabled legacy cron jobs disabled; they are noisy in metadata only and not flapping live work

## 2026-03-19 01:48 Europe/Rome
- Re-ran the health sweep. Cron is still healthy (`enabled`, 19 jobs loaded). Gateway is still up (`openclaw gateway status` OK, LaunchAgent loaded, RPC probe OK). `openclaw status --deep` still shows Discord healthy and only the same non-blocking warnings (`trustedProxies`, multi-user heuristic, Telegram allowlist while Telegram is off).
- X worker state is still clean via direct file read: no poster/engagement runs yet, `rateLimitHits: 0`, no stored errors.
- Material change since 01:26: the announce-routing issue is now clearly the dominant company-health failure mode, and it is repeating across most isolated roles.
  - Current cron state showed repeated false-reds on active company roles (`CEO`, `CFO`, `PR Opener`, `Auditor`, `Self-Healer`, `Researcher`, `PR Healer`, `Shipper`, `Backend Executor`) while summaries/runs indicate real work completed.
  - Evidence from run history: `Backend Executor` shipped real work on multiple consecutive runs (`e3a2962`, `03266fd`, `6a04e9f`) with passing targeted validation, but cron still recorded those runs as `error`/`unknown` delivery. `CEO` likewise produced substantive steering summaries while ending red.
  - The earlier 540s backend timeout remains a one-off. Newer backend runs finished inside the limit, so timeout is no longer the urgent problem.
- Safe repair applied now: switched the active isolated company jobs from `delivery.mode=announce` to `delivery.mode=none` for these job ids/names:
  - `MUTX PR Opener v1`
  - `MUTX Auditor v1`
  - `MUTX Self-Healer v1`
  - `MUTX Researcher v1`
  - `MUTX CEO v1`
  - `MUTX CTO v1`
  - `MUTX CFO v1`
  - `MUTX CRO v1`
  - `MUTX PR Healer v2`
  - `MUTX Shipper v2`
  - `MUTX Backend Executor v1`
- Why this is safe/narrow:
  - it does **not** change cadence, prompts, model, timeout, or repo behavior
  - it only removes the broken announce path that lacked an explicit Discord recipient and was making healthy runs look failed
  - company continuity still persists in `reports/company/*.md`, which is already the roster’s coordination path
- Follow-up plan:
  1. Watch the next wave; expected result is that these jobs stop going falsely red on delivery and reflect real execution status.
  2. Once the correct Discord destination is known, patch delivery back in explicitly with a real `delivery.channel`/`delivery.to` target instead of implicit announce routing.
  3. Keep disabled legacy jobs disabled; they remain contained metadata noise, not live flapping automation.

## 2026-03-19 02:04 Europe/Rome
- Re-checked after the delivery-mode fix. Good news first: the company-wide false-red delivery storm is basically gone. Current cron state shows the active isolated roles mostly landing as `ok`, so the earlier `announce`→`none` patch did what it was supposed to do.
- Cron scheduler is still healthy (`enabled`, 19 jobs loaded). Gateway/OpenClaw is still healthy (`openclaw gateway status` OK, LaunchAgent loaded, RPC probe OK; `openclaw status --deep` shows Discord healthy and only the same non-blocking warnings).
- X worker state is still clean (`rateLimitHits: 0`, no stored errors, no corruption).
- New material issue: `MUTX Backend Executor v1` is now the main unhealthy lane, but not because of the old timeout.
  - Its latest run history shows real shipped work and truthful validation (`b943679`, monitoring-related fixture/import repair, `33 passed`), yet cron still recorded the run as `error` and pushed the job into error/backoff state.
  - Session history shows a likely root cause: approval-guard / async-command fallout from large heredoc/python batch-edit commands (`approval-timeout (obfuscation-detected)`) is getting injected back into the run thread as follow-up system/user messages. That is poisoning the job’s final status even when the underlying code work succeeds.
  - The job is now the only active company role showing a real repeated unhealthy state (`consecutiveErrors: 5`), so this is worth a narrow intervention.
- Safe repair applied now:
  - patched **only** `MUTX Backend Executor v1`'s prompt to explicitly avoid giant heredoc/python batch-edit execs and approval-pending async commands, and to prefer small transparent steps + direct file edits.
- Why this is safe/narrow:
  - no cadence change
  - no model change
  - no repo/worktree reset
  - no disabling of the backend lane while it is still shipping useful fixes
  - just a prompt guardrail aimed at the exact failure pattern now showing up in session history
- Next watch item:
  1. If Backend Executor clears on the next wave, leave it alone.
  2. If it keeps error-backing off despite the prompt guardrail, the next safe move is to temporarily disable only that single job and leave a precise unblock plan rather than letting one poisoned lane chew retries.

## 2026-03-19 02:27 Europe/Rome
- Re-checked cron + gateway health. Cron scheduler is still healthy (`enabled`, 19 jobs loaded). Gateway/OpenClaw is still healthy (`openclaw gateway status` OK, LaunchAgent loaded, local RPC probe OK; `openclaw status --deep` still shows Discord healthy and only the same non-blocking warnings around `trustedProxies`, multi-user heuristic, and Telegram allowlist while Telegram is off).
- X worker state is still clean (`rateLimitHits: 0`, no stored errors, no corruption).
- Company-health delta since the 02:04 note:
  - the delivery-route repair is holding: the active isolated company roles are still landing mostly `ok` / `not-delivered` instead of false-red announce failures.
  - `MUTX Backend Executor v1` is **still the only active company role showing red cron state** (`consecutiveErrors: 5`, stale last error still points at `tests/conftest.py` edit failure), so it remains the single lane to watch.
- Material new evidence on that backend lane:
  - direct session history shows the worker did not just thrash; it found and fixed a real shared-test-setup regression in `tests/conftest.py` (missing async fixture imports like `create_async_engine`, `AsyncSession`, `sessionmaker`, `StaticPool`, `AsyncClient`, `ASGITransport`, etc.).
  - that fix was committed/pushed as `b943679` (`test: restore shared async fixture imports`).
  - truthful validation from the worker after the fix: `pytest -q tests/api/test_monitoring.py tests/test_sdk_deployments_contract.py tests/test_cli_webhooks_contract.py tests/test_sdk_webhooks_contract.py` → `33 passed`; `python -m compileall tests/conftest.py` passed.
- Self-healer action tonight: **no extra cron mutation yet**. Reason: the backend lane now has a concrete shipped repair and the current red cron state looks stale/lagging rather than proof of a fresh new failure. Disabling the job right now would be premature.
- Next watch item:
  1. If the next backend run flips back to `ok`, do nothing further.
  2. If cron keeps reporting the old red state after another cycle despite new successful work, treat it as execution-state poisoning/staleness and then disable only `MUTX Backend Executor v1` pending a clean re-enable plan.

## 2026-03-19 02:49 Europe/Rome
- Re-ran the health sweep after another company wave. Cron is still healthy (`enabled`, 19 jobs loaded). Gateway/OpenClaw is still healthy (`openclaw gateway status` OK, LaunchAgent loaded, RPC probe OK; `openclaw status --deep` still shows Discord healthy and only the same non-blocking warnings).
- The delivery-mode repair is still holding cleanly: the other active isolated company jobs now show `ok` / `not-delivered` instead of false-red delivery failures, and several were actively running during inspection.
- X worker state is still clean (`rateLimitHits: 0`, no stored errors).
- Material update: `MUTX Backend Executor v1` remains the **only** active unhealthy company lane, and it still has not cleared its stale red state:
  - cron still reports `lastStatus: error`, `consecutiveErrors: 5`, with the same old `tests/conftest.py` edit-failure message
  - recent run history still proves the lane is producing real value despite that red state (`e3a2962`, `03266fd`, `6a04e9f`, `b943679` with truthful targeted validation), so this looks more like execution-state poisoning/staleness than a dead worker
  - scheduler state now has its next run pushed out into backoff (`nextRunAtMs` significantly later than the normal 15-minute cadence), which means the lane is partially self-throttled already
- Safe action taken: no new cron mutation yet. I did **not** disable Backend Executor on this pass because that would also cut off the only live runtime/backend unblocker while it is still shipping useful fixes. The current safer stance is quarantine-by-backoff + monitoring.
- Precise next step if the stale red state survives one more backend cycle: disable only `MUTX Backend Executor v1`, leave a clean unblock note in this log, and require a fresh re-enable after the poisoned execution state is cleared.

## 2026-03-19 03:10 Europe/Rome
- Re-checked cron, run history, gateway health, and worker state. Scheduler/gateway health is still good: cron store healthy, `openclaw gateway status` OK, and `openclaw status --deep` still shows Discord healthy with only the same non-blocking warnings (`trustedProxies`, multi-user heuristic, Telegram allowlist while Telegram is disabled).
- X/aux worker-state checks are still clean. The workspace `ui-worker-state.json` still claims `mutx-ui-porting` is `active`, but that file is clearly stale historical residue rather than live scheduler truth.
- Material update since 02:49: the backend lane did survive another cycle in a poisoned red state, so the quarantine threshold was hit.
  - `MUTX Backend Executor v1` advanced from `consecutiveErrors: 5` to `consecutiveErrors: 6`.
  - Latest run history shows real useful work still shipped (`660c445` — `cli: add agent metrics and config commands`; targeted validation passed), but cron still ended the run as `error` with `⚠️ 📝 Edit: in ~/mutx-worktrees/factory/backend/cli/commands/agents.py ... failed`.
  - The same run summary also admitted the role cannot see `mutx-fleet-state.md` / `reports/company/ROSTER.md` from that checkout via relative paths, which is another prompt/environment mismatch to fix before re-enable.
  - The job had already slipped into extended backoff, so it was no longer behaving like a reliable 15-minute executor anyway.
- Safe repair applied now: disabled **only** `MUTX Backend Executor v1` to stop one flapping poisoned lane from burning retries and muddying company health while the rest of the company remains healthy.
- Precise unblock plan before re-enabling Backend Executor:
  1. rewrite that job prompt to reference shared company state/log files by **absolute workspace paths** instead of relative repo-local paths;
  2. keep the small-transparent-edits guardrail already added;
  3. start a fresh clean run after the stale poisoned execution thread is no longer being reused;
  4. re-enable only after one manual/observed clean pass confirms the lane can finish without tool-edit poisoning.
- Separate company-health note: `MUTX UI Executor v1` is still disabled and still has no `reports/company/ui-executor.md` role log, so there is currently no live dedicated UI executor lane. I did not mutate that job in this pass because it is not flapping live work; it remains a backlog/coordination issue, not an active scheduler-health incident.

## 2026-03-19 03:32 Europe/Rome
- Re-checked cron status/list, recent run history, gateway health, and the available worker-state files after the backend quarantine.
- Scheduler/gateway health is still good: cron remains enabled with 19 jobs loaded; `openclaw gateway status` and `openclaw status --deep` are still healthy apart from the same non-blocking warnings (`trustedProxies`, multi-user heuristic, Telegram allowlist while Telegram is disabled).
- The backend quarantine is holding exactly as intended:
  - `MUTX Backend Executor v1` is still disabled
  - no new backend flapping appeared after the disable
  - the last bad state is still the same stale tool-edit failure on `cli/commands/agents.py`, so there is no new evidence that would justify re-enabling it yet
- New company-health wrinkle: `MUTX Self-Healer v1` itself recorded a single red run right after the backend disable, but this looks narrow and non-destructive rather than a broader scheduler problem.
  - latest self-healer run summary shows the correct quarantine decision and re-enable plan
  - cron marked it failed only because appending to `reports/company/self-healer.md` hit an edit failure (`⚠️ 📝 Edit: in ~/.openclaw/workspace/reports/company/self-healer.md ... failed`)
  - current state already shows the next self-healer run active again, so this looks like a transient file-write collision / exact-match edit miss, not a dead lane
- Worker-state truth remains unchanged:
  - X worker state is still clean (`rateLimitHits: 0`, no stored errors)
  - `ui-worker-state.json` still claims `mutx-ui-porting` is `active`, but that file is stale historical residue and still does not match the live cron table, where `MUTX UI Executor v1` is disabled
- Safe action taken this pass: **no additional cron mutation**. The fleet is healthier after quarantining backend; the only new red was Self-Healer's own log-write failure, which is too narrow/transient to justify another config change.
- Next safe move only if it repeats: if Self-Healer logs another consecutive file-edit failure on the next completed run, patch only this job's prompt/write behavior (or simplify its log append path) rather than touching the broader company scheduler.

## 2026-03-19 03:58 Europe/Rome
- Re-checked cron status/list, targeted run history, gateway health, and worker-state truth.
- Scheduler/gateway health is still good: cron remains enabled with 19 jobs loaded; `openclaw gateway status` is healthy on loopback; `openclaw status --deep` still shows Discord healthy and only the same non-blocking warnings (`trustedProxies`, multi-user heuristic, Telegram allowlist while Telegram is disabled).
- Backend quarantine is still holding cleanly: `MUTX Backend Executor v1` remains disabled after the six poisoned red cycles, and there has been no new backend flapping since the quarantine.
- `MUTX UI Executor v1` is still disabled and unchanged. The separate `ui-worker-state.json` file still claims `mutx-ui-porting` is `active`, which is stale historical residue and does not match the live scheduler.
- New material company-health delta since 03:32: `MUTX PR Opener v1` is now the only red active company role.
  - Cron state shows `consecutiveErrors: 1` on PR Opener.
  - Run history shows the failure is narrow: the worker did real PR-opener work recently and then the latest run failed only on appending to `~/.openclaw/workspace/reports/company/pr-opener.md` (`⚠️ 📝 Edit ... failed`).
  - The prior PR Opener pass at 03:40 Europe/Rome logged cleanly, and the current `pr-opener.md` file is intact through that entry, so this looks like a one-off file-write collision / exact-match miss, not a poisoned execution lane.
- X worker state is still clean (`rateLimitHits: 0`, no stored errors).
- Safe action taken this pass: **no additional cron mutation**. I did not disable or patch PR Opener after a single narrow log-write failure because the fleet is otherwise healthy and this does not yet justify more churn.
- Precise next move only if it repeats: if PR Opener logs another consecutive `reports/company/pr-opener.md` edit failure on the next completed run, patch only that job’s write/logging behavior (for example, simplify the append path or reduce exact-match-sensitive log edits) rather than touching cadence or the broader company scheduler.

## 2026-03-19 04:13 Europe/Rome
- Re-checked the required health surfaces: `mutx-fleet-state.md`, roster, self-healer log, cron status/list, gateway/OpenClaw health, and failing worker state.
- Scheduler/gateway baseline is still solid: cron remains enabled with 19 jobs loaded; `openclaw gateway status` is healthy on loopback; `openclaw status --deep` still shows Discord healthy. The only warnings remain the same non-blocking ones (`trustedProxies`, multi-user heuristic, Telegram allowlist while Telegram is disabled).
- Material update since 03:58: `MUTX PR Opener v1` recovered on its next cycle and is now back to `lastStatus: ok` with `consecutiveErrors: 0`. That confirms the earlier red was a one-off log-write miss, not a flapping lane.
- Current live company-health truth is cleaner now:
  - all active 12-role company jobs are green except the intentionally disabled lanes
  - `MUTX Backend Executor v1` remains disabled with the same stale poisoned edit failure on `cli/commands/agents.py`; quarantine still looks correct
  - `MUTX UI Executor v1` remains disabled/absent as a live lane, so there is still no dedicated UI executor in the scheduler
- Failing worker state re-check is unchanged and clean for X: `rateLimitHits: 0`, no stored errors, no corruption in `/Users/fortune/.openclaw/workspace-x/worker_state.json`.
- Safe action taken this pass: **no cron mutation needed**. The only previously red active role recovered on its own, and the only remaining unhealthy role is the already-quarantined backend executor.
- Next intervention threshold stays the same: do not re-enable Backend Executor until its prompt/state-path mismatch is repaired with absolute workspace paths and one clean observed pass proves the poisoned execution thread is gone.

## 2026-03-19 05:31 Europe/Rome
- Re-ran the required sweep over fleet state, roster, self-healer log, cron health, recent run history, gateway/OpenClaw health, and the available worker-state files.
- Core scheduler/runtime health is still stable:
  - active company roles remain green (`PR Opener`, `PR Healer`, `Researcher`, `Shipper`, leadership roles) with no new flapping lane
  - `MUTX Backend Executor v1` is still intentionally disabled and unchanged since quarantine
  - `MUTX UI Executor v1` is still disabled and unchanged
  - gateway service / node service are still running, Discord is healthy, and the same prior non-blocking warnings remain (`trustedProxies`, multi-user heuristic)
  - failing worker-state re-check is still clean for X (`rateLimitHits: 0`, no stored errors)
- Material new blocker found during inspection: the **OpenClaw CLI reporting path** for `openclaw cron list --all` is currently buggy.
  - the command still prints the expected rows, including the disabled Backend/UI executor jobs
  - but it also emits `TypeError: Cannot read properties of undefined (reading 'kind')`
  - this looks like a CLI rendering/reporting bug rather than a scheduler-state bug, because the cron tool itself still reports healthy state and the rows printed are coherent
- Safe action taken this pass: **no cron mutation**. The company scheduler is healthy enough as-is; this new issue does not justify disabling or reconfiguring jobs.
- Precise fix plan:
  1. treat this as an OpenClaw CLI bug in the `cron list --all` rendering path, likely around a row with incomplete schedule metadata;
  2. reproduce outside Self-Healer with `openclaw cron list --all` and compare against the tool-level `cron list includeDisabled=true` output;
  3. patch only the CLI presentation layer to tolerate disabled/partial jobs instead of dereferencing `schedule.kind` blindly;
  4. keep scheduler configuration unchanged unless the tool-level cron API also starts showing corrupt job records.

## 2026-03-19 06:48 Europe/Rome
- Re-ran the required sweep over fleet state, roster, self-healer log, cron health, run history signals, gateway/OpenClaw health, and failing worker state.
- Scheduler/runtime baseline is still stable:
  - tool-level cron status is healthy (`enabled`, 19 jobs loaded)
  - active company roles remain green; `Self-Healer` was the only running role during inspection and the rest of the live company lanes were `ok`
  - `MUTX Backend Executor v1` remains intentionally disabled/quarantined with the same last poisoned edit failure on `cli/commands/agents.py`
  - gateway service is up on loopback, Discord is healthy, and the only warnings remain the same non-blocking ones (`trustedProxies`, multi-user heuristic, Telegram allowlist while Telegram is disabled)
  - failing worker-state re-check is still clean for X (`rateLimitHits: 0`, no stored errors)
- Material update since 05:31: the CLI-reporting bug is still reproducible right now. `openclaw cron list --all` still prints coherent rows but also emits `TypeError: Cannot read properties of undefined (reading 'kind')`, while the tool-level `cron list includeDisabled=true` output remains structurally healthy. So this still looks like a CLI rendering bug, not scheduler corruption.
- New actionable config drift found during the same compare:
  - the disabled `MUTX UI Executor v1` job was still carrying the **old** implicit announce delivery path (`delivery.mode=announce`) and still used **relative** state/log paths in its prompt
  - that is the same class of config mismatch that already produced false-red delivery and path issues elsewhere, so it was worth fixing before anyone re-enables the lane
- Safe repair applied now: patched **only** the disabled `MUTX UI Executor v1` job to:
  1. switch `delivery.mode` from `announce` to `none`, matching the rest of the isolated company roles;
  2. replace its relative state/log references with absolute workspace paths for `mutx-fleet-state.md`, `ROSTER.md`, and `reports/company/ui-executor.md`.
- Why this is safe/narrow:
  - the job is still disabled, so there is no live-behavior churn
  - cadence/model/timeout/worktree were unchanged
  - this is purely pre-flight hygiene so a future re-enable does not immediately inherit the already-known announce/path failure mode
- Current company-health truth after the patch:
  - live company remains healthy
  - Backend Executor is still the only quarantined flapping lane
  - UI Executor is still disabled and still has no role log yet, but its config is now less booby-trapped for eventual reactivation
- Next fix plan remains tight:
  1. keep Backend Executor disabled until its own prompt is converted to absolute paths and a clean observed pass proves the poisoned thread is gone;
  2. treat `openclaw cron list --all` as a separate CLI bug unless the tool-level cron API starts showing malformed jobs too.

## 2026-03-19 07:02 Europe/Rome
- Re-ran the required sweep over fleet state, roster, self-healer log, tool-level cron health, targeted run history, gateway/OpenClaw health, and failing worker state.
- Scheduler/runtime baseline is still stable:
  - tool-level cron status is healthy (`enabled`, 19 jobs loaded)
  - gateway service is still up on loopback; `openclaw gateway status` and `openclaw status --deep` both still show the same non-blocking warnings only (`trustedProxies`, multi-user heuristic, Telegram allowlist while Telegram is disabled)
  - X worker state is still clean (`rateLimitHits: 0`, no stored errors)
  - `MUTX Backend Executor v1` remains intentionally disabled/quarantined with the same last poisoned edit failure
  - `MUTX UI Executor v1` remains disabled, but its pre-flight config hygiene patch from the prior run is still in place
- Material update since 06:48: `MUTX CRO v1` is now the only red active company lane.
  - tool-level cron state shows `lastStatus: error`, `consecutiveErrors: 1`
  - targeted run history shows the run itself produced a substantive CRO summary, then failed only on appending to `~/.openclaw/workspace/reports/company/cro.md` (`⚠️ 📝 Edit ... failed`)
  - the prior CRO cycle was `ok`, so this currently looks like the same narrow file-write / exact-match miss class we already saw and recovered from on other roles, not a poisoned execution lane or scheduler issue
- Safe action taken this pass: **no cron mutation yet**. I did not disable or patch CRO after a single log-write failure because the rest of the company remains healthy and this does not justify more churn.
- Precise next move only if it repeats: if `MUTX CRO v1` records another consecutive `reports/company/cro.md` append failure on the next completed run, patch only that role’s log-write behavior (simpler append path / less exact-match-sensitive edits) and leave scheduler cadence/prompt scope alone.

## 2026-03-19 07:17 Europe/Rome
- Re-ran the required sweep over fleet state, roster, self-healer log, tool-level cron health/list, targeted CRO run history, gateway/OpenClaw health, and worker-state files.
- Scheduler/runtime baseline is still solid:
  - tool-level cron status is healthy (`enabled`, 19 jobs loaded)
  - `openclaw gateway status` is still healthy on loopback and `openclaw status --deep` still shows Discord healthy; same non-blocking warnings only (`trustedProxies`, multi-user heuristic, Telegram allowlist while Telegram is disabled)
  - X worker state is still clean in `/Users/fortune/.openclaw/workspace-x/worker_state.json` (`rateLimitHits: 0`, no stored errors)
  - `MUTX Backend Executor v1` remains intentionally disabled/quarantined
  - `MUTX UI Executor v1` remains disabled with the earlier absolute-path + `delivery.mode=none` pre-flight patch intact
- Material update since 07:02: `MUTX CRO v1` is still the only red active company lane, but the failure class changed and is more clearly transient provider-side noise than a broken prompt or file-write path.
  - tool-level cron state now shows `consecutiveErrors: 2`
  - targeted run history shows the immediately previous error was the expected narrow `reports/company/cro.md` append miss, but the newest failure is instead a provider/model-side `server_error` from Codex (`request ID 425f7fad-1fc8-41ed-aa7c-e15e46956d9b`)
  - because the two errors are from different causes (one local append miss, one upstream provider server error), this does **not** look like a single flapping poisoned lane that justifies disabling the job yet
- Separate tooling signal still reproduced: `openclaw cron list --all` continues to print coherent rows and then dies with `TypeError: Cannot read properties of undefined (reading 'kind')`, while the tool-level cron API remains healthy. This still looks like a CLI presentation bug, not scheduler corruption.
- Safe action taken this pass: **no cron mutation**. I did not disable or patch CRO after one append miss plus one upstream server error, and I did not churn scheduler config over the CLI rendering bug.
- Precise next moves:
  1. if CRO records a third consecutive failure with the **same** local append path, patch only CRO’s log-write behavior;
  2. if CRO records more provider `server_error` failures in a row, treat it as upstream instability and leave scheduler config alone unless it becomes a sustained backoff/flap;
  3. keep the `openclaw cron list --all` crash in the bucket of CLI-only bugs unless the tool-level cron API also starts showing malformed job data.

## 2026-03-19 07:32 Europe/Rome
- Re-ran the required sweep over `mutx-fleet-state.md`, roster, self-healer log, tool-level cron health/list, targeted run history, gateway/OpenClaw health, and failing worker-state truth.
- Scheduler/runtime baseline is still solid:
  - tool-level cron status remains healthy (`enabled`, 19 jobs loaded)
  - `openclaw gateway status` and `openclaw status --deep` are still healthy on loopback; same non-blocking warnings only (`trustedProxies`, multi-user heuristic, Telegram allowlist while Telegram is disabled)
  - X worker state is still clean via direct file read (`rateLimitHits: 0`, no stored errors)
  - `MUTX Backend Executor v1` remains intentionally disabled/quarantined with the same last poisoned edit failure
  - `MUTX UI Executor v1` remains disabled with the earlier absolute-path + `delivery.mode=none` pre-flight patch intact
- Material update since 07:17: `MUTX CRO v1` recovered on the next cycle and is now back to `lastStatus: ok` / `consecutiveErrors: 0`.
  - targeted run history confirms the prior provider-side `server_error` did **not** persist
  - latest CRO run finished `ok` in ~53s with normal `not-delivered` file-only behavior
  - that means the earlier CRO red was transient noise, not a flapping lane
- Separate tooling signal remains unchanged: `openclaw cron list --all` still prints rows and then dies with `TypeError: Cannot read properties of undefined (reading 'kind')`, while the tool-level cron API remains structurally healthy. This is still best treated as a CLI presentation bug, not scheduler corruption.
- Safe action taken this pass: **no cron mutation**. With CRO recovered, there is no new live company lane to disable or patch.
- Current company-health truth:
  - active company roles are green
  - Backend Executor remains the only quarantined executor lane
  - UI Executor remains disabled/inactive but pre-flight-cleaner than before
- Next intervention threshold stays tight:
  1. keep Backend Executor disabled until its prompt/state-path mismatch is repaired with absolute paths and one clean observed pass proves the poisoned execution thread is gone;
  2. keep treating `openclaw cron list --all` as a CLI-only bug unless the tool-level cron API also starts showing malformed job data.

## 2026-03-19 07:48 Europe/Rome
- Re-ran the required sweep over `mutx-fleet-state.md`, roster, self-healer log, tool-level cron health/list, targeted run history, gateway/OpenClaw health, and failing worker-state truth.
- Scheduler/runtime baseline is still solid:
  - tool-level cron status remains healthy (`enabled`, 19 jobs loaded)
  - `openclaw gateway status` and `openclaw status --deep` are still healthy on loopback; same non-blocking warnings only (`trustedProxies`, multi-user heuristic, Telegram allowlist while Telegram is disabled)
  - X worker state is still clean via direct file read (`rateLimitHits: 0`, no stored errors)
  - `MUTX Backend Executor v1` remains intentionally disabled/quarantined with the same last poisoned edit failure
  - `MUTX UI Executor v1` remains disabled with the earlier absolute-path + `delivery.mode=none` pre-flight patch intact
- Material update since 07:32: two active company lanes are red again, but both look like narrow single-cycle failures rather than live flapping automation.
  1. `MUTX CFO v1` is now `error` on its latest run after a local append miss to `~/.openclaw/workspace/reports/company/cfo.md` (`⚠️ 📝 Edit ... failed`). The prior CFO cycle was `ok`, so this currently matches the same one-off file-write/exact-match miss pattern other roles have already recovered from.
  2. `MUTX CRO v1` is now `error` on its latest run because the attempted Brave/web search step failed (`⚠️ 🔎 Web Search ... failed`). The immediately prior CRO cycle had already recovered to `ok`, so this does not look like sustained provider instability yet.
- Separate tooling signal is still unchanged: `openclaw cron list --all` continues to print coherent rows and then dies with `TypeError: Cannot read properties of undefined (reading 'kind')`, while the tool-level cron API remains structurally healthy. This still looks like a CLI presentation bug, not scheduler corruption.
- Safe action taken this pass: **no cron mutation**. I did not disable or patch CFO/CRO after one append miss and one search-step failure, and I did not churn scheduler config over the still-isolated CLI rendering bug.
- Precise next moves:
  1. if CFO records another consecutive `reports/company/cfo.md` append failure, patch only CFO’s log-write behavior;
  2. if CRO records another consecutive web-search failure, treat it as research-side provider/tool instability and leave scheduler config alone unless it starts sustained backoff/flapping;
  3. keep Backend Executor quarantined and keep the `openclaw cron list --all` crash bucketed as CLI-only unless tool-level cron data also goes bad.

## 2026-03-19 08:03 Europe/Rome
- Re-ran the required sweep over fleet state, roster, self-healer log, tool-level cron status/list, targeted run history, gateway/OpenClaw health, and failing worker-state files.
- Scheduler/runtime baseline remains healthy:
  - tool-level cron status is still healthy (`enabled`, 19 jobs loaded)
  - `openclaw gateway status` still reports the LaunchAgent loaded/running on loopback with RPC probe OK
  - `openclaw status --deep` still shows Discord healthy and only the same non-blocking warnings (`trustedProxies`, multi-user heuristic, Telegram allowlist while Telegram is disabled)
  - X worker state remains clean (`rateLimitHits: 0`, no stored errors)
- Material update since 07:48: both previously red active roles recovered on the very next wave.
  1. `MUTX CFO v1` is back to `lastStatus: ok` / `consecutiveErrors: 0`; targeted run history confirms the prior `reports/company/cfo.md` append miss did not repeat.
  2. `MUTX CRO v1` is back to `lastStatus: ok` / `consecutiveErrors: 0`; targeted run history confirms the prior web-search failure was transient and the latest run completed normally.
- Current company-health truth is therefore cleaner again:
  - all active company roles are green
  - `MUTX Backend Executor v1` remains the only quarantined flapping lane and should stay disabled until its prompt/state-path mismatch is rebuilt around absolute workspace paths plus one clean observed pass
  - `MUTX UI Executor v1` remains disabled/inactive, but its pre-flight absolute-path + `delivery.mode=none` cleanup is still in place
- Separate tooling signal remains unchanged: `openclaw cron list --all` is still believed to be a CLI-only presentation bug until the tool-level cron API itself shows malformed data.
- Safe action taken this pass: **no cron mutation**. Recovery happened without intervention, so the right move is to keep scheduler churn near zero and leave the existing backend quarantine in place.

## 2026-03-19 08:55 Europe/Rome
- Re-ran the required sweep over `mutx-fleet-state.md`, roster, self-healer log, tool-level cron health/list, targeted run history, gateway/OpenClaw health, and available worker-state truth.
- Scheduler/runtime baseline is still healthy:
  - tool-level cron status remains healthy (`enabled`, 19 jobs loaded)
  - `openclaw gateway status` and `openclaw status --deep` still show the gateway running on loopback, Discord healthy, and only the same non-blocking warnings (`trustedProxies`, multi-user heuristic, Telegram allowlist while Telegram is disabled)
  - the old CLI-only `openclaw cron list --all` rendering bug is still plausibly separate from the scheduler because tool-level cron output remains coherent
  - stale `ui-worker-state.json` still incorrectly claims `mutx-ui-porting` is active; that file remains historical residue, not live scheduler truth
- Material update since the 08:03 note: the user’s release-mode override is now reflected in the live scheduler, so the previously missing/quarantined execution lanes are no longer both dormant.
  1. `MUTX UI Executor v1` is now enabled and already proved healthy on its first clean wave after reactivation. It finished `ok` and pushed a real direct-to-main fix: `bfd5d981aff86317d4619bafe3e7f8ccda019b29` (`ui: normalize dashboard api error handling`). That specifically attacks the long-lived dashboard `401 -> [object Object]` symptom by normalizing structured API error parsing in the agents/deployments/dashboard clients.
  2. `MUTX Backend Executor v1` has also been re-enabled/force-enqueued by the operator-side release-mode restart, but its cron state is still carrying the old poisoned red history (`consecutiveErrors: 6`, last recorded edit failure on `cli/commands/agents.py`) even while a fresh run is currently active. This means the backend lane is now in supervised re-entry rather than true recovery.
- Safe action taken this pass: **no new cron mutation**.
  - I did not auto-disable Backend Executor again on the first restart wave because the re-enable was an explicit operator decision tied to the one-week shipping push, and there is not yet fresh evidence that the new run failed the same way.
  - I did not touch UI Executor because it has already demonstrated a clean green run post-reactivation.
- Tight next watch plan:
  1. if the fresh Backend Executor run lands `ok`, keep it live and treat the earlier quarantine as successfully cleared by supervised restart;
  2. if it immediately returns to the same edit-poisoning/error-backoff pattern, disable only that single job again and log the exact repeat signature;
  3. otherwise keep scheduler churn near zero and let the restored UI + backend execution core carry the release-mode push.

## 2026-03-19 09:25 Europe/Rome
- Re-ran the required sweep over fleet state, roster, the self-healer log, tool-level cron health/list, gateway/OpenClaw health, and failing worker-state files.
- Baseline scheduler/runtime health is still solid:
  - tool-level cron status is still healthy (`enabled`, 19 jobs loaded)
  - `openclaw gateway status` and `openclaw status --deep` still show the gateway healthy on loopback, Discord healthy, and only the same non-blocking warnings (`trustedProxies`, multi-user heuristic, Telegram allowlist while Telegram is disabled)
  - X worker state remains clean (`rateLimitHits: 0`, no stored errors)
  - stale `ui-worker-state.json` still disagrees with live cron state and remains historical residue only
- Material update since 08:55:
  1. `MUTX UI Executor v1` did not just survive re-entry; it shipped a second clean direct-to-main win. Latest run landed `4d9602047efb7a00c45b3518088e5319e0d8af2e` (`ui: make dashboard the canonical operator surface`) after truthful `npm run build` validation. So the restored UI lane is healthy and productive.
  2. `MUTX Backend Executor v1` failed supervised re-entry immediately. Its latest run hit the full 540s limit again (`lastErrorReason: timeout`), pushed `consecutiveErrors` to **7**, and moved the next attempt into extended backoff. That means the quarantine-clear hypothesis is false; the lane is flapping again, now as repeated timeouts rather than only edit-poisoning residue.
- Safe repair applied now: disabled **only** `MUTX Backend Executor v1` again via `openclaw cron disable 377ce51c-e4c7-45e4-8f20-d6c4ea2840d3`.
- Why this is safe/narrow:
  - no cadence/model churn across the rest of the company
  - no gateway/config churn
  - the UI lane and the rest of the active 12-role company remain healthy
  - it stops one repeatedly failing executor from burning cycles and muddying health while release-mode shipping continues through the working UI lane plus the other company roles
- Precise unblock plan before any next re-enable:
  1. patch Backend Executor’s prompt to use **absolute workspace paths** for shared state/log files instead of relative references;
  2. reduce per-run scope to one smaller backend slice that can realistically finish inside the 540s window, or only then consider a narrow timeout increase if the work is genuinely productive but bounded;
  3. require one observed clean pass before leaving the job enabled again.

## 2026-03-19 10:05 Europe/Rome
- Re-ran the required sweep over fleet state, roster, self-healer log, tool-level cron health/list + run history, gateway/OpenClaw health, and failing worker-state files.
- Baseline scheduler/runtime health is still good:
  - tool-level cron status is healthy and the scheduler has expanded from 19 to **23 jobs** after the release-mode/devshop expansion
  - `openclaw gateway status` is still healthy on loopback with RPC probe OK
  - the only recurring doctor warning is still the non-blocking Telegram allowlist warning while Telegram is disabled
  - X worker state remains clean in `/Users/fortune/.openclaw/workspace-x/worker_state.json` (`rateLimitHits: 0`, no stored errors)
  - stale `/Users/fortune/.openclaw/workspace/ui-worker-state.json` still incorrectly claims the old ui-porting worker is active; it remains historical residue, not live scheduler truth
- Material update since 09:25:
  1. the new release-mode lanes are now the main health watch. Two fresh jobs have already timed out once on their very first observed cycles:
     - `MUTX Dashboard Data Hardener v1` hit the full 540s limit and is `consecutiveErrors: 1`
     - `MUTX Release Verifier v1` hit the full 420s limit and is `consecutiveErrors: 1`
  2. `MUTX UI Executor v1` is not flapping broadly, but it did record a new single-cycle tool-edit failure while touching `app/dashboard/monitoring/page.tsx` (`consecutiveErrors: 1`).
  3. `MUTX PR Opener v1` also recorded a new single-cycle timeout (`420s`, `consecutiveErrors: 1`).
  4. The older backend quarantine is still correct: `MUTX Backend Executor v1` remains disabled at `consecutiveErrors: 7` and should stay out of rotation for now.
- Safe action taken this pass: **no new cron mutation yet**.
  - I did not disable the new timeouting jobs after only one observed miss each because that would be premature churn right after the devshop expansion.
  - I also did not touch UI Executor or PR Opener after single-cycle failures; neither has crossed the flapping threshold yet.
- Tight next intervention thresholds:
  1. if `Dashboard Data Hardener` or `Release Verifier` times out **again on the next completed run**, treat that as real flapping and patch only that job’s scope/timeout (or disable only that job if the prompt is clearly too large for its window);
  2. if `UI Executor` repeats the same tool-edit failure path, patch only its write/edit behavior instead of broad scheduler churn;
  3. if `PR Opener` records another consecutive timeout, narrow its per-run scan/update scope before considering any timeout increase;
  4. keep Backend Executor disabled until its re-entry plan is actually repaired and verified clean.
