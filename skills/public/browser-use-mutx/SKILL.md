---
name: browser-use-mutx
description: MUTX X (Twitter) account automation via browser-use. Use when asked to post tweets, reply, thread, quote-RT, like, follow, unfollow, delete posts, or check engagement for the @mutxdev account. Also triggers on: X automation, twitter, browser post, tweet, delete post, like, follow, unfollow, quote-RT, thread, mutx social. For the MUTX account specifically (@mutxdev).
---

# browser-use-mutx

Browser-use automation for the @mutxdev X account. Covers posting, threads, replies, quote-RTs, likes, follows, unfollows, deletion, and engagement checks.

## Critical Rules for X

### The Thread Rule (MOST IMPORTANT)
**The "+" button for chaining tweets is BROKEN on X.** Do NOT use it.
To thread: post tweet 1, then **reply to tweet 1** with tweet 2, then **reply to tweet 2** with tweet 3. Always reply to your own tweet to continue.

### Text Input Rule
**Always click the textbox first, then type.** X's input drops keystrokes if you don't click it first. This applies to composing tweets, replies, and quote-RTs.

### Browser Setup
Use `target="host"` and **omit the profile** for X work. Do not use a specific Chrome profile for X automation.

## Quick Reference

| Action | How |
|--------|-----|
| Post a tweet | Click textbox → type → Post |
| Reply | Navigate to post → Reply button → type → send |
| Thread | Post tweet → reply to it → reply to that → ... |
| Quote-RT | Click Quote → type in textbox → Post |
| Like | Click ⋯ (more) → Like |
| Delete | Click ⋯ (more) → Delete → confirm |
| Check engagement | Navigate to post URL → look for views/likes |
| Follow | Click ⋯ (more) → Follow |
| Unfollow | Click ⋯ (more) → Unfollow |

## Reference Files

- `references/posting-workflow.md` — step-by-step posting, threads, quote-RTs, verification
- `references/x-quirks.md` — all known X browser automation gotchas
- `references/engagement-check.md` — checking views/likes, analytics dashboard
- `references/deletion-workflow.md` — how to delete a tweet

## Voice and Tone

MUTX posts use enterprise/institutional voice. See `references/posting-workflow.md` for full voice rules. Key points:
- Lead with operational outcomes, not dev-coded framing
- Use buyer/procurement language when appropriate
- Avoid hedging, casual syntax, or "CLI demo path" language in posts

## Browser-Use Setup

Standard browser-use pattern for X:
```python
from browser_use import Agent, Browser, ChatBrowserUse

browser = Browser()
agent = Agent(
    task='Your task here',
    llm=ChatBrowserUse(),
    browser=browser,
)
```

Always use `Browser()` without a profile argument for X work. The @mutxdev session should already be logged in.
