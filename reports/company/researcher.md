# Researcher — 2026-03-19 07:03 Europe/Rome

## Research target
What is the next concrete dashboard truth gap after the shell-level `401 -> login recovery` finding?

## Sources checked
- `USER.md`
- `mutx-fleet-state.md`
- `reports/company/ROSTER.md`
- prior `reports/company/researcher.md`
- `components/app/AgentsPageClient.tsx`
- `components/app/DeploymentsPageClient.tsx`
- `components/app/dashboard-layout.tsx`
- `app/api/dashboard/health/route.ts`
- `docs/app-dashboard.md`
- `scripts/create_issues.py`

## Material update since last note
Yes.

Last note established the shell-level contract gap:
- MUTX already intends `401 -> login recovery with return URL preserved`
- but shared dashboard surfaces still normalize auth failure into calm/empty state

This run found the next narrower, shippable follow-on:

**The dashboard leaf pages for agents and deployments still render inventory-empty UX after failed reads, and the deployments page keeps polling even when the read is unauthorized or already failing.**

That means the app is currently telling two conflicting stories at once:
- top banner: something failed
- main body: “No agents yet” / “No deployments yet” + create-resource CTA

For an operator control plane, that is a dangerous lie. It converts “you are blocked” into “you just have zero resources.”

## Local repo truth

### 1) Agents page falls through from failure into empty-state CTA
In `components/app/AgentsPageClient.tsx`:
- `loadAgents()` sets `error` on failure
- but it does **not** mark the data as unavailable
- render path still checks `agents.length === 0` and then shows:
  - `No agents yet`
  - `Create new agent`
  - `Connect existing OpenClaw workspace`

So after a `401`, proxy failure, or upstream runtime problem, the page can show an error banner **and** an inventory-empty acquisition CTA.

That is not just rough UX. It is an operator-truth violation.

### 2) Deployments page has the same empty-vs-error split bug
In `components/app/DeploymentsPageClient.tsx`:
- `loadDeployments()` sets `error` on failure
- but failed loads still leave `deployments` as `[]`
- render path uses only `filteredDeployments.length === 0`
- so the page shows:
  - `No deployments yet`
  - `Create new deployment`
  - `Connect existing OpenClaw workspace`

Same contradiction: failure state and true-empty inventory are currently collapsed into the same primary body UI.

### 3) Deployments view keeps polling every 30s even in repeated failure/auth states
Also in `components/app/DeploymentsPageClient.tsx`:
- `useEffect(() => setInterval(() => { void loadDeployments() }, 30000), [])`
- this interval is unconditional
- it does not stop for `401`
- it does not back off for repeated failures
- it does not wait for successful recovery first

So the page keeps re-hitting `/api/dashboard/deployments` every 30 seconds even when the user is unauthorized or the upstream is already unhealthy.

That is bad for three reasons:
1. needless noise against the proxy/backend
2. noisy operator experience during a broken session
3. it weakens the clean auth-recovery contract by acting like retrying blind is normal

### 4) This compounds the shell-level issue, it does not replace it
`components/app/dashboard-layout.tsx` still has the broader shell problem:
- health/agents/deployments reads are wrapped with `catch(() => null)` / `catch(() => [])`
- summary pills can still degrade into `unknown`, `0/x`, or empty-ish calm

But the sharper new finding is at the page-body level:

**even when the page already knows the fetch failed, it still offers empty-state creation UI as if inventory were truly zero.**

That is a cleaner execution slice than broad “dashboard polish.”

## Why this matters operationally
This sharpens execution because it defines a small, demo-relevant acceptance bar for the next backend/UI comeback:

**failure must be visually and behaviorally distinct from empty inventory.**

If MUTX does not enforce that, the product keeps teaching operators the wrong mental model:
- unauthorized == empty fleet
- backend outage == nothing deployed yet
- repeated failure == keep polling forever

That is exactly the wrong behavior for a control plane.

## Actionable insight
**The next narrow dashboard truth fix should be `error/auth-blocked != empty state`, with polling disabled or backed off during known failure states.**

## Recommended shortlist
1. **Add explicit page-body load states for agents/deployments**
   - `loading`
   - `auth-blocked / session expired`
   - `permission denied`
   - `service unavailable / failed to load`
   - `true empty inventory`

2. **Do not show create/connect CTAs on failed reads**
   - `No agents yet` only when fetch succeeded and returned zero
   - `No deployments yet` only when fetch succeeded and returned zero

3. **Gate polling on healthy state**
   - stop 30s deployment polling after `401`
   - stop or exponentially back off after repeated non-auth failures
   - resume polling only after successful recovery or explicit retry

4. **Make shell + leaf semantics match**
   - shell-level `401 -> login recovery`
   - page-level body must not contradict that with empty-state acquisition UI

5. **Add narrow acceptance tests**
   - agents page: failed fetch shows blocked/error state, not `No agents yet`
   - deployments page: failed fetch shows blocked/error state, not `No deployments yet`
   - deployments page: unauthorized state does not continue blind 30s polling

## Sharpest handoff
- **Backend Executor:** keep the slice thin: canonical dashboard error envelope plus enough client-state separation so failed reads cannot masquerade as empty inventory
- **UI Executor:** patch body-state branching before adding any more dashboard acreage
- **Auditor:** verify no auth/error path on agents/deployments still lands on empty/create-resource CTAs; verify deployments polling pauses on unauthorized/failure
- **PR Opener:** frame this as `dashboard error-vs-empty truth` or split it from the broader auth-recovery issue if needed

## Bottom line
New finding:

**Agents and deployments pages still treat failed reads as empty inventory, and deployments keeps polling every 30s even in bad-session/failure states.**

That gives MUTX one crisp next fix after shell auth recovery:
ship explicit `error/auth-blocked` body states and stop pretending broken reads mean the fleet is empty.

---

# Researcher — 2026-03-19 07:34 Europe/Rome

## Research target
Is the dashboard error-envelope/auth-state fix still just a research direction, or is there already branch-only code we can replay onto canonical routes?

## Sources checked
- prior `reports/company/researcher.md`
- `app/api/dashboard/agents/route.ts`
- `app/api/dashboard/deployments/route.ts`
- `app/api/dashboard/health/route.ts`
- `app/api/auth/me/route.ts`
- `factory/app/api/_lib/errors.ts`
- `factory/app/api/dashboard/agents/route.ts`
- `factory/app/api/dashboard/deployments/route.ts`
- `factory/tests/unit/dashboardRoutes.test.ts`
- `reports/company/ceo.md`
- repo grep for dashboard auth/error references

## Material update since last note
Yes.

The key new fact is not another UX bug. It is execution leverage:

**MUTX already has a branch-only implementation pattern for the dashboard auth/error-envelope fix inside `factory/`, with helper code and unit tests.**

So the next comeback slice should not start from scratch.
It should replay the existing narrow pattern onto canonical app routes.

## Local repo truth

### 1) Canonical app routes are still on the old raw-pass-through contract
In main workspace routes:
- `app/api/dashboard/agents/route.ts`
- `app/api/dashboard/deployments/route.ts`
- `app/api/auth/me/route.ts`

current behavior is still:
- if no token: return `{ detail: 'Unauthorized' }`
- otherwise: proxy upstream JSON straight through
- on network failure: return `{ detail: 'Failed to connect to API' }`

`app/api/dashboard/health/route.ts` is different again and returns `{ status, error }`.

So the dashboard BFF is still inconsistent by route family:
- `detail`-style errors on agents/deployments/auth
- `status/error` shape on health
- elsewhere in app, some routes already use `error`-style envelopes

That inconsistency is exactly why clients keep falling back to brittle `payload.detail || payload.error || ...` logic.

### 2) `factory/` already contains a shared error helper for this
There is already a branch-only helper:
- `factory/app/api/_lib/errors.ts`

It defines a canonical shape:
- `status: 'error'`
- `error.code`
- `error.message`
- optional `error.details`

It already includes a ready-made `unauthorized()` helper returning:
```json
{
  "status": "error",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized"
  }
}
```

That is much cleaner than the current mixed `detail` / `error` / `status` responses.

### 3) `factory/` dashboard route tests already pin the intended behavior
`factory/tests/unit/dashboardRoutes.test.ts` already asserts that:
- dashboard agents proxy without token returns normalized `401` envelope
- dashboard deployments proxy without token returns normalized `401` envelope

So there is already a testable contract for the exact first slice we need.

This matters because it means the next backend/UI restore lane can be framed as:
- replay existing helper + tests
- patch canonical dashboard routes to match
- then make leaf pages consume that shape cleanly

not:
- invent a new contract from scratch

### 4) The `factory/` implementation is directionally useful, but not the full finish yet
The branch-only `factory/app/api/dashboard/{agents,deployments}/route.ts` files use the shared unauthorized helper, but still preserve upstream payloads as-is after fetch.

So the replay target should be precise:
1. copy/replay the helper + test expectations first
2. normalize canonical no-token and proxy-failure paths first
3. then decide whether upstream `401/403/5xx` payloads also need wrapping into the same top-level envelope

That keeps scope tight while still shipping the highest-value visible fix.

## Actionable insight
**The next backend comeback slice should be a replay, not fresh research: port the existing `factory` dashboard error-helper + tests onto canonical app routes, then wire agents/deployments pages to that normalized envelope.**

## Recommended shortlist
1. **Replay `factory/app/api/_lib/errors.ts` into canonical app BFF helpers**
   - start with dashboard-facing routes only
   - do not broaden to every app API route in the same pass

2. **Port the matching unit expectations from `factory/tests/unit/dashboardRoutes.test.ts`**
   - unauthorized agents route returns normalized envelope
   - unauthorized deployments route returns normalized envelope
   - preserve success payload passthrough for green paths

3. **Patch canonical routes first, in this order**
   - `app/api/dashboard/agents/route.ts`
   - `app/api/dashboard/deployments/route.ts`
   - `app/api/auth/me/route.ts`
   - optionally align `app/api/dashboard/health/route.ts` after the auth-bearing routes are stable

4. **Then patch UI consumers to read one field path first**
   - prefer `payload.error?.message`
   - stop relying on `payload.detail || payload.error || ...`
   - use the normalized auth code to branch into `auth-blocked` vs `unavailable`

5. **Keep acceptance criteria brutally narrow**
   - unauthenticated `/dashboard/agents` does not render `[object Object]`
   - unauthenticated `/dashboard/deployments` does not render `[object Object]`
   - unauthorized reads surface a readable auth-blocked state
   - failed reads still do not show empty/create-resource CTAs

## Sharpest handoff
- **Backend Executor:** replay the existing `factory` helper/tests instead of designing a new contract mid-flight
- **UI Executor:** consume `error.code/message` and branch `auth-blocked != empty-success`
- **Auditor:** verify canonical routes, not just `factory/`, return the normalized unauthorized envelope
- **PR Opener:** position the work as `replay existing dashboard error-envelope slice from factory onto canonical app routes`

## Bottom line
New finding:

**The dashboard auth/error-envelope fix is already partially designed and test-pinned in `factory/`; the highest-leverage move now is to replay that narrow slice onto canonical routes instead of spending another cycle rediscovering it.**

---

# Researcher — 2026-03-19 07:50 Europe/Rome

## Research target
Is the current MUTX execution slowdown partly a queue-shape problem — specifically duplicate GitHub issues around the exact dashboard/auth seam the company is trying to unblock?

## Sources checked
- `USER.md`
- `mutx-fleet-state.md`
- `reports/company/ROSTER.md`
- prior `reports/company/researcher.md`
- `scripts/create_issues.py`
- `gh issue list -R mutx-dev/mutx-dev --limit 300 --json number,title,state,labels,createdAt`
- targeted `gh issue list` searches for `session expiry`, `unauthorized`, `dashboard`, `[object Object]`
- repo grep for dashboard/auth issue references

## Material update since last note
Yes.

The new execution-level finding is:

**the GitHub issue backlog is still heavily duplicated, including the exact dashboard/session-expiry and adjacent dashboard-surface items the company keeps using as planning anchors.**

This is not just cleanup trivia. It is likely part of why the backend comeback slice keeps getting described too broadly or against the wrong issue IDs.

## Local repo + queue truth

### 1) The dashboard/session-expiry issue exists three times
Open issues with the exact same title:
- `#872` — `fix(web): fix session expiry handling in dashboard`
- `#762` — same title
- `#664` — same title

That means the company does **not** have one canonical queue object for the auth-recovery problem it keeps discussing.

### 2) Core dashboard surface issues are duplicated even more aggressively
Open issue clusters include:
- **5 copies** — authenticated dashboard agent list
  - `#914`, `#846`, `#811`, `#745`, `#647`
- **5 copies** — authenticated dashboard deployment list
  - `#915`, `#847`, `#812`, `#746`, `#648`
- **5 copies** — dashboard sidebar navigation
  - `#920`, `#854`, `#817`, `#751`, `#653`
- **5 copies** — global search in dashboard navigation
  - `#919`, `#853`, `#816`, `#750`, `#652`
- **3 copies** — dashboard error boundaries
  - `#860`, `#756`, `#658`
- **3 copies** — session expiry handling in dashboard
  - `#872`, `#762`, `#664`

So the queue around the web/dashboard surface is not just noisy. It is structurally ambiguous.

### 3) Even some current “active” backend issues also have duplicate twins
Notably:
- `#979` and `#712` — `feat(auth): enforce ownership on all agent endpoints`
- `#984` and `#717` — `feat(runtime): add agent execution timeout enforcement`

That matters because those IDs are already showing up in company planning/reporting. If the team keeps referencing duplicate issue objects, status and scope drift become almost guaranteed.

### 4) The likely source is already in-repo
`scripts/create_issues.py` contains a large issue-generation catalog for exactly these dashboard items.

The open issue pattern strongly suggests the queue was generated in repeated waves without dedupe/close-out discipline, which left multiple live copies of the same ask.

### 5) This directly harms the current recovery plan
Right now the company wants a very thin comeback slice:
- dashboard auth/error-envelope replay
- auth/error-vs-empty-state split
- failure-aware polling behavior

But the queue still points at multiple stale/broad/duplicated issue objects like:
- session expiry handling
- authenticated dashboard list views
- dashboard error boundaries
- broad runtime/auth infra work

That makes it too easy for a restarted executor or PR opener to:
1. pick the wrong issue
2. restate the problem too broadly
3. open/update work against a duplicate ticket
4. lose the thin acceptance bar the company finally clarified

## Actionable insight
**Before restoring broader execution flow, MUTX should declare one canonical issue for the dashboard honesty/auth-recovery seam and close or supersede the duplicate queue around it.**

This is likely cheaper than another full research cycle and probably cheaper than another poisoned backend restart against a fuzzy prompt.

## Recommended shortlist
1. **Choose one canonical issue for dashboard auth/honesty recovery**
   - likely use the newest relevant issue ID in the cluster
   - mark the others `duplicate` / `superseded`

2. **Collapse the dashboard duplicate clusters before new executor restarts**
   - session expiry handling (`#872/#762/#664`)
   - authenticated agent list (`#914/#846/#811/#745/#647`)
   - authenticated deployments list (`#915/#847/#812/#746/#648`)
   - error boundaries (`#860/#756/#658`)

3. **Rewrite the canonical issue title/body to match the actual thin seam**
   - not broad “dashboard polish”
   - not generic “monitoring/self-healing”
   - specifically: dashboard auth/error-envelope replay + honest failure states

4. **Patch issue-generation workflow before another mass issue pass**
   - add title dedupe check in `scripts/create_issues.py`
   - or require “search existing open issues by title” before creation

5. **Make PR Opener treat duplicate-issue cleanup as unblocker work, not admin garnish**
   - because right now queue ambiguity is productively harmful

## Sharpest handoff
- **PR Opener:** canonicalize the dashboard-auth issue and close duplicates first
- **CEO / CTO:** stop referencing broad or duplicate issue IDs as the planning anchor for the comeback slice
- **Backend Executor (when restored):** work from one explicitly named canonical issue only
- **Auditor:** verify no new PR or status report points at a superseded duplicate issue

## Bottom line
New finding:

**MUTX is not only fighting a broken dashboard contract; it is also fighting a duplicated planning queue for that same problem.**

If the company wants the next backend restart to stay thin and honest, it should first collapse the duplicate issue clusters and give the auth-recovery/dashboard-honesty seam exactly one canonical issue target.

---

# Researcher — 2026-03-19 08:05 Europe/Rome

## Research target
Which duplicate dashboard issues should actually be kept as canon for the auth/honesty comeback slice?

## Sources checked
- `USER.md`
- `mutx-fleet-state.md`
- `reports/company/ROSTER.md`
- prior `reports/company/researcher.md`
- `gh issue view` for duplicate clusters: `#872/#762/#664`, `#914/#846/#811/#745/#647`, `#915/#847/#812/#746/#648`, `#860/#756/#658`
- issue metadata + bodies for labels, timestamps, and acceptance criteria

## Material update since last note
Yes.

Last note said the dashboard queue is duplicated.
This run answers the sharper execution question:

**the newest duplicate is not always the best canonical issue to keep.**

For the two most important dashboard surface issues, the newest copies (`#914`, `#915`) are actually *worse* planning anchors than slightly older duplicates because they were regenerated as thin `Autonomous task:` shells and lost the richer acceptance criteria from the older issues.

That means a naive “keep the highest issue number” cleanup would make executor prompts less precise right when MUTX needs tighter scope.

## Local queue truth

### 1) Session-expiry duplicates are truly interchangeable
- `#872`, `#762`, and `#664`
- same title
- same labels
- same body
- same acceptance criteria

So for the auth-recovery issue, keeping the newest one (`#872`) is fine. Nothing is lost by closing the older twins.

### 2) Agent-list duplicates are **not** interchangeable
- `#914` is the newest open copy and has labels `area:web`, `risk:low`, `autonomy:ready`, `size:m`
- but its body is only:
  - `Autonomous task: feat(web): add authenticated agent list view to dashboard`
- older duplicates like `#846`/`#811`/`#745`/`#647` still contain the useful execution details:
  - dashboard shows agent list with name, status, created date
  - authenticated API source
  - empty state shown when no agents exist
  - loading and error states handled

So if the company wants one canonical issue for the agent-list/dashboard-honesty seam, **`#846` is a better canon than `#914`** unless someone first ports the richer body into `#914`.

### 3) Deployment-list duplicates have the same problem
- `#915` is newest and tagged `autonomy:ready`
- but body is only the one-line autonomous stub
- older duplicates like `#847`/`#812`/`#746`/`#648` keep the concrete contract:
  - list with name, status, agent, date
  - authenticated API source
  - empty and error states handled
  - links to deployment detail

So for deployments, **`#847` is a better canonical planning object than `#915`** unless `#915` gets rewritten first.

### 4) Error-boundary duplicates are safe to newest-keep
- `#860`, `#756`, `#658`
- same substantive body and acceptance criteria

So here the straightforward cleanup rule works: keep `#860`, close older duplicates.

## Actionable insight
**Duplicate cleanup should preserve the richest issue body, not blindly preserve the newest issue number.**

For the dashboard/auth comeback slice, that means:
- keep `#872` for session-expiry handling
- keep `#846` for authenticated agent list work
- keep `#847` for authenticated deployment list work
- keep `#860` for dashboard error boundaries

If the company prefers the newest IDs (`#914`, `#915`) because of `autonomy:ready`, then first copy the richer acceptance criteria into them before closing `#846`/`#847`.

## Recommended shortlist
1. **Canonicalize by content quality, not recency alone**
   - keep `#872` over `#762/#664`
   - keep `#860` over `#756/#658`
   - keep `#846` over `#914` *unless* `#914` is enriched first
   - keep `#847` over `#915` *unless* `#915` is enriched first

2. **If PR Opener wants `autonomy:ready` issues as canon, repair them first**
   - copy acceptance criteria from `#846` into `#914`
   - copy acceptance criteria from `#847` into `#915`
   - then mark older duplicates as superseded

3. **Use the canonical issue text to keep the next executor slice thin**
   - agents/deployments must differentiate `error/auth-blocked` from `true empty`
   - loading/error states are part of the contract already in the richer older issues

4. **Avoid a bad cleanup side effect**
   - do not close the richer issues first and leave only one-line stubs behind
   - that would make future cron prompts broader and sloppier, not cleaner

## Sharpest handoff
- **PR Opener:** do duplicate cleanup in a way that preserves acceptance criteria, not just labels
- **CEO / CTO:** planning anchor should be `#872 + #846 + #847 + #860`, or enriched `#914/#915` if you explicitly rewrite them first
- **Backend/UI Executors:** work against issues that still encode the body-state contract (`loading/error/empty/auth`) instead of generic one-line stubs

## Bottom line
New finding:

**The queue problem is subtler than “too many duplicates” — some newer duplicates are lower-quality planning objects than the older ones.**

So the right cleanup move is not just dedupe. It is **dedupe without throwing away the acceptance criteria MUTX needs for the dashboard auth/honesty fix.**

---

# Researcher — 2026-03-19 08:21 Europe/Rome

## Research target
Is duplicate queue noise just a few dashboard clusters, or is the issue-generation pipeline itself still the root cause across the repo?

## Sources checked
- `USER.md`
- `mutx-fleet-state.md`
- `reports/company/ROSTER.md`
- prior `reports/company/researcher.md`
- `scripts/create_issues.py`
- live open issue list via `gh issue list -R mutx-dev/mutx-dev --limit 300 --state open --json number,title`

## Material update since last note
Yes.

This run found the stronger root-cause answer:

**the duplicate issue problem is systemic, not localized to a few dashboard tickets. The current repo still has at least 71 open issue titles from `scripts/create_issues.py` that exist in duplicate.**

So the queue is not merely messy around the dashboard/auth seam.
It is still being shaped by a non-idempotent issue generator with no live dedupe guard.

## Local queue truth

### 1) `scripts/create_issues.py` has no protection against reruns
The script currently:
- defines a static 100-issue catalog
- loops through every item
- calls `gh issue create` directly
- sleeps 0.5s between writes

It does **not**:
- search for existing open issues by title
- skip already-open matches
- update/supersede prior copies
- write any local manifest of created issue IDs
- support idempotent reruns

So every `--execute` rerun can spray another wave of duplicates into the repo.

### 2) The duplicate count is already repo-wide, not anecdotal
Cross-checking the current open issue list against the catalog titles shows:

- **71 catalog titles currently have more than one open copy**
- many titles have **4-5 simultaneously open duplicates**

Concrete examples from the live queue:
- `feat(api): add pagination to GET /deployments endpoint` → `#893`, `#864`, `#821`, `#792`, `#726`
- `feat(api): add filtering by status on GET /deployments` → `#895`, `#868`, `#824`, `#794`, `#728`
- `feat(api): add request ID tracking across all endpoints` → `#910`, `#843`, `#808`, `#742`, `#644`
- `feat(api): add OpenAPI spec auto-generation from FastAPI` → `#913`, `#845`, `#810`, `#744`, `#646`

That is not normal backlog churn. It is generator replay without dedupe discipline.

### 3) This likely explains why dashboard duplicates looked patterned
Earlier research showed repeated clusters around:
- session expiry
- authenticated agent list
- authenticated deployment list
- error boundaries

This run explains the pattern: those are not isolated accidents.
They are part of a broader repeated-wave issue creation process across the whole catalog.

### 4) The cheapest durable fix is upstream of executor prompts
If MUTX only cleans up duplicates by hand but keeps the current script unchanged, the backlog will drift back toward ambiguity the next time someone reruns issue generation.

So the real unblocker is not just queue cleanup.
It is making issue creation **idempotent**.

## Actionable insight
**Before spending more operator cycles triaging duplicate tickets, MUTX should patch `scripts/create_issues.py` so reruns are safe. Otherwise the queue will keep re-poisoning itself.**

## Recommended shortlist
1. **Add title-based dedupe before `gh issue create`**
   - fetch open issues once at start
   - map by exact title
   - skip creation when an open title already exists

2. **Emit a creation report instead of blind fire-and-forget**
   - `created`
   - `skipped_existing`
   - `failed`
   - include matched issue numbers for skipped titles

3. **Add an explicit `--dedupe-report` / dry-run mode**
   - compare catalog vs live repo
   - print duplicate clusters before any write
   - make cleanup measurable

4. **Persist a manifest for future reruns**
   - simple JSON mapping `title -> issue_number`
   - lets the script update or verify instead of recreate

5. **Then do targeted duplicate cleanup by cluster quality**
   - preserve the richest issue bodies where newer copies are weaker
   - especially on dashboard/auth seams already in flight

## Sharpest handoff
- **PR Opener:** treat `scripts/create_issues.py` idempotency as queue-health infrastructure, not admin cleanup
- **CEO / CTO:** stop assuming duplicate drift is a local dashboard problem; it is repo-wide issue-generator debt
- **Auditor:** verify no future issue-generation pass can create a second open copy of the same title

## Bottom line
New finding:

**MUTX's duplicate-issue backlog is still being manufactured by tooling.**

The highest-leverage queue fix is not another manual cleanup sprint.
It is making `scripts/create_issues.py` safe to rerun so the backlog stops regenerating duplicate work.

---

# Researcher — 2026-03-19 08:37 Europe/Rome

## Research target
Can duplicate cleanup be done as a fast cohort operation instead of slow ticket-by-ticket triage?

## Sources checked
- `USER.md`
- `mutx-fleet-state.md`
- `reports/company/ROSTER.md`
- prior `reports/company/researcher.md`
- `scripts/create_issues.py`
- `gh issue list -R mutx-dev/mutx-dev --limit 300 --state open --json number,title,createdAt`
- `gh issue view` samples for `#647/#745/#811/#846/#914` and `#648/#746/#812/#847/#915`

## Material update since last note
Yes.

This run found the cleanup shortcut hiding inside the duplicate pattern:

**the open backlog was not just duplicated “a lot” — it was duplicated in clear creation waves, and the last wave is qualitatively different.**

That means MUTX can clean a large chunk of the queue by cohort, not by manually reasoning about every single duplicate title one at a time.

## Local queue truth

### 1) The duplicates cluster into five distinct March 16 creation waves
For representative duplicate titles like:
- `feat(web): add authenticated agent list view to dashboard`
- `feat(web): add authenticated deployment list view to dashboard`
- `feat(api): add OpenAPI spec auto-generation from FastAPI`

open copies line up in near-identical timestamp bands:
- `13:08 UTC` → `#647/#648/...`
- `13:12 UTC` → `#745/#746/...`
- `13:14 UTC` → `#811/#812/...`
- `13:16 UTC` → `#846/#847/...`
- `13:18 UTC` → `#914/#915/...`

So this was not random backlog drift.
It was repeated bulk issue creation in a tight ~10 minute window.

### 2) The first four waves look like the same rich-body catalog
Sampled issues from waves 1-4 (`#647`, `#745`, `#811`, `#846`) all share:
- same rich `## Problem / ## Proposed change / ## Acceptance criteria` body shape
- same labels (`area:web`, `risk:low`, `size:m`)

That strongly suggests repeated reruns of the rich catalog generator, which matches `scripts/create_issues.py`.

### 3) The fifth wave is different: autonomy-ready stub copies
Sampled issues from the fifth wave (`#914`, `#915`) differ in two important ways:
- body collapses to one-line `Autonomous task: ...`
- labels add `autonomy:ready`

So the latest wave is not just “another duplicate.”
It is a **different-quality duplicate layer**.

### 4) That gives MUTX a faster canonicalization rule
Because the waves are cleanly separated, MUTX does not need to dedupe title-by-title first.
It can do a bulk first pass like this:
- preserve one preferred wave as canon
- close/supersede entire older duplicate waves in batches
- only handle exceptions where the stub wave has a useful label worth preserving

For dashboard work specifically, the best default canon is the **13:16 UTC rich-body wave** (`#846/#847/...`):
- latest rich acceptance criteria
- newer than the 13:08/13:12/13:14 copies
- better planning objects than the 13:18 autonomy-stub wave

## Actionable insight
**MUTX should treat duplicate cleanup as wave cleanup: keep the 13:16 UTC rich-body cohort as default canon, bulk-close the earlier rich-body waves, and only salvage metadata from the 13:18 autonomy-stub wave when it adds something worth keeping.**

## Recommended shortlist
1. **Use creation-wave cleanup, not title-by-title cleanup, for the first pass**
   - default keep: `13:16 UTC` cohort (`#846/#847/...` family)
   - bulk-close/supersede: `13:08`, `13:12`, `13:14` cohorts

2. **Do not blindly keep the newest wave**
   - the `13:18 UTC` cohort (`#914/#915/...`) is newer
   - but it often has worse bodies because it replaced acceptance criteria with `Autonomous task:` stubs

3. **If `autonomy:ready` matters, backport the label instead of keeping the stub**
   - copy `autonomy:ready` onto the preferred rich-body canon where appropriate
   - then close the stub duplicate

4. **Make PR Opener cleanup measurable by cohort**
   - report `kept wave`, `closed wave(s)`, and any per-title exceptions
   - this is much cheaper than reasoning from scratch about 70+ duplicate title clusters

5. **Then patch generators so the pattern cannot recur**
   - idempotent `scripts/create_issues.py`
   - plus dedupe/manifest discipline for whatever produced the `autonomy:ready` stub wave

## Sharpest handoff
- **PR Opener:** run a cohort-based duplicate collapse with `13:16 UTC` as the default canon wave
- **CEO / CTO:** planning should anchor on the kept rich-body wave, not on the newest issue numbers by reflex
- **Auditor:** verify the stub-wave metadata you care about (`autonomy:ready`) is preserved before closing those newest duplicates

## Bottom line
New finding:

**The duplicate backlog has a wave structure.**

That means MUTX has a faster cleanup path than manual per-ticket triage:
keep the latest rich-body cohort, close the older repeated waves in bulk, and only cherry-pick useful metadata from the newest autonomy-stub wave.

---

# Researcher — 2026-03-19 09:13 Europe/Rome

## Research target
Is duplicate issue cleanup enough by itself, or does the autonomy dispatcher still select the wrong duplicate even after the queue looks superficially healthy?

## Sources checked
- `USER.md`
- `mutx-fleet-state.md`
- `reports/company/ROSTER.md`
- prior `reports/company/researcher.md`
- `scripts/autonomy/build_work_order.py`
- `scripts/autonomy/select_agent.py`
- `scripts/parallel-agent-launcher.sh`
- `docs/autonomy/activation.md`
- live `gh issue list -R mutx-dev/mutx-dev --state open --limit 300 --json number,title,labels,body`

## Material update since last note
Yes.

The sharper new finding is:

**queue dedupe alone is not enough — the current autonomy selector is structurally biased toward the newest duplicate, because `build_work_order.py` breaks score ties by higher issue number and never collapses duplicate titles first.**

So even if the repo keeps just a few duplicate `autonomy:ready` issues around, the dispatcher still tends to choose the newer, thinner planning object.

## Local tooling truth

### 1) The dispatcher does not dedupe by title before choosing work
In `scripts/autonomy/build_work_order.py`:
- `choose_issue()` filters to open `autonomy:ready` issues
- scores them only from labels (`area`, `risk`, `size`, optional `autonomy:safe`)
- then sorts by `(score, issue_number)` descending

That means duplicate titles are treated as independent work items.
There is no title/fingerprint collapse step.

### 2) On same-label duplicates, the newest issue wins by construction
If two duplicate issues have the same labels, the score ties.
The current tiebreaker is the higher issue number.

Operationally that means:
- newer duplicate wins
- older richer duplicate loses
- acceptance text in the chosen work order is whatever body lives on the newest issue

That is the opposite of what the company needs right now, because the newer duplicate layer is often the thinner one.

### 3) Live repo evidence: there are still open `autonomy:ready` duplicate titles right now
Fresh GitHub scan shows **48** open ready issues and **4 duplicate ready titles** still live.
Examples:
- `#893` vs `#864` — `feat(api): add pagination to GET /deployments endpoint`
- `#894` vs `#866` — `feat(api): add filtering by status on GET /agents`
- `#895` vs `#868` — `feat(api): add filtering by status on GET /deployments`
- `#896` vs `#870` — `feat(api): return created_at and updated_at on all resource responses`

In each pair, the newer issue is the one the selector would favor if score ties hold.

### 4) Other launcher paths have the same bias shape
`scripts/parallel-agent-launcher.sh` also just asks GitHub for open `autonomy:ready` issues and slices the first N.
It does not canonicalize duplicate titles either.

So this is not just a single-script cleanliness bug.
It is an execution-routing bug.

## Why this matters operationally
This sharpens MUTX execution because it explains why queue cleanup can still feel slippery even after obvious duplicate closure work:

**the autonomy system currently optimizes for newest-label-ready object, not best planning object.**

That creates three concrete risks:
1. thin `Autonomous task:` stubs beat richer issue bodies
2. duplicate work can still be claimed even when humans think the queue is “mostly cleaned up”
3. executor acceptance criteria become less precise exactly where the company is trying to run thinner, more truthful slices

## Actionable insight
**Patch the selector, not just the backlog: make `build_work_order.py` collapse duplicate titles before scoring, and prefer the richest canonical issue body instead of the highest issue number.**

## Recommended shortlist
1. **Add duplicate-title canonicalization inside `build_work_order.py`**
   - group eligible issues by exact title first
   - choose one canonical issue per title before scoring global priority

2. **Use a better per-title winner rule than highest issue number**
   - prefer richest body / longest acceptance text
   - then prefer non-blocked `autonomy:ready`
   - only use highest issue number as a last resort

3. **Emit duplicate-collision telemetry in the work-order step**
   - e.g. `deduped_titles`, `kept_issue`, `suppressed_issue_numbers`
   - so queue poison becomes visible in logs instead of silently influencing selection

4. **Mirror the same guard in `parallel-agent-launcher.sh`**
   - otherwise old side-paths can still bypass canonicalization

5. **Treat backlog cleanup + selector fix as a pair**
   - backlog cleanup reduces noise
   - selector canonicalization prevents the remaining noise from steering execution wrong

## Sharpest handoff
- **PR Opener / queue tooling owner:** fix `build_work_order.py` first; backlog dedupe without selector dedupe still leaks bad work orders
- **CEO / CTO:** do not assume issue cleanup alone repaired autonomous execution quality
- **Auditor:** add a regression check that duplicate ready titles cannot produce multiple possible work orders

## Bottom line
New finding:

**MUTX's queue problem is now partly a selector problem.**

Right now the autonomy dispatcher still rewards the newest duplicate, not the best canonical issue. If the company wants thin, honest execution lanes, it should patch the work-order selector to dedupe titles before choosing what gets built next.

---

# Researcher — 2026-03-19 10:06 Europe/Rome

## Research target
Does the autonomy control tower actually detect a stalled autonomous lane truthfully, or can its queue-health signal look green while autonomous execution is effectively dead?

## Sources checked
- `USER.md`
- `mutx-fleet-state.md`
- `reports/company/ROSTER.md`
- prior `reports/company/researcher.md`
- `.github/workflows/autonomous-dispatch.yml`
- `.github/workflows/autonomous-shipping.yml`
- `docs/autonomy/activation.md`
- `scripts/autonomy/build_work_order.py`
- `scripts/autonomy/execute_work_order.py`
- `scripts/parallel-agent-launcher.sh`

## Material update since last note
Yes.

The new finding is:

**the autonomy queue-health check currently counts _all_ open PRs, not autonomous PRs, so it can report a healthy handoff even when the autonomous pipeline has produced nothing.**

That means MUTX can get a false-green control-tower summary whenever humans or other lanes happen to have any PRs open.

## Local tooling truth

### 1) `autonomous-dispatch.yml` uses the wrong denominator for queue health
In `.github/workflows/autonomous-dispatch.yml`, the `Capture autonomy queue and health` step does this:
- fetches open issues labeled `autonomy:ready`
- fetches **all** open PRs in the repo via `github.rest.pulls.list`
- declares a stall only when `issues.length > 0 && openPrs.length === 0`

So the workflow is not actually measuring:
- open autonomous PRs
- open PRs tied to claimed issues
- open PRs on `autonomy/...` branches
- open PRs created by the autonomous executor

It is measuring **any PR at all**.

### 2) That can mask a completely broken autonomous handoff
Because the health signal treats any repo PR as proof of handoff, this failure mode is possible:
- there are many `autonomy:ready` issues
- dispatch/work-order selection is broken or dry-run only
- no autonomous branch or PR gets created
- but one unrelated manual PR is open
- queue health still avoids the `stalled queue handoff` violation

So the control tower can look nominal while the actual autonomy lane is dead.

### 3) The docs currently reinforce the same misleading contract
`docs/autonomy/activation.md` says the dispatch workflow:
- writes `autonomy-queue-health.json`
- hard-fails when both open `autonomy:ready` issues and open PRs are zero
- logs a queue-handoff violation when ready issues exist but open PRs are zero

That wording matches the implementation, but the implementation itself is too broad.

The problem is not doc drift here.
The problem is that the documented health contract is not autonomy-specific enough to be operationally trustworthy.

### 4) The rest of the stack is issue/branch-specific, which makes the health metric stand out as the weak link
Other autonomy pieces are already narrower:
- `build_work_order.py` chooses one issue
- `execute_work_order.py` creates an issue-specific branch like `autonomy/{agent}/issue-{n}-...`
- stale-claim release logic tries to detect an open PR for the claimed branch

So the system already has the identity needed for better health accounting.
But the top-level queue-health snapshot throws that specificity away and falls back to repo-wide PR count.

### 5) This can distort company decisions, not just dashboards
If MUTX uses the queue-health summary to decide whether autonomy is flowing, it can make the wrong call:
- think backlog → PR handoff is working
- postpone fixing selector/claim/executor breakage
- keep a dead lane alive because unrelated repo activity is masking the symptom

For a control plane company, that is the exact kind of observability lie the product itself is trying to avoid.

## Actionable insight
**Patch autonomy queue health to count autonomous handoff artifacts only — not arbitrary repo PRs.**

## Recommended shortlist
1. **Redefine `open_pull_requests` in `autonomous-dispatch.yml`**
   - count only PRs whose head branch starts with `autonomy/`
   - or count only PRs linked to currently claimed issues
   - or expose both repo-wide PR count and autonomy-specific PR count, but use the autonomy-specific number for violations

2. **Rename the metric so the summary cannot overclaim**
   - `open_autonomy_pull_requests`
   - not generic `open_pull_requests`

3. **Tighten the stalled-handoff rule**
   - violation when `autonomy:ready` issues exist and `open_autonomy_pull_requests === 0`
   - optionally stronger: violation when ready issues exist and there are neither claimed issues nor autonomy PRs

4. **Keep manual repo activity as a separate informational metric**
   - repo-wide open PRs are still useful context
   - they should not be used as proof that autonomous dispatch is functioning

5. **Mirror the same truthfulness in docs and summaries**
   - update `docs/autonomy/activation.md`
   - update workflow summary text so operators know whether they are looking at repo throughput or autonomous throughput

## Sharpest handoff
- **Auditor:** verify the queue-health artifact stops treating manual PRs as evidence of autonomous handoff
- **PR Opener / autonomy tooling owner:** patch the dispatch workflow first; otherwise the system can self-report healthy while doing nothing
- **CEO / CTO:** do not use current queue-health green-ness as proof the autonomy lane is alive

## Bottom line
New finding:

**MUTX's autonomy control tower currently has a false-green health metric.**

The dispatch workflow counts any open PR as successful queue handoff, so unrelated manual activity can hide a completely stalled autonomous pipeline. The next truthful fix is to make queue health autonomy-specific.
