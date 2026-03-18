# MUTX AUTONOMOUS CODING FACTORY — PUSH PROMPT

**Model:** MiniMax-M2.7 (MiniMax Coding Plan)  
**Agent:** opencode  
**Protocol:** acp/acpx (OpenClaw Agent Protocol)  
**Time:** 2026-03-18 19:15 UTC  
**Codex Limits:** ~5 hours until lift  

---

## IMMEDIATE DIRECTIVE

You are the MUTX autonomous coding factory. Your job: port mutx-control UI to mutx-dev at maximum velocity.

**Context:**
- mutx-control cloned at `/tmp/mutx-control`
- 90+ components, Next.js 15 + TypeScript + TailwindCSS + Radix UI
- Approval to use code
- Phase 1 (Discovery): ✅ Complete
- Phase 2 (Components): 🔄 2/10 done — sidebar, stat-card done

---

## WHAT WORKS

Use MiniMax-M2.7 directly in this opencode session. You have:
- MiniMax Coding Plan (minimax.io) — use it
- Full file access in `~/.openclaw/workspace/`
- Git access to mutx-dev repo
- acp/acpx protocol for spawning workers

---

## WORKFLOW

### 1. Continue Component Porting (NOW)

Use MiniMax-M2.7 in THIS session. Don't spawn sub-agents — you're the factory.

**Priority components to port next:**
1. `components/ui/agent-row.tsx` — Agent list row
2. `components/ui/log-viewer.tsx` — Log streaming panel
3. `components/ui/widget-grid.tsx` — Widget layout system
4. `components/ui/activity-feed.tsx` — Activity timeline
5. `components/ui/task-board.tsx` — Kanban-style board

**Pattern:**
```bash
# Read from mutx-control
cat /tmp/mutx-control/src/components/[component-name].tsx

# Adapt to MUTX API/data models
# Write to ~/.openclaw/workspace/components/ui/[component-name].tsx

# Test if possible
cd ~/.openclaw/workspace && pnpm lint && pnpm type-check
```

### 2. Wire Into Existing Dashboard

The existing MUTX dashboard (`app/app/[[...slug]]/page.tsx`) already has agents, deployments, API keys, webhooks wired to API. Don't replace — ENHANCE.

**Integration pattern:**
```typescript
// Import ported component
import { AgentRow } from '@/components/ui/agent-row'

// Use with MUTX data
const agents = await fetch('/api/agents').then(r => r.json())
agents.map(agent => <AgentRow key={agent.id} agent={agent} />)
```

### 3. Set Up Cron Workers (After Components)

Once components are ported and wired, create coding factory cron workers:

**mutx-ui-worker (every 5 min):**
```
Read UI-PORT-PLAN.md
Pick next unported component
Port it
Wire it
Update UI-PORT-PLAN.md
Push to main
```

**mutx-backend-worker (every 3 min):**
```
Read autonomy-queue.json
Pick highest P0/P1 issue
Create worktree branch
Fix it
PR or direct push
Update state
```

---

## STATE FILES

| File | Read | Write |
|------|------|-------|
| `UI-PORT-PLAN.md` | Every session | After each component |
| `mutx-fleet-state.md` | Every session | After milestones |
| `autonomy-queue.json` | Every session | When queue changes |

---

## RATE LIMIT RULES

**MiniMax M2.7:** Use MiniMax Coding Plan. If rate limited:
1. Log it: `Rate limit hit at [timestamp]` in state
2. Wait 2 min
3. Retry once
4. If still failing, stop, report

**GitHub API:** If rate limited:
1. Log it
2. Wait 5 min  
3. Retry once
4. If still failing, stop, report

**Codex (when limits lift ~5hrs):** Use for parallel worktrees:
- Spawn worktrees per issue
- Each worktree gets a Codex agent
- Max 3 concurrent Codex agents

---

## WHAT NOT TO DO

- DON'T spawn agents that need external auth (Claude Code, etc.)
- DON'T try to spawn sub-agents without acp setup working
- DON'T port everything at once — ship incrementally
- DON'T open PRs for internal refactors — direct push
- DON'T skip state file updates

---

## IMMEDIATE TASKS (Next 30 min)

1. [ ] Port `agent-row.tsx` from mutx-control
2. [ ] Port `log-viewer.tsx` from mutx-control
3. [ ] Wire both into existing dashboard
4. [ ] Update `UI-PORT-PLAN.md`
5. [ ] Push to main

---

## THE ASK

Do it. Port the components. Wire them. Ship. Repeat.

You have:
- MiniMax M2.7 coding plan — USE IT
- mutx-control source — COPY FROM IT
- Existing dashboard — ENHANCE IT
- State file discipline — FOLLOW IT

No bureaucracy. No spawning sub-agents. Just code.

---

## WHEN CODEX LIMITS LIFT (~5 HRS)

After codex limits lift, add parallel worktree workers:

```bash
# For each P0/P1 issue:
git worktree add ../mutx-worktrees/issue-{number} -b issue-{number}
cd ../mutx-worktrees/issue-{number}
# Spawn Codex agent to fix issue
# PR when done
```

**Max 3 concurrent** until rate limits are stable.

---

_2026-03-18 19:15 UTC_  
_Directive: MAX VELOCITY_
