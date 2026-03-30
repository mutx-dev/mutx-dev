# Engagement Check — @mutxdev X Account

## Quick Engagement Check (Per Post)

1. Navigate to the post URL: `https://x.com/mutxdev/status/<tweet_id>`
2. Look at the reply bar below the post — it shows:
   - **Views** (eye icon) — impression count
   - **Likes** (heart icon) — likes count
   - **Retweets** (arrows) — RT count
   - **Quotes** — quote-RT count
   - **Replies** — reply count
3. Record these numbers in the worker state file

## Engagement Baseline for @mutxdev

MUTX's audience is technical/enterprise. Expected engagement ratio:

| Metric | Typical Range |
|--------|---------------|
| Views | 100–1000+ (depends on posting time) |
| Likes | 5–50 (1–10% of views for technical content) |
| Retweets | 2–20 |
| Quotes | 0–5 |
| Replies | 0–5 |

**Good engagement:** views >> likes >> retweets. This ratio is healthy for a niche technical account.

**Warning signs:**
- 0 views after 30 minutes — post may have failed
- Likes > views (impossible mechanically, indicates a bug)
- Views plateauing at <50 — post is not being distributed

## X Analytics Dashboard

For deeper engagement data:

1. Navigate to: `https://x.com/mutxdev/analytics`
2. Or: `https://analytics.x.com/` (requires login)
3. The analytics dashboard shows:
   - Tweet impressions over time
   - Engagement rate per tweet
   - Top tweets
   - Follower growth
   - Profile visits

Note: X Analytics has a delay (typically 24–48 hours for full data).

## When to Delete a Poorly-Performing Post

Delete a post when:
- It has <10 views after 2+ hours and contains errors
- It posted the wrong content (typos in key claims, broken links)
- It contradicts a subsequent post
- It's a duplicate of a recent post

**Do NOT delete just because engagement is low** — low engagement on technical content is normal. Focus on correctness over virality.

See `references/deletion-workflow.md` for how to delete.

## Tracking Engagement Over Time

After posting:
1. Wait at least 1 hour before checking engagement
2. Check again at 4 hours and 24 hours
3. Log the numbers in `workspace-x/worker_state.json`:
   ```json
   {
     "posted_tweets": [
       {
         "tweet_id": "12345",
         "posted_at": "2026-03-24T10:00:00Z",
         "content_hash": "sha...",
         "engagement_1h": { "views": 150, "likes": 8, "rt": 3 },
         "engagement_24h": { "views": 400, "likes": 22, "rt": 9 }
       }
     ]
   }
   ```

## Deleting Poor Posts

If a post needs deletion:
1. Navigate to the post URL
2. Click the more button (⋯ or 更多)
3. Select **Delete**
4. Confirm the deletion
5. Verify the post no longer appears on the profile

See `references/deletion-workflow.md` for full details.

## Post-Completion Checklist

After any post or thread:
- [ ] Post URL captured in state
- [ ] 1-hour engagement check scheduled
- [ ] Any media assets used match the blueprint category
- [ ] Post text follows enterprise voice rules
