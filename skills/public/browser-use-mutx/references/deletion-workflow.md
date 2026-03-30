# Deletion Workflow — @mutxdev X Account

Delete a tweet when it contains errors, wrong content, contradictions, or has genuinely failed (not just low engagement).

## Step-by-Step Deletion

### Step 1: Navigate to the Post

Navigate to the post you want to delete:
- URL format: `https://x.com/mutxdev/status/<tweet_id>`

If direct navigation redirects (see `references/x-quirks.md`):
1. Go to `https://x.com/mutxdev`
2. Scroll to find the post
3. Click on it to open it

### Step 2: Locate the More Button

Find the **⋯** (more) button on the post. It appears in the post's action bar (along with Reply, Retweet, Like, Share).

**Important:** The button may show as:
- `⋯` (ellipsis — most common)
- `More` (English text)
- `更多` (Chinese — appears in some locales/sessions)

If one label isn't found, try matching on the ellipsis character or the aria-label.

### Step 3: Click the More Button

Click the more button. A dropdown menu appears with options:
- Not interested in this post
- Follow / Unfollow
- **Add / remove from Lists**
- **Copy link to post**
- **Embed post**
- **Delete post** ← target
- Report post

The exact options vary by post type and whether it's your own post.

### Step 4: Select Delete

Click **Delete post** in the dropdown.

### Step 5: Handle the Confirmation Dialog

A confirmation dialog appears asking:
- "Delete this post?"
- "This can't be undone."

Click **Delete** to confirm.

The dialog may also have a **Cancel** button — click Delete only if you're certain.

### Step 6: Verify Deletion

After confirming:
1. The post disappears from the timeline
2. Refresh the page or navigate away and back
3. Confirm the post is no longer visible on `https://x.com/mutxdev`

## Deletion Verification Commands

After deletion, run a quick verification:
1. Navigate to `https://x.com/mutxdev`
2. Search for any text from the deleted post
3. Confirm it no longer appears

If the post is still visible, the deletion may have failed — try again or report the issue.

## What NOT to Delete

Do not delete posts for:
- **Low engagement alone** — technical content naturally gets less engagement
- **Age** — old posts are fine to leave up
- **Disagreement** — if the content is correct, leave it

Delete only when:
- The content is factually wrong
- A critical typo was posted
- The post contradicts a newer, corrected post
- It was accidentally posted twice (delete one copy)
- Engagement shows it fundamentally failed (<10 views after 2+ hours)

## State Update After Deletion

After deleting:
1. Remove the deleted tweet from `workspace-x/worker_state.json` under `posted_tweets`
2. Log the deletion in `workspace-x/worker_state.json`:
   ```json
   {
     "deleted_tweets": [
       {
         "tweet_id": "12345",
         "deleted_at": "2026-03-24T12:00:00Z",
         "reason": "factually incorrect claim about X"
       }
     ]
   }
   ```
3. Note: deleted tweets are not recoverable — confirm before deleting
