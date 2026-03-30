# Posting Workflow — @mutxdev X Account

## Post a Single Tweet

1. Navigate to `https://x.com` (or click the Compose button if available)
2. **Click the textbox first** — this is critical, X drops keystrokes otherwise
3. Type your tweet text
4. Click **Post** / **Submit**
5. Wait 3–5 seconds, then verify the tweet appears on your profile timeline
6. Capture the post URL for engagement tracking

## Reply to a Tweet

1. Navigate to the target post URL
2. Click the **Reply** button (speech bubble icon)
3. **Click the reply textbox first** before typing
4. Type your reply
5. Click **Reply** / **Post**
6. Wait and verify the reply appears under the original tweet

## Post a Thread (CORRECT METHOD)

The "+" button for chaining tweets is **broken**. Do not use it. Instead:

1. Post **tweet 1** of the thread (follow the single tweet workflow above)
2. Navigate to tweet 1's URL (or refresh your profile)
3. Click the **Reply** button on tweet 1
4. **Click the reply textbox first**, then type tweet 2
5. Post the reply — this now threads as tweet 2
6. Navigate to tweet 2's URL
7. Click **Reply** on tweet 2
8. **Click the reply textbox first**, then type tweet 3
9. Repeat for each subsequent tweet

**Pattern:** Each tweet continues the thread by replying to the previous tweet. Tweet N+1 is always a reply to Tweet N.

## Quote-RT

1. Find the tweet you want to quote-RT
2. Click the **Quote** button (not the RT/Retweet button)
3. A compose dialog opens with the original tweet embedded
4. **Click the reply textbox first**, then type your comment
5. Optionally add media from `workspace-x/queue/media_blueprints.md`
6. Click **Post** / **Quote**
7. Verify the quote-RT appears in your timeline

Note: The quote-RT dialog structure is: click Quote → type in the textbox → click Post. Do not confuse this with the standard RT flow.

## Verify a Post Went Through

After posting or replying:

1. Navigate to your profile: `https://x.com/mutxdev`
2. Scroll to find the post (or search for a keyword)
3. Confirm the post text matches what you intended
4. Capture the URL: `https://x.com/mutxdev/status/<tweet_id>`

If the post doesn't appear within 10 seconds, check:
- Was the textbox clicked before typing?
- Did you click the correct submit button?
- Is the @mutxdev session still authenticated?

## Check Engagement

See `references/engagement-check.md` for full details.

Quick check:
1. Navigate to the post URL: `https://x.com/mutxdev/status/<tweet_id>`
2. Look at the reply bar — views, likes, retweets, quotes are shown
3. Compare against baseline: good engagement for @mutxdev is typically views >> likes >> retweets (technical audience)

## Media

When a post calls for media, reference `workspace-x/queue/media_blueprints.md` for the correct asset:
- **repo-update** posts: terminal proof still, architecture card, or dashboard crop
- **quote-RT** posts: text-first quote card, no fake product UI
- **media-hook** posts: terminal proof still or branded card
- Fallback: generated social card from `artifacts/social-cards/`

## Voice Reminders

- Lead with operational outcomes (MTTR, incident surface, governance)
- Use enterprise/procurement language (compliance-ready, audit trail, policy enforcement)
- Never: "real install", "actual bootstrap", "not just vibes", "CLI demo path" in the post itself
- Posts should sound like something a CTO or VP Eng would endorse
