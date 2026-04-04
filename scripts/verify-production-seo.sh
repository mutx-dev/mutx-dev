#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SITE_URL="${SITE_URL:-https://mutx.dev}"
PYTHON_BIN="${PYTHON_BIN:-python3}"

"$PYTHON_BIN" - <<'PY'
import json
import re
import sys
import urllib.request
from urllib.error import HTTPError

import os

site_url = os.environ.get('SITE_URL', 'https://mutx.dev').rstrip('/')

checks = {
    'homepage': {
        'url': f'{site_url}/',
        'canonical': f'{site_url}',
        'title_contains': 'MUTX',
        'og_url': f'{site_url}',
        'require_jsonld': True,
    },
    'download': {
        'url': f'{site_url}/download',
        'canonical': f'{site_url}/download',
        'title_contains': 'Download for macOS | MUTX',
        'og_url': f'{site_url}/download',
    },
    'releases': {
        'url': f'{site_url}/releases',
        'canonical': f'{site_url}/releases',
        'title_contains': 'Releases | MUTX',
        'og_url': f'{site_url}/releases',
    },
    'contact': {
        'url': f'{site_url}/contact',
        'canonical': f'{site_url}/contact',
        'title_contains': 'Contact | MUTX',
        'og_url': f'{site_url}/contact',
    },
    'docs_reference': {
        'url': f'{site_url}/docs/api/reference',
        'canonical': f'{site_url}/docs/api/reference',
        'title_contains': 'MUTX Docs',
        'og_url': f'{site_url}/docs/api/reference',
    },
}

required_robots_tokens = [
    'Disallow: /api/',
    'Disallow: /dashboard',
    'Disallow: /control',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /forgot-password',
    'Disallow: /reset-password',
    'Disallow: /onboarding',
    f'Sitemap: {site_url}/sitemap.xml',
]

required_sitemap_routes = [
    f'{site_url}/download',
    f'{site_url}/releases',
    f'{site_url}/contact',
    f'{site_url}/docs',
    f'{site_url}/docs/api/reference',
    f'{site_url}/docs/architecture',
    f'{site_url}/docs/deployment/quickstart',
]

req_headers = {'User-Agent': 'MUTX SEO verifier/1.0'}


def fetch(url: str):
    request = urllib.request.Request(url, headers=req_headers)
    with urllib.request.urlopen(request, timeout=20) as response:
        body = response.read().decode('utf-8', 'ignore')
        headers = {key.lower(): value for key, value in response.headers.items()}
        status = response.status
    return status, headers, body


def extract(pattern: str, body: str):
    match = re.search(pattern, body, re.I | re.S)
    return match.group(1).strip() if match else None


def expect(condition: bool, message: str, failures: list[str]):
    if not condition:
        failures.append(message)


failures: list[str] = []

try:
    _, manifest_headers, manifest_body = fetch(f'{site_url}/manifest.webmanifest')
    manifest_content_type = manifest_headers.get('content-type', '')
    expect('application/manifest+json' in manifest_content_type or 'application/json' in manifest_content_type,
           'manifest.webmanifest returned unexpected content-type', failures)
    manifest = json.loads(manifest_body)
    expect(manifest.get('name') == 'MUTX', 'manifest name is not MUTX', failures)
    expect(manifest.get('theme_color') == '#060810', 'manifest theme_color drifted', failures)
except HTTPError as error:
    failures.append(f'manifest.webmanifest returned HTTP {error.code}')
except Exception as error:
    failures.append(f'manifest.webmanifest validation failed: {error}')

try:
    _, _, robots_body = fetch(f'{site_url}/robots.txt')
    for token in required_robots_tokens:
        expect(token in robots_body, f'robots.txt missing: {token}', failures)
except HTTPError as error:
    failures.append(f'robots.txt returned HTTP {error.code}')
except Exception as error:
    failures.append(f'robots.txt validation failed: {error}')

try:
    _, _, sitemap_body = fetch(f'{site_url}/sitemap.xml')
    for route in required_sitemap_routes:
        expect(route in sitemap_body, f'sitemap.xml missing route: {route}', failures)
except HTTPError as error:
    failures.append(f'sitemap.xml returned HTTP {error.code}')
except Exception as error:
    failures.append(f'sitemap.xml validation failed: {error}')

for label, spec in checks.items():
    try:
        _, headers, body = fetch(spec['url'])
    except HTTPError as error:
        failures.append(f'{label} returned HTTP {error.code}')
        continue
    except Exception as error:
        failures.append(f'{label} fetch failed: {error}')
        continue

    canonical = extract(r'<link rel="canonical" href="(.*?)"', body)
    title = extract(r'<title>(.*?)</title>', body)
    og_url = extract(r'<meta property="og:url" content="(.*?)"', body)
    twitter_title = extract(r'<meta name="twitter:title" content="(.*?)"', body)
    robots_meta = extract(r'<meta name="robots" content="(.*?)"', body)
    jsonld_blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', body, re.I | re.S)

    expect(canonical == spec['canonical'], f'{label} canonical mismatch: {canonical!r} != {spec["canonical"]!r}', failures)
    expect(title is not None and spec['title_contains'] in title, f'{label} title missing expected text', failures)
    expect(og_url == spec['og_url'], f'{label} og:url mismatch: {og_url!r} != {spec["og_url"]!r}', failures)
    expect(twitter_title is not None and spec['title_contains'] in twitter_title, f'{label} twitter:title missing expected text', failures)
    if label.startswith('docs_') or label in {'homepage', 'download', 'releases', 'contact'}:
        expect(robots_meta is not None and 'index' in robots_meta.lower(), f'{label} missing indexable robots meta', failures)
    if spec.get('require_jsonld'):
        expect(len(jsonld_blocks) > 0, f'{label} missing JSON-LD', failures)

if failures:
    print('MUTX production SEO verification failed:', file=sys.stderr)
    for failure in failures:
        print(f'- {failure}', file=sys.stderr)
    sys.exit(1)

print(f'MUTX production SEO verification passed for {site_url}')
PY
