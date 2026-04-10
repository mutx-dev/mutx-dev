#!/usr/bin/env python3
"""
MUTX Gap Scanner v3 — CTO-Grade Code Analysis
Analyzes codebase directly for engineering gaps. No GitHub issues dependency.
Generates actionable work items for the autonomous shipping queue.
"""
import os, json, re, glob
from pathlib import Path
from datetime import datetime, timedelta
import os
_REPO = None
def _get_repo():
    global _REPO
    if _REPO:
        return _REPO
    # MUTX_REPO env var takes priority (for CI/cross-clone use)
    _REPO = os.environ.get("MUTX_REPO")
    if _REPO and Path(_REPO).exists():
        return _REPO
    # Fall back to repo root relative to this file
    _REPO = str(Path(__file__).resolve().parents[2])
    return _REPO
REPO = _get_repo()

REPO     = "REPO"
QUEUE    = f"{REPO}/mutx-engineering-agents/dispatch/action-queue.json"
GH_REPO  = "mutx-dev/mutx-dev"

TODOS_RE = re.compile(r'(TODO|FIXME|HACK|XXX|BUG|NOTE):\s*(.+)', re.I)
PRIORITY_MAP = {'critical': 'p1', 'security': 'p1', 'bug': 'p2', 'fixme': 'p2', 'hack': 'p3', 'todo': 'p3'}

def scan_todos():
    """Find TODOs/FIXMEs that represent real engineering work."""
    items = []
    for pattern in [
        f"{REPO}/**/*.py",
        f"{REPO}/**/*.ts",
        f"{REPO}/**/*.tsx",
        f"{REPO}/**/*.js",
    ]:
        for path in glob.glob(pattern, recursive=True):
            skip = any(s in path for s in ['node_modules', '.venv', '__pycache__', '.git', 'venv', 'dist', 'build'])
            if skip:
                continue
            try:
                with open(path) as f:
                    lines = f.readlines()
                for i, line in enumerate(lines):
                    m = TODOS_RE.search(line)
                    if m:
                        tag, desc = m.groups()
                        priority = PRIORITY_MAP.get(tag.lower(), 'p3')
                        rel_path = path.replace(REPO + '/', '')
                        # Only create items for significant TODOs (not trivial ones)
                        if len(desc.strip()) > 10 and not desc.strip().startswith('remove'):
                            items.append({
                                'id': f"todo-{rel_path.replace('/','-')}-{i}",
                                'title': f"[{tag}] {desc.strip()[:80]}",
                                'description': f"File: {rel_path}:{i+1}\n\nTODO: {desc.strip()}",
                                'area': 'backend' if path.endswith('.py') else 'frontend',
                                'priority': priority,
                                'status': 'queued',
                                'source': 'gap-scanner:todos'
                            })
            except:
                pass
    return items[:15]  # cap at 15 TODOs

def scan_untested():
    """Find SDK modules without test coverage."""
    items = []
    sdk_path = f"{REPO}/sdk/mutx"
    test_path = f"{REPO}/tests"

    if not os.path.exists(sdk_path):
        return items

    modules = []
    for f in glob.glob(f"{sdk_path}/*.py"):
        name = os.path.basename(f).replace('.py', '')
        if name.startswith('_'):
            continue
        modules.append(name)

    tested = set()
    for f in glob.glob(f"{test_path}/test_*.py"):
        name = os.path.basename(f).replace('test_', '').replace('.py', '')
        # Handle async and contract variants
        for variant in [name, name.replace('_contract', '').replace('_async', '')]:
            tested.add(variant)
            tested.add(f"{variant}_contract")
            tested.add(f"{variant}_async")

    for module in sorted(modules):
        if module not in tested:
            items.append({
                'id': f"coverage-{module}",
                'title': f"Add coverage for SDK module `{module}`",
                'description': f"No test file found: tests/test_{module}.py\n\nModule: sdk/mutx/{module}.py\n\nAdd pytest coverage.",
                'area': 'backend',
                'priority': 'p2',
                'status': 'queued',
                'source': 'gap-scanner:untested-modules'
            })

    return items[:10]

def scan_error_handling():
    """Find functions without try/except or error handling."""
    items = []
    for pattern in [f"{REPO}/sdk/mutx/*.py"]:
        for path in glob.glob(pattern):
            name = os.path.basename(path).replace('.py', '')
            if name.startswith('_'):
                continue
            with open(path) as f:
                content = f.read()

            # Find functions that lack error handling
            functions = re.findall(r'def (\w+)\([^)]*\):', content)
            try_blocks = re.findall(r'try:', content)
            has_broad_except = 'except:' in content or 'except Exception' in content

            # If file has >3 functions but <2 try blocks, likely missing error handling
            if len(functions) > 3 and len(try_blocks) < 2 and not has_broad_except:
                items.append({
                    'id': f"error-{name}",
                    'title': f"Add error handling to `sdk/mutx/{name}.py`",
                    'description': f"File has {len(functions)} functions but minimal error handling.\n\nReview and add try/except blocks, logging, and graceful degradation.",
                    'area': 'backend',
                    'priority': 'p3',
                    'status': 'queued',
                    'source': 'gap-scanner:error-handling'
                })
    return items[:5]

def scan_deps():
    """Check for outdated dependencies."""
    items = []
    reqs = f"{REPO}/requirements.txt"
    if os.path.exists(reqs):
        with open(reqs) as f:
            content = f.read()
        # Flag very old packages or known insecure versions
        outdated = {
            'urllib3': '2.0+ has breaking changes but better security',
            'requests': '2.32+ has security fixes',
            'sqlalchemy': '2.0+ has async improvements',
        }
        for pkg, note in outdated.items():
            if re.search(rf'{pkg}[=<>~\-]+\d', content):
                items.append({
                    'id': f"dep-{pkg}",
                    'title': f"Update `{pkg}` dependency",
                    'description': f"{pkg} may be outdated. {note}.",
                    'area': 'infra',
                    'priority': 'p3',
                    'status': 'queued',
                    'source': 'gap-scanner:deps'
                })
    return items[:5]

def scan_api_docs():
    """Find API endpoints without docstrings."""
    items = []
    for path in glob.glob(f"{REPO}/app/api/*.py"):
        name = os.path.basename(path).replace('.py', '')
        if name.startswith('_'):
            continue
        with open(path) as f:
            content = f.read()
        routes = re.findall(r'@(router\.)?(get|post|put|patch|delete)\(["\']([^"\']+)["\']\)', content)
        docstrings = re.findall(r'"""[^"]+"""', content)
        if len(routes) > 3 and len(docstrings) < len(routes) * 0.5:
            items.append({
                'id': f"docs-{name}",
                'title': f"Document API endpoints in `app/api/{name}.py`",
                'description': f"Found {len(routes)} routes but only {len(docstrings)} docstrings. Add OpenAPI docs.",
                'area': 'backend',
                'priority': 'p3',
                'status': 'queued',
                'source': 'gap-scanner:api-docs'
            })
    return items[:5]

def get_existing_ids():
    """Get IDs of already-queued items to avoid duplicates."""
    if not os.path.exists(QUEUE):
        return set()
    with open(QUEUE) as f:
        d = json.load(f)
    return {item['id'] for item in d.get('items', []) if item.get('status') == 'queued'}

def main():
    print(f"[gap-scanner] Running at {datetime.now().isoformat()}", flush=True)

    existing = get_existing_ids()
    new_items = []

    scanners = [
        ('TODOs/FIXMEs', scan_todos),
        ('Untested modules', scan_untested),
        ('Error handling gaps', scan_error_handling),
        ('Outdated dependencies', scan_deps),
        ('API documentation gaps', scan_api_docs),
    ]

    for name, scanner_fn in scanners:
        try:
            items = scanner_fn()
            for item in items:
                if item['id'] not in existing:
                    new_items.append(item)
                    existing.add(item['id'])
                    print(f"  + {item['id']}: {item['title'][:60]}", flush=True)
                else:
                    print(f"    (skip) {item['id']}", flush=True)
        except Exception as e:
            print(f"  [!] {name} scanner error: {e}", flush=True)

    if not new_items:
        print("[gap-scanner] No new gaps found.", flush=True)
        return

    # Merge into queue
    if os.path.exists(QUEUE):
        with open(QUEUE) as f:
            d = json.load(f)
    else:
        d = {'version': '1.1', 'generated': datetime.now().isoformat(), 'items': []}

    # Add new items, keep existing queued items
    existing_ids = {i['id'] for i in d['items'] if i.get('status') == 'queued'}
    for item in new_items:
        if item['id'] not in existing_ids:
            d['items'].append(item)
            existing_ids.add(item['id'])

    d['generated'] = datetime.now().isoformat()

    with open(QUEUE, 'w') as f:
        json.dump(d, f, indent=2)

    print(f"[gap-scanner] Added {len(new_items)} items. Queue size: {len(d['items'])}", flush=True)

if __name__ == '__main__':
    main()
