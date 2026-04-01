# MUTX GTM Planning — Gamma Deck

---

## Slide 1 — The Hook
# Everyone is building AI agents.
# Nobody is operating them.

---

## Slide 2 — The Problem
# The gap nobody is talking about

- Agent deployment = easy
- Agent operations = the unsolved layer
- "We have 3 agents. We have no idea what they're doing 80% of the time."
- "Our agent went off-script. We found out from a customer."
- "We can't track agent costs. Finance keeps asking."
- "Dev deployed it. Ops has zero visibility."

---

## Slide 3 — What MUTX Is
# The control plane for AI agents

- Deploy — standardized, reproducible launch
- Operate — observe behavior, track costs, catch drift
- Govern — lifecycle control, access governance, honest contracts
- Observe — real-time visibility into what agents are actually doing

---

## Slide 4 — The Wedge
# Agent frameworks vs. agent operations

- Frameworks help you BUILD agents
- MUTX helps you RUN them for real
- The gap: everyone deploys, nobody operates
- That's where MUTX lives

---

## Slide 5 — The Tech Stack
# What we actually built

**4 operator surfaces — all real:**

- FastAPI control plane + Postgres + Redis
- Next.js operator dashboard at app.mutx.dev
- Python CLI (mutx agents list, deploy, logs...)
- Python SDK (MutxAsyncClient for programmatic access)

**Core API routes (all live):**
- /v1/agents — register, configure, deploy, stop, monitor
- /v1/deployments — lifecycle: restart, scale, rollback, versions
- /v1/runs + /v1/sessions — track what agents actually did
- /v1/api-keys — per-agent credential management
- /v1/webhooks — event-driven integrations
- /v1/budgets — cost governance per agent
- /v1/monitoring + /v1/health + /v1/ready

**Infrastructure:**
- Docker + Docker Compose (local dev: make dev)
- Railway for hosted deployment
- Terraform + Ansible foundations
- Prometheus + Grafana monitoring config

---

## Slide 6 — The Business Model
# How MUTX makes money

**Open-core:**
- Core platform — OSS and free
- Enterprise features — paid

**What enterprises pay for:**
- Hosted control plane (managed SaaS)
- Advanced governance + audit trails
- SLA-backed support
- Enterprise integrations (SSO, SOC2 compliance tooling)
- Multi-tenant isolation

**BYOK-friendly:**
- Not a model reseller
- Customers bring their own API keys
- MUTX doesn't markup LLM calls

**Why this matters to buyers:**
- No vendor lock-in on model costs
- Clear separation: infrastructure cost vs. model cost
- Transparent platform, not opaque markup

---

## Slide 7 — Competitive Position
# Who else is in this space

| Competitor | What they do | MUTX delta |
|---|---|---|
| LangChain / LangGraph | Agent building framework | MUTX = the ops layer after build |
| Langfuse / LangSmith | Observability (what happened) | MUTX = control plane (what runs next, who decides) |
| CrewAI | Multi-agent flows | MUTX = deployment lifecycle + governance |
| Kealu | Enterprise trust layer | MUTX = open, extensible, OSS-first |

**The key insight:**
Most tools help you BUILD or OBSERVE agents.
MUTX helps you OPERATE them.
Different job. Becomes critical once agents hit production.

---

## Slide 8 — Who This Is For
# ICP: Where we play

**Primary: Mid-market AI-forward companies**
- $5M–$50M ARR
- Series A–C
- Actively deploying agents in production
- Multiple agents, minimal ops tooling

**Enterprise: AI teams inside large orgs**
- Innovation lab / Platform / AI COE
- VP Engineering, Director of Platform, Head of AI
- Needs governance for compliance

**Indie / small teams**
- <10 people running multiple agents
- Fast sales cycle, good for case studies
- Lower ACV

---

## Slide 9 — Who NOT to sell to
# Anti-ICP

- "We're thinking about agents" — not ready
- Single agent doing simple tasks — not painful enough
- Enterprises with massive internal AI platforms — displacement problem
- AI researchers / academics — different problem space

---

## Slide 10 — The Offer
# What you actually get

**Quick win**
- Working agent deployed + observed same day
- Cost tracking visible immediately
- Rollback without rebuilding

**Long-term**
- Scale from 1 to 100 agents
- Full governance, audit trails, cost attribution
- Infrastructure, not a point solution

---

## Slide 11 — The Table Test
# How to get in the room with big players

- **Clarity** — You understand their specific problem. You did homework.
- **Focus** — You do one thing. You're serious about it.
- **Attitude** — You have conviction. You're not hedging.
- **Benefit** — Concrete. Not "we help you manage agents."
- **Action plan** — A proposal. A pilot. A demo. Something concrete.
- **Objection handling** — You already know what they'll push back on.

---

## Slide 12 — Objection Playbook
# Top 5 objections + answers

**"We built this ourselves"**
→ You built the agent. Not the ops layer. Different problem.

**"Agents are just scripts"**
→ Until they go off-script. Then it's an operational crisis.

**"We don't have this problem"**
→ You do. You just haven't named it yet.

**"Too early to think about governance"**
→ You're already exposed. Question is: govern or react?

**"Expensive"**
→ What's the cost of your last agent incident?

---

## Slide 13 — The Session Goal
# 1 hour. 3 decisions.

1. **Who is ICP #1** — which segment do we go after first
2. **What is the offer** — our one-sentence positioning statement
3. **What is the first move** — one concrete outreach action

---

## Slide 14 — Next Steps
# Who's doing what by when

- [ ] Schedule the follow-up session
- [ ] Draft outreach message for ICP #1
- [ ] Prepare the demo environment
- [ ] Set a 2-week milestone

---

## Session Context (don't show — prep only)

**The partner bring:**
- 10 years building businesses
- $50k invested in knowledge + access
- Network of founders + operators who are actively deploying agents
- Her insight: big players need to feel you've thought through everything before they take the meeting

**The opportunity:**
- Agent ops is wide open as a category
- Nobody owns the "we run agents for real" position yet
- MUTX has real product — backend + CLI + UI

**The risk:**
- Going too broad too fast
- Targeting the wrong ICP
- Leading with features instead of pain

**Product maturity (honest):**
- Core control plane: real and working
- SDK: async contract gaps still being closed (#114)
- CLI: lags backend surface slightly
- Monitoring/self-heal: wiring incomplete (#39)
- Queue governance: enforcement missing (#112)
- RAG: placeholder until vector storage wired
- Scheduler: unmounted, placeholder logic
- Vault: infrastructure stub, not live secret management
