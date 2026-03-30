# X.com Browser Automation Gotchas

## 1. Text Input Drops Keystrokes

**Problem:** X's text inputs silently drop keystrokes if you don't click the textbox first.

**Fix:** Always click the textbox / compose area before typing. This applies to:
- Composing new tweets
- Replying to tweets
- Quote-RT compose boxes
- DM compose boxes

This is the single most common cause of failed posts.

## 2. The "+" Button Thread Bug

**Problem:** The "+" (add tweet) button in the thread composer does NOT work. It may appear to click but nothing happens, or it triggers an error.

**Correct thread method:** Reply to your own tweet to continue the thread.
- Post tweet 1
- Reply to tweet 1 → tweet 2
- Reply to tweet 2 → tweet 3
- And so on

**Never attempt to use the + button for threading.** Always use the reply-based method.

## 3. The More Button (⋯) Localization

**Problem:** The "more" button (⋯) on posts sometimes renders as "更多" (Chinese for "more") in certain browser states or locales.

**Fix:** When looking for the more/menu button, match on:
- The "⋯" character (ellipsis)
- The text "More" (English)
- The text "更多" (Chinese)
- The aria-label "More" or "更多"

If a post's more button isn't found with one label, try the others. This matters for: Like, Delete, Quote-RT, Follow, Unfollow.

## 4. Direct Post URL Navigation Redirects

**Problem:** Navigating directly to a post URL like `https://x.com/username/status/12345` sometimes redirects to home or a login page instead of showing the post.

**Fix:** When you need to reach a specific post:
1. Navigate to the author's profile first: `https://x.com/username`
2. Scroll to find the post (or use page search)
3. Click on the post from there

Alternatively, navigate to the post URL and wait longer before interacting, but prefer the profile-navigation method for reliability.

## 5. Detecting If a Post Was Published

**Problem:** After clicking Post, X may show a success animation but the post hasn't actually been published. Conversely, the UI may appear unchanged even though the post went through.

**Detection methods:**
- Navigate to `https://x.com/mutxdev` and scan for the post
- The URL bar updates with the new tweet ID on success
- A "Post" button changes state or disappears on success
- The compose area clears on success

**Anti-failure practice:** Always navigate to verify after a post. Do not assume the click succeeded.

## 6. Quote-RT Dialog Structure

The quote-RT flow has a specific UI structure:
1. Click **Quote** (not the standard RT icon)
2. A compose dialog opens with the original tweet embedded at the top
3. **Click the textbox** (not the embedded tweet — it's not clickable)
4. Type your comment
5. Click **Post** (or **Quote**)

Do not attempt to type in the embedded tweet preview — it's for display only.

## 7. Anti-Bot Detection

X actively detects and throttles automated browsers. Considerations:

- **Use `Browser()` without a profile** for X work (omitting profile reduces fingerprinting)
- **Don't post too rapidly** — space actions by 5–10 seconds minimum
- **Avoid exact repeat actions** — vary timing slightly between similar actions
- **Human-like delays** — add small random delays (1–3s) between navigation and action
- If X shows CAPTCHAs or rate-limit errors, stop and report — don't retry the same action

## 8. Logged-In Session State

The @mutxdev browser session should already be authenticated. If the session appears logged out:
1. Check if X requires re-authentication
2. Do NOT attempt to log in from scratch via automation
3. Report the issue — the session needs to be restored manually or via 1Password

## 9. Image/Video Upload in Posts

When adding media to a post:
- Look for the media icon (image/gallery) in the compose toolbar
- Click it to open the file picker or drag-drop zone
- Upload from the local path referenced in `workspace-x/queue/media_blueprints.md`
- Wait for the upload to complete before posting (thumbnail appears)
- Do not attach media that doesn't match the post's blueprint category

## 10. Reply Thread Collapse

When viewing a thread of replies, X sometimes collapses the intermediate reply chain. If you're replying to "tweet 2" of a thread and the UI doesn't clearly show tweet 2's URL:
1. Click the timestamp on tweet 2 to open it in isolation
2. Confirm the URL in the address bar before replying
3. Then proceed with the reply action
