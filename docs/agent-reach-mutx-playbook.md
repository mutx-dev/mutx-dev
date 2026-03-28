# Agent Reach for MUTX

_Last updated: 2026-03-28_

## Status

Agent Reach is installed locally via `pipx` and its OpenClaw skill is registered at:
- `~/.openclaw/skills/agent-reach`

Current local install result:
- `10/16` channels active
- Working now: GitHub, X/Twitter, Reddit, Bilibili, YouTube, RSS, web/Jina, Exa search, V2EX, WeChat articles
- Partially broken / not configured: Weibo MCP load, Xueqiu connectivity, Xiaoyuzhou (needs Groq key), XiaoHongShu, Douyin, LinkedIn

## Live wiring

Agent Reach is now wired into a live MUTX lane:
- cron: `MUTX Outside-In Intelligence v1`
- jobId: `996120e8-d629-482d-b80f-f3e080a064e6`
- sessionTarget: `session:mutx-outside-in-intelligence`
- schedule: `20 8,13,18 * * *`
- workspace: `mutx-agents/gtm/outside-in-intelligence`

The lane writes a shared `reports/signal-brief.md` and now feeds:
- social-media-strategist
- outbound-strategist
- account-strategist
- developer-advocate
- product-manager
- report-distribution-agent

## What Agent Reach actually is

Agent Reach is **not** a new control plane for MUTX.
It is a **research/discovery scaffolding layer** that installs and wires internet-facing upstream tools so agents can read where operator truth actually lives:
- X
- Reddit
- YouTube
- GitHub
- RSS
- web pages
- niche community channels

That makes it valuable for MUTX as an **outside-in signal layer**, not as core product infrastructure.

## Best use for MUTX

### Primary use: market + operator intelligence
Use Agent Reach to help MUTX answer:
- What are builders/operators actually complaining about this week?
- Which runtime/governance/control-plane problems are recurring across public channels?
- Which threads are worth replying to from @mutxdev?
- Which repos/videos/posts are shaping buyer language?
- Which categories are heating up: agent observability, runtime control, HITL, auditability, retries, orchestration, async agents?

### Why this is high-leverage
This fits MUTX better than using Agent Reach for posting automation because MUTX already has:
- OpenClaw browser lanes
- X reply/orchestration logic
- internal agents for outbound/content/product

What MUTX lacks more than another posting tool is **higher-bandwidth external signal intake**.

So the best role for Agent Reach is:

**discover → filter → summarize → feed MUTX agents**

not

**blindly act on behalf of MUTX**

## Recommended operating model

### 1) Read/search first, act later
Use Agent Reach first as a **read-only intelligence substrate**.

Recommended initial channels:
- X/Twitter search
- Reddit search + read
- GitHub repo/issue search
- YouTube transcript/search
- RSS
- Web/Jina reader
- V2EX / WeChat article monitoring where relevant

Avoid making it a primary write/posting path for MUTX at first.

### 2) Keep main-account posting in the existing controlled lane
For MUTX, keep public posting/reply execution in the existing OpenClaw + browser-controlled X lane.

Reason:
- cookie-based write paths increase account risk
- the current MUTX X lane already has tone/quality/verification rules
- Agent Reach is better at sourcing than brand-safe execution

### 3) Treat it as a feed into existing MUTX agents
Best pairings:

#### social-media-strategist
Use Agent Reach to surface:
- strong reply targets
- emerging operator narratives
- repeated objections / pain language
- proof-backed thread opportunities

#### outbound-strategist
Use Agent Reach to find:
- prospects publicly discussing agent pain
- design-partner candidate accounts
- problem statements with budget/urgency clues
- communities where MUTX language resonates

#### account-strategist
Use Agent Reach to track:
- named target accounts discussing AI ops
- new launches / incidents / hiring signals
- public evidence of pain or maturity

#### developer-advocate
Use Agent Reach to mine:
- YouTube tutorials
- GitHub repos/issues
- Reddit/V2EX discussions
- tutorial gaps and confusion patterns

#### product-manager / project-shepherd
Use Agent Reach to capture:
- recurring operator failures
- category drift in language
- competitor claim patterns
- proof that specific runtime gaps matter in the wild

## What NOT to use it for

### Not the core MUTX product layer
Do **not** position Agent Reach as part of the MUTX core runtime.
It is an operator-side research substrate.

### Not main-account high-volume automation
Do **not** use cookie-based posting paths on the main MUTX brand account as the default.
Use the existing browser-controlled lane for public output.

### Not an excuse for noisy research
Do **not** create wide, noisy crawls with weak synthesis.
The value is not “more internet.”
The value is **better buyer/operator signal**.

## Best MUTX rollout

### Phase 1 — now
Use Agent Reach for 4 repeatable jobs:

1. **X operator thread sourcing**
   - search terms like: `agent runtime`, `long-running agents`, `human in the loop agents`, `agent control plane`, `ai governance`, `agent observability`

2. **Reddit pain mining**
   - collect real complaints from builders running agents in prod-ish contexts

3. **YouTube transcript mining**
   - extract phrases from tutorials / talks explaining where agent systems break

4. **GitHub issue/repo scanning**
   - find repos/issues where runtime/reliability/governance pain is visible

### Phase 2 — next
Turn outputs into structured internal inputs:
- reply targets for X lane
- content hooks for social-media-strategist
- objection lists for sales-engineer
- wording improvements for technical-writer
- product evidence for product-manager

### Phase 3 — only if useful
Add optional higher-risk or niche channels:
- LinkedIn MCP
- XiaoHongShu
- Douyin
- Xiaoyuzhou

Only do this if MUTX actually has a China-facing or LinkedIn-heavy go-to-market need.

## Concrete MUTX recommendation

If choosing one clear use-case, pick this:

### **Agent Reach = MUTX market sensing layer**

A daily/continuous lane that:
1. watches X + Reddit + GitHub + YouTube
2. extracts high-signal operator pain + buyer language
3. scores it for MUTX relevance
4. feeds top findings into:
   - X replies
   - outbound
   - docs/content
   - product truth audits

That is the highest-leverage fit.

## Suggested first automation lane

Create a bounded “outside-in intelligence” lane that runs 2–3 times/day and outputs:
- top 5 operator pain signals
- top 3 reply-worthy X threads
- top 3 content hooks
- top 3 product/roadmap implications

This is much better than just “installing internet tools everywhere.”

## Example command families now available

- `agent-reach doctor`
- `agent-reach watch`
- `bird search "query" -n 10`
- `gh search repos "query"`
- `yt-dlp --dump-json URL`
- `curl https://r.jina.ai/http://example.com`
- `mcporter call ...` for configured MCP-backed channels

## Recommendation summary

**Install status:** done.

**Best use for MUTX:**
- not as a new execution/control plane
- yes as a **market sensing + operator intelligence layer**
- feed results into existing MUTX GTM/content/product agents
- keep posting/public execution in the existing guarded browser lane
