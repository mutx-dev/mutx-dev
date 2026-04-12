#!/usr/bin/env python3
import csv
import json
import time
from datetime import datetime, timedelta
from pathlib import Path

import browser_cookie3
from playwright.sync_api import sync_playwright

LOG_CSV = Path('/Users/fortune/MUTX/docs/pico-gtm/x-post-log.csv')
QUEUE_CSV = Path('/Users/fortune/MUTX/docs/pico-gtm/x-post-queue.csv')
CONTACT_LOG_CSV = Path('/Users/fortune/MUTX/docs/pico-gtm/contact-log.csv')
CONTACT_QUEUE_CSV = Path('/Users/fortune/MUTX/docs/pico-gtm/contact-queue.csv')
LEAD_TRACKER_CSV = Path('/Users/fortune/MUTX/docs/pico-gtm/lead-tracker.csv')
DEFAULT_ACCOUNT = 'mutxdev'
CHROME_EXECUTABLE = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
COOKIE_SOURCES = [
    Path('/Users/fortune/Library/Application Support/Google/Chrome/Profile 6/Cookies'),
    Path('/Users/fortune/Library/Application Support/Google/Chrome/Profile 5/Cookies'),
    Path('/Users/fortune/.hermes/x-browser-profile/Default/Cookies'),
]


def now_local() -> datetime:
    return datetime.now().astimezone()


def read_csv(path: Path):
    if not path.exists():
        return [], []
    with path.open(newline='') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = []
        for row in reader:
            row = {k: v for k, v in row.items() if k is not None}
            if not any((v or '').strip() for v in row.values()):
                continue
            rows.append(row)
    return headers, rows


def write_csv(path: Path, headers, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def append_csv_row(path: Path, headers, row):
    path.parent.mkdir(parents=True, exist_ok=True)
    exists = path.exists()
    with path.open('a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        if not exists:
            writer.writeheader()
        writer.writerow(row)


def log_post(target_url: str, action_type: str, account: str, post_text: str, outcome: str, notes: str = ''):
    append_csv_row(
        LOG_CSV,
        ['sent_at', 'target_url', 'action_type', 'account', 'post_text', 'outcome', 'notes'],
        {
            'sent_at': now_local().strftime('%Y-%m-%d %H:%M:%S'),
            'target_url': target_url,
            'action_type': action_type,
            'account': account,
            'post_text': post_text,
            'outcome': outcome,
            'notes': notes,
        },
    )


def load_cookiejar():
    errors = []
    for cookie_file in COOKIE_SOURCES:
        if not cookie_file.exists():
            errors.append(f'{cookie_file}: missing')
            continue
        try:
            jar = browser_cookie3.chrome(cookie_file=str(cookie_file), domain_name='x.com')
            names = {cookie.name for cookie in jar}
            if 'auth_token' in names and 'ct0' in names:
                return jar, str(cookie_file)
            errors.append(f'{cookie_file}: missing auth_token/ct0')
        except Exception as exc:
            errors.append(f'{cookie_file}: {exc}')
    raise RuntimeError('no usable X cookies: ' + ' | '.join(errors))


def to_playwright_cookies(jar):
    cookies = []
    for cookie in jar:
        cookies.append(
            {
                'name': cookie.name,
                'value': cookie.value,
                'domain': cookie.domain,
                'path': cookie.path or '/',
                'expires': float(cookie.expires) if cookie.expires and cookie.expires > 0 else -1,
                'httpOnly': bool(cookie._rest.get('HttpOnly') is not None or cookie.has_nonstandard_attr('HttpOnly')),
                'secure': bool(cookie.secure),
                'sameSite': 'Lax',
            }
        )
    return cookies


def dig_rest_ids(obj):
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key == 'rest_id' and isinstance(value, str) and value.isdigit():
                yield value
            yield from dig_rest_ids(value)
    elif isinstance(obj, list):
        for item in obj:
            yield from dig_rest_ids(item)


def infer_lead_id(target_url: str):
    headers, rows = read_csv(CONTACT_QUEUE_CSV)
    for row in rows:
        if row.get('repo_or_post_url') == target_url:
            return row.get('lead_id') or ''
    headers, rows = read_csv(LEAD_TRACKER_CSV)
    for row in rows:
        if row.get('repo_or_post_url') == target_url:
            return row.get('lead_id') or ''
    return ''


def update_queue_status(target_url: str, reply_text: str, new_status: str, note: str):
    headers, rows = read_csv(QUEUE_CSV)
    if not headers:
        return
    for row in rows:
        if row.get('target_url') == target_url and row.get('reply_text') == reply_text:
            row['status'] = new_status
            row['notes'] = (row.get('notes', '') + (' | ' if row.get('notes') else '') + note).strip()
    write_csv(QUEUE_CSV, headers, rows)


def update_contact_log(lead_id: str, target_url: str, account: str, reply_text: str, reply_url: str):
    next_action = (now_local() + timedelta(days=14)).date().isoformat()
    append_csv_row(
        CONTACT_LOG_CSV,
        ['sent_at', 'lead_id', 'source', 'channel', 'action_type', 'message_summary', 'outcome', 'next_action_date', 'owner', 'notes'],
        {
            'sent_at': now_local().isoformat(timespec='seconds'),
            'lead_id': lead_id,
            'source': 'x',
            'channel': 'x',
            'action_type': 'reply',
            'message_summary': reply_text,
            'outcome': 'sent',
            'next_action_date': next_action,
            'owner': 'hermes',
            'notes': f'Public X reply by @{account} on {target_url}. Reply URL: {reply_url}',
        },
    )


def update_contact_queue(lead_id: str, target_url: str, account: str, reply_url: str):
    headers, rows = read_csv(CONTACT_QUEUE_CSV)
    if not headers:
        return
    cooldown = (now_local() + timedelta(days=14)).date().isoformat()
    note = f'Sent {now_local().date().isoformat()} public X reply as @{account}. Cooldown until {cooldown}. Reply URL: {reply_url}'
    for row in rows:
        if row.get('lead_id') == lead_id or row.get('repo_or_post_url') == target_url:
            row['status'] = 'sent_x_reply'
            row['review_state'] = 'sent'
            row['notes'] = (row.get('notes', '') + (' | ' if row.get('notes') else '') + note).strip()
    write_csv(CONTACT_QUEUE_CSV, headers, rows)


def update_lead_tracker(lead_id: str, target_url: str, account: str, reply_url: str):
    headers, rows = read_csv(LEAD_TRACKER_CSV)
    if not headers:
        return
    last_touch = now_local().date().isoformat()
    next_action = (now_local() + timedelta(days=14)).date().isoformat()
    note = f'Sent {last_touch} public X reply as @{account}. Cooldown until {next_action}. Reply URL: {reply_url}'
    for row in rows:
        if row.get('lead_id') == lead_id or row.get('repo_or_post_url') == target_url:
            row['stage'] = 'contacted_x_reply'
            row['last_touch_date'] = last_touch
            row['next_action_date'] = next_action
            row['status'] = 'contacted'
            row['owner'] = 'hermes'
            row['notes'] = (row.get('notes', '') + (' | ' if row.get('notes') else '') + note).strip()
    write_csv(LEAD_TRACKER_CSV, headers, rows)


def post_reply(target_url: str, reply_text: str):
    cookie_jar, cookie_source = load_cookiejar()
    cookies = to_playwright_cookies(cookie_jar)
    account = DEFAULT_ACCOUNT
    reply_url = 'none'
    mutation_url = None
    mutation_status = None

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME_EXECUTABLE, headless=False)
        context = browser.new_context(viewport={'width': 1400, 'height': 1000})
        context.add_cookies(cookies)
        page = context.new_page()
        page.goto(target_url, wait_until='domcontentloaded', timeout=60000)
        page.wait_for_timeout(6000)

        if page.locator('text=Accept all cookies').count():
            page.locator('text=Accept all cookies').click()
            page.wait_for_timeout(1500)

        profile_link = page.locator('[data-testid="AppTabBar_Profile_Link"]').first
        if profile_link.count():
            href = profile_link.get_attribute('href') or ''
            if href.strip('/'):
                account = href.strip('/').split('/')[-1]

        if 'Log in' in page.locator('body').inner_text()[:2000]:
            raise RuntimeError('cookie session still landed on login wall')

        page.locator('[data-testid="reply"]').first.click(force=True)
        page.wait_for_url('**/compose/post', timeout=15000)
        page.wait_for_timeout(1500)

        textarea = page.locator('[data-testid="tweetTextarea_0"]').first
        textarea.click(force=True)
        page.keyboard.type(reply_text, delay=20)
        page.wait_for_timeout(1200)

        submit = page.locator('[data-testid="tweetButton"]').first
        if not submit.is_enabled():
            raise RuntimeError('reply submit button disabled after typing text')

        with page.expect_response(lambda r: r.request.method == 'POST' and ('CreateTweet' in r.url or 'CreateNoteTweet' in r.url), timeout=30000) as response_info:
            submit.click()

        response = response_info.value
        mutation_url = response.url
        mutation_status = response.status
        payload = response.json()
        page.wait_for_timeout(6000)

        for candidate in dict.fromkeys(dig_rest_ids(payload)):
            if candidate not in target_url:
                reply_url = f'https://x.com/{account}/status/{candidate}'
                break

        with_replies = context.new_page()
        with_replies.goto(f'https://x.com/{account}/with_replies', wait_until='domcontentloaded', timeout=60000)
        with_replies.wait_for_timeout(6000)
        visible = reply_text[:80] in with_replies.locator('body').inner_text()[:12000]
        with_replies.close()
        browser.close()

    if mutation_status != 200:
        raise RuntimeError(f'create-tweet mutation failed http={mutation_status} url={mutation_url}')

    if reply_url == 'none' and not visible:
        raise RuntimeError('mutation returned 200 but reply could not be verified in with_replies view')

    return {
        'account': account,
        'reply_url': reply_url,
        'cookie_source': cookie_source,
        'mutation_status': mutation_status,
        'mutation_url': mutation_url,
    }


def main():
    if len(__import__('sys').argv) < 3:
        print('Usage: pico_x_browser_post.py <target_url> <reply_text> [action_type]', file=sys.stderr)
        sys.exit(2)

    target_url = sys.argv[1]
    reply_text = sys.argv[2]
    action_type = sys.argv[3] if len(sys.argv) > 3 else 'reply'
    lead_id = infer_lead_id(target_url)

    try:
        result = post_reply(target_url, reply_text)
        account = result['account']
        reply_url = result['reply_url']
        note = (
            'posted_verified via playwright cookie session; '
            f'cookie_source={result["cookie_source"]}; '
            f'reply_url={reply_url}'
        )
        log_post(target_url, action_type, account, reply_text, 'posted_verified', note)
        update_queue_status(target_url, reply_text, 'sent', note)
        if lead_id:
            update_contact_log(lead_id, target_url, account, reply_text, reply_url)
            update_contact_queue(lead_id, target_url, account, reply_url)
            update_lead_tracker(lead_id, target_url, account, reply_url)
        print('POSTED_VERIFIED')
        print(json.dumps({'target_url': target_url, 'reply_url': reply_url, 'account': account}, ensure_ascii=False))
    except Exception as exc:
        log_post(target_url, action_type, DEFAULT_ACCOUNT, reply_text, 'failed', str(exc))
        update_queue_status(target_url, reply_text, 'failed', str(exc))
        print(f'FAILED: {exc}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
