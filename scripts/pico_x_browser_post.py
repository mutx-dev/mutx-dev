#!/usr/bin/env python3
import csv
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
LOG_CSV = REPO_ROOT / 'docs/pico-gtm/x-post-log.csv'
QUEUE_CSV = REPO_ROOT / 'docs/pico-gtm/x-post-queue.csv'
CONTACT_LOG_CSV = REPO_ROOT / 'docs/pico-gtm/contact-log.csv'
CONTACT_QUEUE_CSV = REPO_ROOT / 'docs/pico-gtm/contact-queue.csv'
LEAD_TRACKER_CSV = REPO_ROOT / 'docs/pico-gtm/lead-tracker.csv'
X_BROWSER_LOGIN_ENV = Path('/Users/fortune/.hermes/profiles/mutx/.x-browser-login.env')
X_BROWSER_AUTH_FILE = Path('/Users/fortune/.hermes/profiles/mutx/.x-browser-auth.json')
HELPER_SCRIPT = REPO_ROOT / 'scripts/pico_x_browser_post_helper.mjs'
DEFAULT_ACCOUNT = 'mutxdev'
CHROME_EXECUTABLE = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
COOKIE_SOURCES = [
    Path('/Users/fortune/.hermes/x-browser-profile/Default/Cookies'),
    Path('/Users/fortune/Library/Application Support/Google/Chrome/Profile 6/Cookies'),
    Path('/Users/fortune/Library/Application Support/Google/Chrome/Profile 5/Cookies'),
]


def now_local() -> datetime:
    return datetime.now().astimezone()


def default_headless() -> bool:
    return os.getenv('X_BROWSER_HEADLESS', '1').strip().lower() not in {'0', 'false', 'no'}


def load_browser_login_creds():
    if not X_BROWSER_LOGIN_ENV.exists():
        return {}
    creds = {}
    for line in X_BROWSER_LOGIN_ENV.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        creds[key] = value
    return creds


def read_csv(path: Path):
    if not path.exists():
        return [], []
    with path.open(newline='') as handle:
        reader = csv.DictReader(handle)
        headers = reader.fieldnames or []
        rows = []
        for row in reader:
            row = {key: value for key, value in row.items() if key is not None}
            if not any((value or '').strip() for value in row.values()):
                continue
            rows.append(row)
    return headers, rows


def write_csv(path: Path, headers, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def append_csv_row(path: Path, headers, row):
    path.parent.mkdir(parents=True, exist_ok=True)
    exists = path.exists()
    with path.open('a', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
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


def parse_cookie_header(cookie_header: str):
    cookies = []
    for part in cookie_header.split(';'):
        item = part.strip()
        if not item or '=' not in item:
            continue
        name, value = item.split('=', 1)
        cookies.append({'name': name.strip(), 'value': value.strip(), 'url': 'https://x.com'})
    return cookies


def to_playwright_cookies(jar):
    cookies = []
    for cookie in jar:
        payload = {
            'name': cookie.name,
            'value': cookie.value,
            'domain': cookie.domain or '.x.com',
            'path': cookie.path or '/',
            'secure': bool(cookie.secure),
        }
        if cookie.expires and cookie.expires > 0:
            payload['expires'] = float(cookie.expires)
        if cookie._rest.get('HttpOnly') is not None or cookie.has_nonstandard_attr('HttpOnly'):
            payload['httpOnly'] = True
        cookies.append(payload)
    return cookies


def normalize_auth_bundle(raw_bundle: dict, bundle_name: str):
    cookie_header = (raw_bundle.get('cookie_header') or raw_bundle.get('Cookie') or '').strip()
    cookies = []
    if cookie_header:
        cookies = parse_cookie_header(cookie_header)
    elif isinstance(raw_bundle.get('cookies'), dict):
        cookies = [{'name': key, 'value': value, 'url': 'https://x.com'} for key, value in raw_bundle['cookies'].items()]
    elif isinstance(raw_bundle.get('cookies'), list):
        for cookie in raw_bundle.get('cookies', []):
            if not isinstance(cookie, dict) or not cookie.get('name') or not cookie.get('value'):
                continue
            normalized = dict(cookie)
            if 'url' not in normalized and 'domain' not in normalized:
                normalized['url'] = 'https://x.com'
            cookies.append(normalized)

    names = {cookie.get('name') for cookie in cookies}
    if 'auth_token' not in names or 'ct0' not in names:
        return None

    source_name = raw_bundle.get('name') or bundle_name
    return {
        'name': source_name,
        'auth_source': raw_bundle.get('auth_source') or 'cookie_bundle',
        'cookie_source': raw_bundle.get('cookie_source') or f'{X_BROWSER_AUTH_FILE}:{source_name}',
        'cookies': cookies,
    }


def load_auth_sources():
    sources = []
    diagnostics = []

    if X_BROWSER_AUTH_FILE.exists():
        try:
            raw = json.loads(X_BROWSER_AUTH_FILE.read_text())
        except json.JSONDecodeError as exc:
            diagnostics.append(f'{X_BROWSER_AUTH_FILE}: invalid json ({exc})')
        else:
            bundles = raw.get('bundles', []) if isinstance(raw, dict) else raw if isinstance(raw, list) else []
            if not bundles:
                diagnostics.append(f'{X_BROWSER_AUTH_FILE}: no bundles found')
            for index, bundle in enumerate(bundles, start=1):
                if not isinstance(bundle, dict):
                    diagnostics.append(f'{X_BROWSER_AUTH_FILE}: bundle_{index} is not an object')
                    continue
                normalized = normalize_auth_bundle(bundle, f'bundle_{index}')
                if normalized is None:
                    diagnostics.append(f'{X_BROWSER_AUTH_FILE}: {bundle.get("name") or f"bundle_{index}"} missing auth_token/ct0')
                    continue
                sources.append(normalized)
    else:
        diagnostics.append(f'{X_BROWSER_AUTH_FILE}: missing')

    if importlib.util.find_spec('browser_cookie3') is not None:
        import browser_cookie3

        for cookie_file in COOKIE_SOURCES:
            if not cookie_file.exists():
                diagnostics.append(f'{cookie_file}: missing')
                continue
            try:
                jar = browser_cookie3.chrome(cookie_file=str(cookie_file), domain_name='x.com')
                cookies = to_playwright_cookies(jar)
            except Exception as exc:  # pragma: no cover - live machine integration
                diagnostics.append(f'{cookie_file}: {exc}')
                continue
            names = {cookie.get('name') for cookie in cookies}
            if 'auth_token' in names and 'ct0' in names:
                sources.append(
                    {
                        'name': cookie_file.name,
                        'auth_source': 'cookie_db',
                        'cookie_source': str(cookie_file),
                        'cookies': cookies,
                    }
                )
            else:
                diagnostics.append(f'{cookie_file}: missing auth_token/ct0')
    else:
        diagnostics.append('browser_cookie3 unavailable')

    return sources, diagnostics


def run_helper(action: str, *, target_url: str = '', reply_text: str = '', headless=None):
    if not HELPER_SCRIPT.exists():
        raise RuntimeError(f'helper script missing: {HELPER_SCRIPT}')

    auth_sources, diagnostics = load_auth_sources()
    creds = load_browser_login_creds()
    login_credentials = None
    if creds.get('X_USERNAME') and creds.get('X_PASSWORD'):
        login_credentials = {
            'username': creds['X_USERNAME'].strip(),
            'password': creds['X_PASSWORD'].strip(),
        }

    if not auth_sources and not login_credentials:
        raise RuntimeError('no usable X auth sources configured: ' + ' | '.join(diagnostics))

    payload = {
        'action': action,
        'chrome_executable': CHROME_EXECUTABLE,
        'expected_account': DEFAULT_ACCOUNT,
        'auth_sources': auth_sources,
        'login_credentials': login_credentials,
        'target_url': target_url,
        'reply_text': reply_text,
        'headless': default_headless() if headless is None else headless,
    }

    with tempfile.NamedTemporaryFile('w', delete=False, suffix='.json') as handle:
        json.dump(payload, handle)
        input_path = Path(handle.name)

    try:
        result = subprocess.run(
            ['node', str(HELPER_SCRIPT), str(input_path)],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
    finally:
        input_path.unlink(missing_ok=True)

    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip() or 'unknown helper failure'
        raise RuntimeError(detail)

    try:
        return json.loads(result.stdout.strip())
    except json.JSONDecodeError as exc:
        raise RuntimeError(f'helper returned invalid json: {exc}: {result.stdout.strip()}') from exc


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
    return run_helper('reply', target_url=target_url, reply_text=reply_text)


def probe_reply(target_url: str, reply_text: str):
    return run_helper('probe', target_url=target_url, reply_text=reply_text, headless=True)


def locate_reply(reply_text: str):
    return run_helper('locate', reply_text=reply_text, headless=True)


def check_session():
    return run_helper('check', headless=True)


def main():
    if len(sys.argv) == 2 and sys.argv[1] == '--check':
        print(json.dumps(check_session()))
        return

    if len(sys.argv) >= 3 and sys.argv[1] == '--probe':
        target_url = sys.argv[2]
        reply_text = sys.argv[3] if len(sys.argv) > 3 else 'Probe only. Do not send.'
        print(json.dumps(probe_reply(target_url, reply_text)))
        return

    if len(sys.argv) >= 3 and sys.argv[1] == '--locate':
        reply_text = sys.argv[2]
        print(json.dumps(locate_reply(reply_text)))
        return

    if len(sys.argv) < 3:
        print('Usage: pico_x_browser_post.py <target_url> <reply_text> [action_type] | --check | --probe <target_url> [reply_text] | --locate <reply_text>', file=sys.stderr)
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
            'posted_verified via playwright; '
            f'auth_source={result["auth_source"]}; '
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
        print(json.dumps({'target_url': target_url, 'reply_url': reply_url, 'account': account}))
    except Exception as exc:
        log_post(target_url, action_type, DEFAULT_ACCOUNT, reply_text, 'failed', str(exc))
        update_queue_status(target_url, reply_text, 'failed', str(exc))
        print(f'FAILED: {exc}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
