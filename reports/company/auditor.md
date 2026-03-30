# MUTX Auditor — 2026-03-19 00:42 Europe/Rome

## Critical

Newest landed change audited: **PR #1086** — `feat(ops): add self-healing for common failure modes`  
Merged to `main` as `2293e930` at 23:37 UTC.

### 1) Main is red immediately after merge
This landed straight into a broken `main` state.

Failed post-merge lanes on the merged SHA:
- `CI` ❌
- `Infrastructure Validation` ❌
- `Infrastructure CI` ❌
- `Monitoring Config Validation` ❌
- `Terraform Validation` ❌
- `Validation` ❌

Two failures are especially blunt:
- `Validation` is still failing on repo formatting drift (`src/api/main.py`, two migrations, `src/api/services/monitoring.py`). Not introduced by #1086, but still means the merge was not green.
- `Monitoring Config Validation` failed with `prometheus: error: unexpected promtool` — the validation command/path is wrong as executed in CI, so the new monitoring change did not land with a truthful green check.

### 2) The “self-healing” wiring is mostly aspirational, not real yet
The diff adds alert labels + shell scripts, but the end-to-end path is not actually wired in a trustworthy way.

Findings:
- `alertmanager.yml` routes critical alerts to `http://host.docker.internal:3000/api/heal`
- I could not find a matching live handler for `/api/heal` in the repo
- several scripts are placeholders, not production behavior:
  - `self-heal-queue.sh` only logs and returns success
  - `self-heal-webhook.sh` only probes a URL; it does not re-drive delivery from durable state
- the new `self_heal` labels are not what Alertmanager routes on; routing is based on `severity="critical"` and `notify="webhook"`, so some labels look decorative today
- some alerts claim healing in the description, but their route would not actually trigger healing as written

Bottom line: this PR **improves intent/docs**, but it does **not** yet make self-healing a truthful product behavior.

### 3) Regression / ops risk
If `/api/heal` gets wired later exactly as implied by these scripts, the current approach is still risky:
- container/db/redis restart targets are not visibly allowlisted
- webhook healing accepts arbitrary URL input and performs outbound `curl`
- queue healing has no real queue implementation or safety checks

That is not an active exploit from this diff alone, but it is clear security/ops debt if someone wires it up naively.

## Small actionable next moves
1. **Do not describe #1086 as shipped self-healing.** Describe it as scaffolding / alert-labeling + draft scripts.
2. **Fix or disable the broken monitoring validation command** before treating the lane as signal.
3. **Add a real `/api/heal` implementation or remove the route from Alertmanager config** until it exists.
4. **Replace placeholder scripts with truthful no-op docs or real implementations** for queue/webhook healing.
5. **Gate any future healer endpoint with an allowlist** for actionable targets before it can restart anything.

## Verdict
Small scope, sharp truth: **#1086 landed red and oversells runtime self-healing.** Good direction, not truthful completion yet.

---

# MUTX Auditor — 2026-03-19 01:20 Europe/Rome

## New landed change audited
Newest landed change since the last note: **`63a58923`** — `ui: make app host the canonical dashboard surface`

## What is true
This commit materially improves the split-brain app/marketing routing story:
- marketing host auth links now point at `app.mutx.dev`
- `app.mutx.dev/` redirects to `/dashboard`
- legacy `/app/*` routes canonicalize into `/dashboard/*`
- targeted routing tests were added for the main redirect cases

## Risks / gaps
1. **Main is still not green on this landed SHA.**
   - GitHub `Validation` failed again on the same repo-wide formatting drift (`src/api/main.py`, two migrations, `src/api/services/monitoring.py`)
   - This does **not** look introduced by `63a58923`, but the change still landed onto a red `main`

2. **Canonicalization is only partially explicit.**
   - The direct map covers a few legacy `/app/*` paths, then falls back to a generic `/dashboard${rest}` rewrite
   - That is fine for many paths, but it can also canonically redirect users into dashboard routes that may not actually exist or be the intended destination yet

3. **Production hostnames are hardcoded in app UI entrypoints.**
   - `app/page.tsx` and `components/AuthNav.tsx` now hardcode `https://app.mutx.dev/...`
   - Good for prod truth, but this is brittle for staging/preview/alternate-host setups unless that coupling is intentional

## Regression / security read
- No obvious auth bypass or open redirect jumped out from this diff
- Host handling is narrow and allowlisted (`mutx.dev`, `www.mutx.dev`, `app.mutx.dev`), which is the right shape
- Biggest practical risk is routing drift / unexpected 404s from the generic `/app/*` → `/dashboard/*` fallback, not a security break

## Actionable next moves
1. **Do not call this fully green-shipped routing cleanup yet** while `main` validation is still red
2. **Add one more test pass for legacy paths with no 1:1 dashboard twin** to catch accidental canonicalization-to-404 behavior
3. **Decide whether hardcoded app host URLs should move to config/env** before more host-aware UI logic accumulates

## Verdict
`63a58923` is a **truthful directional fix** for the app-host split, with **moderate regression risk around incomplete path mapping**. Good change, but it still landed on a red trunk.

---

# MUTX Auditor — 2026-03-19 01:44 Europe/Rome

## Highest-priority open PR audited
Open priority lane since the last note: **PR #1183** — `feat(cli,sdk): expand deployment parity and webhook ops`

## What is true
This is a **real, small backend/operator-contract slice**, not fake surface area:
- adds CLI commands for deployment `versions` + `rollback`
- adds CLI webhook CRUD/test/operator commands against the live `/v1/webhooks*` routes
- adds SDK deployment helpers for `versions` / `rollback`
- rewrites docs toward the actual raw `/v1` response shapes instead of the older invented envelope docs
- targeted contract tests exist for the touched CLI/SDK paths

## Findings
### 1) The branch is blocked by validation, and some of that red is self-inflicted
Current GitHub `Validation` is failing on:
- `cli/commands/deploy.py`
- `sdk/mutx/deployments.py`
- plus the pre-existing repo drift in `src/api/main.py`, two migrations, and `src/api/services/monitoring.py`

That matters because this is **not** just trunk already being red — this PR currently adds fresh formatting debt in touched files.

### 2) SDK rollback parity is still incomplete in a quiet but important way
The PR adds `Deployments.rollback()` / `arollback()`, but the SDK `Deployment` model still does **not** expose a `version` field even though deployment responses include one and the CLI prints it.

Consequence:
- CLI rollback output can show the restored version
- SDK rollback callers cannot read `deployment.version` from the typed object
- the new SDK tests only assert `id` + `status`, so this drift is currently unguarded

That is a small but real truthfulness gap in a PR whose whole point is contract parity.

### 3) Risk is moderate, not scary
I did **not** see an obvious security break in this slice.
- webhook commands stay on authenticated user-owned routes
- docs are moving closer to live server behavior, not farther away
- biggest practical risk is contract drift / “parity” being claimed before the SDK object model fully reflects the response

## Small actionable next moves
1. **Run formatter on the touched Python files before merge** (`cli/commands/deploy.py`, `sdk/mutx/deployments.py`).
2. **Add `version` to the SDK `Deployment` model** so rollback/version parity is actually complete.
3. **Add one SDK assertion for rollback/version mapping** so this does not regress quietly.

## Verdict
`#1183` is a **good narrow parity lane**, but it is **not merge-ready yet**: validation is red in touched files, and the SDK still hides the very deployment version field this PR is supposed to make more truthful.

---

# MUTX Auditor — 2026-03-19 02:00 Europe/Rome

## Update on the active priority lane
PR `#1183` moved again since the last note:
- `6a04e9f` — `cli: add webhook operator commands`
- `b943679` — `test: restore shared async fixture imports`

## What materially changed
1. **The PR got broader, but not greener.**
   - Fresh CI reran on `b943679`.
   - `Validation` still fails immediately.
   - The failure remains partly self-inflicted: the touched files `cli/commands/deploy.py` and `sdk/mutx/deployments.py` still need formatting, alongside the already-red trunk files.

2. **The earlier deployment-parity gap is still real.**
   - `Deployments.rollback()` still returns a `Deployment` object with no exposed `.version` field.
   - So the branch now documents and prints version-aware rollback behavior, but the typed SDK object still drops that field.

3. **A new security/quality smell is now more visible in the webhook slice.**
   - The live webhook API schema (`WebhookResponse`) includes `secret` on create/list/get/update responses.
   - This PR's docs normalize that shape instead of challenging it.
   - That is not a cross-user auth bug, but it is still bad secret hygiene: webhook secrets are being re-exposed after creation, which increases accidental logging/clipboard/history leakage for no real operator benefit.

## Small actionable next moves
1. **Do not merge #1183 yet.** It is still red in touched files.
2. **Finish the parity claim properly** by adding `version` to the SDK `Deployment` model and asserting it in rollback/version tests.
3. **Stop echoing webhook secrets back in normal resource reads** (or at minimum stop documenting that as the intended steady-state contract).

## Verdict
`#1183` is still a useful narrow lane, but the newest update mostly **expanded scope without closing the truthfulness gap**. The sharpest newly-visible risk is **secret re-exposure in the webhook contract**.

---

# MUTX Auditor — 2026-03-19 02:23 Europe/Rome

## New landed change audited
Newest landed change since the last note: **PR #1084** — `feat(runtime): add agent execution timeout enforcement`
- merged to `main` as `338dd7fe` at 01:20 UTC

## What is true
This is a real runtime slice, not fake surface area:
- adds `timeout` parameters to runtime `execute()` / `stream()`
- adds `timed_out` markers to `RuntimeResult` and stream events
- introduces OpenAI adapter config knobs for `default_timeout` and `max_timeout`
- actually wraps OpenAI completion calls with `asyncio.wait_for(...)`

## Critical findings
### 1) It landed on a red branch again
Post-merge `main` is immediately red on `338dd7fe`.

Failed lanes on the merged SHA:
- `Validation` ❌
- `Infrastructure Validation` ❌
- `Infrastructure CI` ❌

The current `Validation` failure is still the familiar repo-wide formatting drift, not obviously introduced by this PR:
- `src/api/main.py`
- `src/api/models/migrations/versions/3a8f2b1c4d6e_add_meta_data_to_agent_logs.py`
- `src/api/models/migrations/versions/f7e2a1c8d9b4_add_usage_events_table.py`
- `src/api/services/monitoring.py`

So this PR did **not** obviously break validation itself — but it was still merged while red, which keeps degrading trunk signal.

### 2) "Timeout enforcement" is only partially true for non-streaming runs
The implementation applies the full `timeout` separately to each phase inside `execute()`:
- one `wait_for(...)` around `_create_completion(...)`
- another `wait_for(...)` around `_append_tool_results(...)`
- repeated across tool-call roundtrips

Consequence: a caller asking for `timeout=30` does **not** actually get a strict 30-second cap on the whole execution. A multi-roundtrip tool run can exceed that budget by a lot because the timer resets per phase/roundtrip.

That is a truthfulness gap in a PR explicitly claiming runtime timeout enforcement.

### 3) Sync tool handlers are not actually timeout-safe
`_append_tool_results(...)` calls the tool handler directly before checking whether the result is awaitable.

That means a synchronous/blocking tool handler can stall the event loop inside the coroutine. In that case, wrapping `_append_tool_results(...)` in `asyncio.wait_for(...)` does **not** reliably preempt the blocking work.

Bottom line: the current timeout path is much stronger for model API waits than for local tool execution.

### 4) The new timeout contract is oddly soft / half-wired
The PR adds `ExecutionTimeoutError`, but the adapter does not raise it.
Instead:
- non-streaming `execute()` sets `timed_out = True` and returns a partial-ish result
- streaming emits a `{ "type": "timeout" }` event

That may be a valid design, but it means the new exception class is currently decorative, and callers now need to know two different timeout signaling shapes.

## Regression / security read
- No obvious auth or data-exposure bug jumped out from this diff
- Main risk is **operator truthfulness + runtime semantics**, not classic security
- The sharpest practical regression risk is downstream callers assuming `timeout` means end-to-end enforcement when it currently means something closer to **per awaited phase**

## Small actionable next moves
1. **Do not describe #1084 as full end-to-end timeout enforcement yet.** Call it first-pass timeout plumbing for the OpenAI adapter.
2. **Enforce one wall-clock budget across the whole `execute()` lifecycle**, not one fresh budget per roundtrip/phase.
3. **Handle blocking sync tool handlers explicitly** (thread offload, subprocess, or documented non-support) if timeout guarantees matter.
4. **Choose one timeout contract**: either raise `ExecutionTimeoutError` consistently or drop the unused exception and document the `timed_out` result/event path clearly.
5. **Stop merging onto red `main`** even when the red appears pre-existing; trunk signal is getting noisier, not better.

## Verdict
`#1084` is a **useful first pass**, but the current implementation **oversells timeout enforcement**. Right now it enforces timeout on some awaited phases, not reliably on the full runtime execution path.

---

# MUTX Auditor — 2026-03-19 02:38 Europe/Rome

## New landed change audited
Newest landed change since the last note: **PR #1090** — `feat(ci): add test coverage thresholds check`
- merged to `main` as `cb576257` at 01:36 UTC

## What is true
This change adds a **real new gate**, not fake theater:
- new `Coverage Check` job in `.github/workflows/ci.yml`
- Python coverage run with `pytest-cov`
- frontend Jest coverage thresholds
- coverage artifacts upload for debugging

That is directionally good. The repo needed a harder signal than vibes.

## Critical findings
### 1) It landed red immediately
Post-merge `main` is red on the merged SHA.

Fresh failures on `cb576257`:
- `Coverage Check` ❌
- `Validation` ❌
- `Infrastructure Validation` ❌
- `Infrastructure CI` ❌

So this is now another "merged while red" event, just with a new lane added to the pile.

### 2) The new coverage lane immediately exposed a real broken test bootstrap
The sharpest failure is **not** coverage percentage. The job dies before it can even measure coverage:
- `tests/conftest.py:133`
- `NameError: name 'AsyncSession' is not defined`

That means the new job surfaced a truthful repo break: API test bootstrap on `main` is currently busted. Good signal, bad landing hygiene.

### 3) The PR claim is broader than the implemented guardrail
The PR is framed as a general "test coverage thresholds check," but the Python side currently runs only:
- `python -m pytest tests/api --cov --cov-fail-under=70 --maxfail=1 -q`

So the gate is really **API-test coverage**, not broad backend/CLI/SDK coverage. That may be acceptable, but it should be described narrowly or expanded later.

### 4) It still merged onto already-red trunk
`Validation` is still failing on the same pre-existing formatting drift:
- `src/api/main.py`
- `src/api/models/migrations/versions/3a8f2b1c4d6e_add_meta_data_to_agent_logs.py`
- `src/api/models/migrations/versions/f7e2a1c8d9b4_add_usage_events_table.py`
- `src/api/services/monitoring.py`

So even if the new coverage lane is useful, it was introduced into a trunk whose signal is already degraded.

## Regression / security read
- No obvious security regression in this diff
- Main risk is **quality/process truthfulness**, not data exposure
- Practical regression risk: developers now get one more failing lane, but without first restoring a green baseline the new gate adds noise as well as signal

## Small actionable next moves
1. **Fix `tests/conftest.py` on `main` first** so the new lane can measure coverage instead of crashing at import time.
2. **Stop describing #1090 as broad repo coverage enforcement**; today it is narrower than that on the Python side.
3. **Un-red trunk before adding more gates** or the repo will keep accumulating truthful checks inside an untruthful merge policy.
4. **Keep the coverage job** — the failure is useful signal — but don’t pretend this landed cleanly.

## Verdict
`#1090` is a **good gate added the wrong way**: it immediately proved `main` test bootstrap is broken, but it also became one more red lane merged onto an already-red trunk.

---

# MUTX Auditor — 2026-03-19 03:27 Europe/Rome

## Fresh priority PR update audited
PR **#1153** moved since the last note. It is currently titled **`fix(ops): add Homebrew tap and formula for CLI distribution`**.

## Critical findings
### 1) The branch is polluted enough that the title is no longer truthful
The current PR payload is **not** just Homebrew tap work.

Files now include:
- `src/runtime/adapters/anthropic.py`
- `src/runtime/adapters/openai.py`
- new `src/runtime/circuit_breaker.py`
- `tests/api/test_deployments.py`
- `tests/conftest.py`
- large `tests/test_sdk_agent_runtime_contract.py` changes
- `docs/cli.md`

That means a PR presented as CLI distribution work is now also smuggling runtime-adapter refactors, circuit-breaker behavior, and unrelated test churn. This is branch-hygiene failure, not a clean fix lane.

### 2) CI red is not the main problem anymore — truthfulness is
Current failures on the fresh head `789aadab` are:
- `Validation` ❌ — still only the pre-existing trunk formatting drift (`src/api/main.py`, two migrations, `src/api/services/monitoring.py`)
- `Coverage Check` ❌ — **269 tests passed**, but total coverage is only **29.96%** vs required **70%**

Important nuance: the latest `tests/conftest.py` import fix did repair the earlier hard crash. The lane now reaches real test execution. So this update improved one thing — but it also made the branch broader and less truthful.

### 3) Coverage gate now exposes a bad repo/process mismatch
This PR adds/changes plenty of non-API code (`cli/*`, `sdk/*`, `src/runtime/*`), but the coverage job is still only running `pytest tests/api --cov ...`.

Result:
- changed CLI/SDK/runtime files all show **0% coverage** in the report
- the PR cannot realistically satisfy the gate as structured
- the repo is pretending to enforce broad coverage while only executing API tests

That is now an active workflow-design bug, not just background noise.

### 4) Regression risk is moderate because runtime behavior changed inside an ops/CLI lane
The new shared circuit-breaker module and adapter rewiring may be good directionally, but they do **not** belong hidden inside a Homebrew/CLI-distribution PR.
If this merges as-is, later debugging will be miserable because runtime behavior changes will be attributed to the wrong lane.

## Small actionable next moves
1. **Do not merge #1153 as currently shaped.**
2. **Split the PR by concern**: Homebrew/CLI distribution vs runtime circuit-breaker refactor vs test fixes.
3. **Rename the PR if it is intentionally broader** — current title/body materially understate the payload.
4. **Fix the coverage workflow design** if repo policy is meant to gate changed CLI/SDK/runtime code; right now the gate is structurally mismatched to the work.

## Verdict
Sharp truth: **#1153 is now a polluted branch wearing the wrong label.** The conftest import fix made CI more honest, but the PR itself became less honest.

---

# MUTX Auditor — 2026-03-19 03:42 Europe/Rome

## Fresh priority PR update audited
PR **#1183** moved into a broader shape on head **`660c445`** — still titled **`feat(cli,sdk): expand operator contract parity`**.

## What materially changed
This lane is no longer just deployment rollback/version parity + webhook ops.
It now also adds:
- `mutx agents metrics`
- `mutx agents config`
- `mutx agents update-config`

So the PR is still coherent enough to be a backend/operator-contract slice, but it is broader than the earlier auditor notes.

## Findings
### 1) Validation red is now more self-inflicted than before
Fresh CI on `660c445` still fails `Validation`, and the formatter now flags **three touched files** from this PR:
- `cli/commands/agents.py`
- `cli/commands/deploy.py`
- `sdk/mutx/deployments.py`

That is on top of the already-red trunk files. So this lane is not just being splashed by background repo drift anymore; it is carrying its own avoidable formatting debt.

### 2) The coverage gate is structurally mismatched to this PR
Fresh `Coverage Check` on the branch reports:
- **266 passed**
- **29.12% total coverage** vs required **70%**

That failure is not mainly telling us this PR is low-quality. It is telling us the workflow design is wrong for this kind of change.
The job still measures only Python API-test coverage, while this PR mainly changes:
- CLI commands
- SDK client code
- docs

So the lane can add real contract tests for the touched surfaces and still fail the repo gate by a mile. That is now a truthful workflow-design bug, not just a one-off noisy failure.

### 3) New secret-hygiene risk: agent config is echoed straight to stdout
The newly added CLI paths print the full agent config payload back to the terminal:
- `mutx agents config`
- `mutx agents update-config`

If agent configs contain provider keys, webhook secrets, or other credentials, this normalizes cleartext secret exposure into terminal scrollback, shell capture, support screenshots, and copied logs.
I did **not** confirm an active cross-user auth bug here — this is an operator-hygiene problem — but it is a real quality/security smell in a PR that is trying to improve truthful operator tooling.

## Small actionable next moves
1. **Run formatter before any more parity claims** on `cli/commands/agents.py`, `cli/commands/deploy.py`, and `sdk/mutx/deployments.py`.
2. **Fix the coverage workflow shape** or exempt this lane from the wrong gate; today it is measuring the wrong surface.
3. **Redact known secret fields in agent config output by default** and require an explicit flag to reveal sensitive values.

## Verdict
`#1183` still looks like a useful operator-contract lane, but the newest update exposed two sharp truths: **the gate is judging the wrong thing, and the new agent-config UX risks printing secrets in the clear.**

---

# MUTX Auditor — 2026-03-19 04:01 Europe/Rome

## Fresh priority PR audited
PR **#1173** moved after the last auditor note. It is still a **draft** and currently titled:
**`Fix redundant ErrorBoundary nesting, async email blocking, analytics event name, JWT logout docs, email enumeration, and missing test imports`**

## Sharp findings
### 1) The PR claims more auth correctness than it actually delivers
It says it fixes **async email blocking**, but the branch only wraps email sending in `run_in_executor(...)` for **registration**.
The other auth email paths are still synchronous/blocking in request handlers:
- `forgot_password()` still calls `send_password_reset_email(...)` directly
- `resend_verification()` still calls `send_verification_email(...)` directly

So this is **partial mitigation**, not a truthful fix for the broader blocking-email problem the PR title/body imply.

### 2) The analytics “fix” is only half-fixed
In `register()`, the PR changes:
- `event_name` from **`User logged in`** → **`User registered`** ✅

But it leaves:
- `event_type=AnalyticsEventType.USER_LOGIN`

That means dashboards/queries keyed on event type will still classify registrations as logins. The human-readable string got corrected; the semantic event contract did not.

### 3) The test-infra repair is sloppy enough to help explain red validation
The `tests/conftest.py` “missing imports” patch now contains duplicated imports instead of a clean repair:
- `FastAPI` imported twice
- `pytest` imported twice
- `pytest_asyncio` imported twice

That is not catastrophic, but it is exactly the kind of low-discipline patch that turns a legit fix into self-inflicted lint/format churn.

## Risk read
- **Security direction is mostly good:** returning the same success message from `/resend-verification` is the right anti-enumeration move.
- **Main risk is truthfulness + merge hygiene:** this PR bundles a couple of real fixes with partial and sloppy ones, while CI is already noisy.
- I did **not** see a new critical auth exploit in this diff, but I also would **not** call it ready.

## Small actionable next moves
1. **Do not describe #1173 as a full async-email fix.** It only fixes the registration path.
2. **Fix the analytics contract fully** by changing the registration `event_type` too, not just the display string.
3. **Clean `tests/conftest.py` imports** before asking CI to say anything useful.
4. **Keep it draft** until the branch is narrowed or cleaned; right now it reads like a grab-bag patch, not a crisp merge lane.

## Verdict
`#1173` has a couple of legit fixes, but the newest revision still **overclaims the async-email repair and leaves registration analytics semantically wrong**. Draft is the right state.

---

# MUTX Auditor — 2026-03-19 04:37 Europe/Rome

## New landed change audited
Newest landed change since the last note: **PR #1132** — `fix(auth): enforce ownership on all agent endpoints`
- merged to `main` as `2e682807` at 03:33 UTC

## Sharp findings
### 1) The security direction is good, but the title overclaims what actually shipped
This PR adds a **frontend proxy ownership precheck**, not hard end-to-end enforcement.

What it really does:
- adds `checkAgentOwnership()` to selected Next app proxy routes
- fetches `/v1/agents/:id` plus `/v1/auth/me` before forwarding the request
- returns `403` when the proxy can positively prove the agent belongs to someone else

What it does **not** do:
- it does not hard-fail on verifier errors, timeouts, malformed JSON, missing token, or upstream non-OK responses
- in all of those cases it returns `true` and falls through to the backend

That is a defensible defense-in-depth design **if** backend ownership checks are already correct, but it is not truthful to describe this as standalone ownership enforcement.

### 2) It adds latency and complexity to hot agent routes without a strict security guarantee
Every proxied agent action now pays extra control-plane roundtrips before the real action:
- GET/DELETE `/api/agents/[id]`
- POST `/api/agents/[id]/deploy`
- POST `/api/agents/[id]/stop`
- GET `/api/agents/[id]/logs`
- dashboard agent actions

The new helper also injects a 3s timeout wrapper, but on timeout/error it just logs and forwards anyway.
So the new behavior is effectively:
- **best-effort deny** on obvious cross-user access
- **extra latency** on normal paths
- **no hard guarantee** when the verifier itself is unhealthy

### 3) Main is still being merged while red
Post-merge CI on `2e682807` is red immediately again:
- `Coverage Check` ❌ — still crashes in `tests/conftest.py` with `NameError: AsyncSession is not defined`
- `Validation` ❌ — still the pre-existing repo formatting drift in `src/api/main.py`, two migrations, and `src/api/services/monitoring.py`

So this security-adjacent change landed without restoring trunk signal first.

## Risk read
- **No obvious new auth bypass** jumped out from this diff; the deny path itself is directionally correct.
- The sharper truthfulness risk is that the repo can now claim “ownership enforced” even though the new layer explicitly degrades open on verifier failure.
- The practical regression risk is extra request latency on agent actions for a defense layer that may no-op whenever control-plane lookups wobble.

## Small actionable next moves
1. **Describe #1132 narrowly** as frontend proxy defense-in-depth, not complete ownership enforcement.
2. **Decide fail-open vs fail-closed explicitly** for these routes and document why.
3. **Add one test for verifier timeout/error fallback** so the intended security posture is visible instead of implicit.
4. **Stop merging security/auth lanes onto red `main`**; it muddies whether failures are old debt or new regressions.

## Verdict
`#1132` is a **useful defense-in-depth patch**, but the title currently **oversells the security guarantee**. Right now it is best-effort proxy ownership checking layered on top of backend enforcement, not hard end-to-end closure of the auth gap.

---

# MUTX Auditor — 2026-03-19 06:54 Europe/Rome

## Fresh priority PR audited
PR **#1183** moved again and reran on head **`1fab711`** — still titled **`feat(cli,sdk): expand operator contract parity`**.

## Sharp findings
### 1) The lane is still red in its own touched files
Fresh CI at ~05:47 UTC is not just splashing trunk debt:
- `Validation` still wants reformatting in **`cli/commands/agents.py`**, **`cli/commands/deploy.py`**, and **`sdk/mutx/deployments.py`**
- `Coverage Check` still fails at **29.12%** vs required **70%** (`266 passed`)

So this PR is still not merge-ready on basic hygiene, even before arguing about workflow fairness.

### 2) The new agent-config CLI normalizes cleartext secret spill
This update adds:
- `mutx agents config`
- `mutx agents update-config`

Both print the full JSON config payload straight to stdout.
If runtime config carries provider keys, webhook secrets, or other credentials, this bakes secret exposure into shell history, CI captures, screenshots, and copied support logs. That is a real operator-security regression, not cosmetic drift.

### 3) The rollback parity story is still not fully truthful
The PR now adds deployment version-history types, which is good.
But `rollback()` / `arollback()` still return the plain `Deployment` object, and that model still does **not** expose a typed `version` field.
Meaning: the lane claims stronger deployment-version parity, yet SDK rollback callers still cannot read the restored version from the returned deployment object.

## Small actionable next moves
1. **Do not merge #1183 yet.** Format the touched Python files first.
2. **Redact sensitive config keys by default** in `agents config` / `update-config` output; require an explicit reveal flag if needed.
3. **Finish rollback parity honestly** by adding `version` to the SDK `Deployment` model or returning a version-aware rollback shape.

## Verdict
`#1183` is still the right narrow unblocker lane, but the newest revision introduced a sharper problem: **operator config can now leak secrets in the clear, while the parity claim is still incomplete.**

---

# MUTX Auditor — 2026-03-19 07:56 Europe/Rome

## Fresh flaky lane audited
Newest material update since the last note is **not a new landed code change**. It is the scheduled workflow **`Infrastructure Drift Detection`** on `main` (`2e682807`), which failed at ~07:34 Europe/Rome.

## Sharp findings
### 1) This lane is red before it even checks drift
Both matrix jobs (`staging`, `production`) died in the very first gate:
- `TF_VAR_do_token` missing
- `AWS_ACCESS_KEY_ID` missing
- `AWS_SECRET_ACCESS_KEY` missing

So the workflow never reached `terraform init` or `terraform plan`. Right now this is **not a drift signal**. It is a **secret-wiring/config signal**.

### 2) The workflow name is currently overselling what happened
The run shows up as a failed drift-detection lane, but the failure is just:
- secrets unavailable to the scheduled run
- immediate exit in `Validate required secrets`

That means operators scanning red CI could falsely conclude infra drift or broken Terraform, when the actual issue is much earlier and much simpler: the repo/org secrets for this workflow are empty or not exposed in this context.

### 3) This hurts CI truthfulness more than product correctness
I do **not** see evidence of live infrastructure drift from this run.
I **do** see a monitoring/process problem:
- a scheduled safety lane is producing noisy red without exercising its core check
- both environments fail identically, which strongly suggests credential configuration debt rather than environment-specific drift

## Small actionable next moves
1. **Do not treat this run as evidence of Terraform drift.** Treat it as missing-credentials configuration debt.
2. **Fix repo/org secret wiring** for `DO_TOKEN`, `TF_STATE_ACCESS_KEY_ID`, and `TF_STATE_SECRET_ACCESS_KEY`, or disable the scheduled workflow until they exist.
3. **Make the failure message more truthful** (for example, explicitly say `drift check skipped: missing secrets`) so the lane stops impersonating a Terraform failure.
4. **Only escalate on actual `terraform plan` exit-code 2**; right now the red badge is about setup, not drift.

## Verdict
Small scope, sharp truth: **the newest red lane is a false-red drift detector.** It is failing on missing secrets, not on infrastructure drift.

---

# MUTX Auditor — 2026-03-19 08:27 Europe/Rome

## Fresh priority PR update audited
PR **#1183** moved again at ~07:20 UTC on head **`6d01a4f`** with a new commit titled **`style: fix PR #1183 format drift`** after two earlier cleanup pushes (`docs: fix healer log for PR #1183`, `chore: keep healer log out of PR payload`).

## Sharp findings
### 1) The latest commit message is not truthful to the failing signal
After the force-pushes, fresh CI still ends the same way:
- `Validation` ❌
- `Coverage Check` ❌

But `Validation` is now failing **only** on the same four pre-existing trunk files:
- `src/api/main.py`
- `src/api/models/migrations/versions/3a8f2b1c4d6e_add_meta_data_to_agent_logs.py`
- `src/api/models/migrations/versions/f7e2a1c8d9b4_add_usage_events_table.py`
- `src/api/services/monitoring.py`

So the new `style: fix ... format drift` commit likely did clean the PR-touched files, but the repo signal still shows red. Net effect: the branch got a cosmetically reassuring commit message while the operator-visible outcome stayed unchanged.

### 2) The "keep healer log out of PR payload" claim is also not fully true
The PR file list on the newest head still includes:
- `reports/company/backend-executor.md`

That is internal role-reporting state, not product code. So even after a cleanup commit explicitly claiming to remove healer/log noise, the lane is still carrying company-internal report residue in the payload.

### 3) Coverage remains a workflow-shape failure, not a useful quality verdict on this lane
Fresh `Coverage Check` is now at:
- **266 passed**
- **29.12% total coverage** vs required **70%**

The gate is still running only `pytest tests/api --cov ...` while this PR mainly changes:
- `cli/commands/agents.py`
- `cli/commands/deploy.py`
- `cli/commands/webhooks.py`
- `sdk/mutx/deployments.py`
- contract tests under `tests/test_cli_*` and `tests/test_sdk_*`

So the lane added real contract tests, but the coverage job still scores those touched CLI/SDK files at **0%** because it never executes the relevant test suite. This remains a repo-policy/design bug, not evidence that the PR itself is empty.

## Small actionable next moves
1. **Drop `reports/company/backend-executor.md` from #1183** before any more cleanup claims.
2. **Stop calling the branch green-er because of the style commit** while GitHub still shows the same red operator outcome.
3. **Either broaden the coverage job to run CLI/SDK tests or stop using it as a merge signal for CLI/SDK-heavy lanes.**

## Verdict
Sharp truth: **#1183 got cleaner-looking commit messages, but not cleaner operator truth.** The branch is still red, still carrying internal report residue, and still judged by a coverage gate that is measuring the wrong surface.

---

# MUTX Auditor — 2026-03-19 08:59 Europe/Rome

## New landed change audited
Newest landed change since the last note: **`4d960204`** — `ui: make dashboard the canonical operator surface`

## What is true
This is a **real convergence fix**, not fake paint:
- legacy `/app/*` now hard-redirects into `/dashboard/*`
- the obvious borrowed `Mission Control` shell is removed from the old `/app` surface instead of lingering as a second product identity
- `/dashboard` is now the single canonical operator entrypoint
- the immediately previous landed commit **`bfd5d981`** also improved truthfulness by replacing raw `[object Object]` dashboard failures with readable auth/API error handling

So the split-brain problem did get materially smaller.

## Sharp findings
### 1) It still landed on a red trunk
Fresh CI on `4d960204` is red immediately again:
- `Validation` ❌ — still the same pre-existing formatting drift in:
  - `src/api/main.py`
  - `src/api/models/migrations/versions/3a8f2b1c4d6e_add_meta_data_to_agent_logs.py`
  - `src/api/models/migrations/versions/f7e2a1c8d9b4_add_usage_events_table.py`
  - `src/api/services/monitoring.py`
- `Coverage Check` ❌ — still dies before measuring coverage because `tests/conftest.py` references `AsyncSession` without importing it

So this commit did **not** obviously create the red, but it still shipped onto an already-untruthful mainline.

### 2) Canonical does not automatically mean more operational
The old `/dashboard` route was a denser live overview with incident/health/deployment summary logic.
This commit replaces that top section with a branded hero plus `AppDashboardClient`.

That may be the right product call for identity cleanup, but it is also a quality trade:
- **duplication is reduced** ✅
- **operator signal density on the canonical home route may be lower for signed-in users** ⚠️

In other words: the route is more coherent, but not obviously more operational.

### 3) The redirect cleanup is broad and should be tested like routing, not branding
`app/app/[[...slug]]/page.tsx` now unconditionally redirects `/app/*` to `/dashboard/*`.
That is directionally correct, but it means every old deep link now depends on a same-suffix dashboard twin existing and behaving sensibly.

I do **not** see an open redirect or auth bypass here.
The practical regression risk is simpler: stale `/app/...` links now become dashboard 404s or odd dead-ends if route parity is incomplete.

## Small actionable next moves
1. **Keep describing this as dashboard convergence, not full dashboard completion.**
2. **Restore/measure operator-home usefulness** on `/dashboard` for signed-in users so identity cleanup does not come at the expense of control-plane signal.
3. **Add explicit redirect coverage for the highest-traffic legacy `/app/*` deep links** instead of assuming same-suffix parity everywhere.
4. **Fix the red trunk basics** (`tests/conftest.py` import crash + repo formatting drift) before more “canonical” wins land into noisy CI.

## Verdict
Sharp truth: **`4d960204` is a good convergence commit with moderate routing/product risk, but it still landed on a red trunk and may have traded some operator density for cleaner identity.**

---

# MUTX Auditor — 2026-03-19 10:02 Europe/Rome

## New landed changes audited
Newest landed sequence since the last note:
- **`b9d84cb8`** — `ui: recover dashboard session on deployments bootstrap`
- **`7780095d`** — `ui: harden dashboard auth and payload states`
- **`014cd9bd`** — `ui: make dashboard chrome truthful` (current `main` head)

## What is true
This is a real quality pass on the canonical dashboard, not fake motion:
- `b9d84cb8` fixes a real UX bug by letting dashboard routes treat a refresh-token-only session as recoverable instead of immediately failing as unauthenticated
- `7780095d` replaces raw fetch-path brittleness on API keys / webhooks with shared error parsing and clearer signed-out states
- `014cd9bd` removes more fake top-bar theater and borrowed product metaphors from both the shell and `app/dashboard/SPEC.md`

So the dashboard is getting more honest.

## Sharp findings
### 1) Main is still red on the newest landed SHA
Fresh CI on **`014cd9bd`** failed immediately again:
- `Coverage Check` ❌
- `Validation` ❌

And the failures are still the same old trunk debt, not a fresh signal from this UI slice:
- `tests/conftest.py` still crashes coverage with `NameError: AsyncSession is not defined`
- `Validation` still fails on the same four formatting-drift files:
  - `src/api/main.py`
  - `src/api/models/migrations/versions/3a8f2b1c4d6e_add_meta_data_to_agent_logs.py`
  - `src/api/models/migrations/versions/f7e2a1c8d9b4_add_usage_events_table.py`
  - `src/api/services/monitoring.py`

So the commits are directionally good, but the operator-visible outcome is still **"more good code merged into a knowingly red trunk."**

### 2) `7780095d` improves resilience by getting more permissive about API shapes
The new API key / webhook clients now accept multiple response envelopes (`items`, `keys`, `api_keys`, `webhooks`, `data`) and silently coerce malformed entries away.

That makes the UI less brittle, but it also creates a truthfulness trade-off:
- dashboard pages are less likely to explode ✅
- backend contract drift is easier to hide behind empty states ⚠️

If the API starts returning the wrong shape or partial objects, the UI may now degrade into **"No API keys yet"** / **"No webhooks configured"** instead of making contract breakage obvious.

### 3) Auth-required states are clearer, but not fully locked down as operator UX
The new copy is much better, but some mutating affordances still remain easy to reach from signed-out/unauthorized screens.
Most notably, the webhook empty state now says **sign in to manage webhooks** while still presenting the create path from the same screen.

That is not a security bug by itself if the backend rejects the request, but it is still sloppy operator UX: the page is saying **auth required** while leaving the next click-path pointed at mutation.

## Small actionable next moves
1. **Stop landing dashboard truth passes onto red trunk** until the `AsyncSession` import crash and the four formatting-drift files are fixed.
2. **Add one contract-visible warning path** for API key / webhook payload normalization so silent empty-state fallback does not hide real API drift.
3. **Disable or gate mutating controls when the page is in an auth-required state** instead of only changing the copy.

## Verdict
Sharp truth: **the newest dashboard commits are good honesty work, but they are still being shipped into a CI state that stays visibly untrustworthy, and `7780095d` now risks hiding backend contract drift behind cleaner empty states.**

---

# MUTX Auditor — 2026-03-19 10:31 Europe/Rome

## New landed changes audited
Newest landed sequence since the last note:
- **`739760e1`** — `ui: collapse swarm alias into deployments`
- **`b0795c02`** — `ui: collapse stale app routes into dashboard` (current `main` head)

## What is true
These are real convergence/cleanup commits, not fake paint:
- `739760e1` removes one more borrowed product noun by redirecting `/dashboard/swarm` to `/dashboard/deployments`, moving nav emphasis onto `Deployments`, and replacing the old OG tagline with MUTX’s own line
- `b0795c02` fixes actual route-drift by remapping stale `/app/activity`, `/app/cron`, and `/app/settings` paths into canonical dashboard destinations and adds focused middleware tests for those redirects
- internal nav components were also rewired away from `/app*` and toward `/dashboard*`, which reduces future split-brain regressions

## Sharp findings
### 1) `main` is still red on the newest landed SHA
Fresh CI on **`b0795c02`** is still failing the same two baseline lanes:
- `Validation` ❌
- `Coverage Check` ❌

And the failures are still the same old trunk debt, not this routing slice:
- `Validation` still fails only on the four pre-existing formatting-drift files:
  - `src/api/main.py`
  - `src/api/models/migrations/versions/3a8f2b1c4d6e_add_meta_data_to_agent_logs.py`
  - `src/api/models/migrations/versions/f7e2a1c8d9b4_add_usage_events_table.py`
  - `src/api/services/monitoring.py`
- `Coverage Check` still crashes before measuring anything because `tests/conftest.py` references `AsyncSession` without importing it

So the operator-visible truth remains: **more good UI cleanup is landing into a knowingly red trunk.**

### 2) `739760e1` improves naming truth, but redirects are stronger than route-parity proof
Redirecting `/dashboard/swarm` straight to `/dashboard/deployments` is directionally right if `Swarm` was only a borrowed alias.
But it also quietly asserts that the two surfaces are now product-equivalent.
Right now the evidence in this commit is mostly naming/nav cleanup, not a deeper proof that every old swarm-linked mental model or deep-link expectation really maps cleanly onto deployments.

This is not a security bug. It is a product-truthfulness risk: **alias collapse is ahead of contract proof.**

### 3) `b0795c02` fixes the obvious stale routes, but the redirect map is still selective
This pass explicitly covers:
- `/app/activity` → `/dashboard/history`
- `/app/cron` → `/dashboard/orchestration`
- `/app/settings` → `/dashboard/control`
- plus other high-traffic workflow paths

That is good.
But it also highlights the remaining shape of the system: canonicalization still depends on a hand-maintained mapping table. So the current protection against future route drift is **spot-fix + tests for the touched cases**, not a more durable route-model unification.

## Small actionable next moves
1. **Fix the two baseline red lanes before more dashboard convergence lands** (`tests/conftest.py` import crash + the four formatting-drift files).
2. **Add one explicit regression test for `/dashboard/swarm` redirect semantics** so the alias removal is locked, not just implied.
3. **Centralize legacy-to-canonical route mapping from one shared route model** before more one-off redirect patches accumulate.

## Verdict
Sharp truth: **these two commits make the canonical dashboard cleaner and less split-brained, but they do not change the larger operator problem — trunk is still visibly red, and route convergence is being enforced faster than CI truth is being restored.**
