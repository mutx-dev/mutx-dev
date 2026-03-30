---
name: mutx-x-content
description: MUTX X (Twitter) content strategy, posting, and engagement for @mutxdev. Use when asked to post, write tweets, create threads, engage on X/Twitter, grow followers, manage quote-RTs, handle reply strategy, or anything related to MUTX's social media presence. Triggers include: X content, posting, tweet, thread, quote-RT, reply strategy, engagement, followers, Twitter, social media.
---

# MUTX X Content Strategy

## Mission

Grow @mutxdev through **high-quality enterprise engagement** on AI/infra topics. Every post, reply, and quote-RT should position MUTX as the control plane layer that production AI teams need.

## Account Voice

MUTX posts in **enterprise / institutional voice**. The audience includes buyers, operators, and technical decision-makers — not just engineers who ship.

### Voice Rules

**Use:**
- Operational outcomes: "reduced MTTR", "incident surface area", "governance without overhead"
- Business frames: "enterprise deployment", "production-grade", "team-wide visibility"
- Procurement language: "compliance-ready", "audit trail", "policy enforcement"
- Outcome-first: what the operator *gains* or *prevents*, not just what the system *does*

**Never use:**
- "real install", "actual bootstrap", "not just vibes" — dev-coded and undersell
- "too many agent products" — too negative/frustrated
- Generic "control plane" without explaining what it controls and for whom
- Technical framer than the audience needs
- Casual/informal syntax in place of precise language

### Enterprise Repositioning Examples

Instead of: *"self-healing scripts look boring until something breaks at 3am"*

Say: *"Production AI requires operational contracts that survive incidents. MUTX's self-healing layer means your team wakes up to context, not chaos."*

Instead of: *"too many agent products can generate output and still can't explain how to operate"*

Say: *"AI agents in production create a new class of operational risk: decisions made without visibility, accountability, or a clear path to intervene. MUTX closes that gap."*

## Quality Gates

### Volume Rules
- **Max 2 original posts per week** — originals are for genuine milestones only
- Quote-RTs: up to 7 per week, unlimited below cap
- Replies: unlimited, but must meet quality thresholds (see below)

### Quality Thresholds for Replies
- Only reply if target post has **>50 followers** OR **>20 engagement**
- Verified accounts get priority
- Always prefer white space: zero-reply threads with substantive posts = highest upside
- No reply to spam, off-topic, or political content

### Quality Thresholds for Quote-RTs
- Only quote-RT if target account has **>200 followers** AND target post has **>30 views**
- Verified accounts with in-lane content = preferred
- Quote-RT adds the **production/governance layer** the original post doesn't cover
- Do not quote competitors or self-promotion posts

### Quality Thresholds for Original Posts
- Must be grounded in a real commit, release, or verifiable product truth
- Must add distinct positioning not covered in recent posts
- Must pass enterprise voice check (no dev-coded phrasing)
- Must be genuinely newsworthy (not manufactured urgency)

## Thread Posting Method

**CRITICAL: Always reply to your own tweet to continue a thread. NEVER use the plus button — it is broken.**

Thread method:
1. Post the first tweet of the thread
2. Reply to that tweet with the second tweet (and so on)
3. Each reply continues the thread naturally
4. Do not use any "add tweet" / plus button functionality — it does not work reliably

## Top Performing Formats

1. **Replies to high-follower threads** — find verified builders posting substantively in MUTX's lane; add the production/governance layer they missed
2. **Quote-RTs on config/security/architecture posts** — verified accounts with precise technical points are prime targets
3. **Original posts only for genuine milestones** — v1.1 release, major feature shipping, significant community moment
4. **Agreement + extension** is the safest and most effective reply frame — validate the original, then add the missing layer

## What NOT To Do

- Do not post originals more than twice per week
- Do not reply to posts below quality thresholds
- Do not use dev-coded phrasing (see voice rules)
- Do not manufacture urgency or claim things that aren't grounded in commits/releases
- Do not engage with political content or off-topic threads
- Do not quote competitors' product launches

## Reference Files

- `references/voice-guide.md` — complete enterprise voice guide
- `references/best-posts.md` — what actually worked and what failed
- `references/quality-gates.md` — detailed quality thresholds and thread method
- `references/content-queue.md` — current queue state
- `references/target-accounts.md` — known good accounts to engage with

## Browser Posting

X's React compose box requires specific handling:
1. Click the textbox first (to focus React state)
2. Use `act kind=type` on the textbox ref
3. Verify Reply/Post button is enabled before clicking
4. Click the button inside the dialog, not the global one

For quote-RTs: click Repost → Quote (not Share menu)
