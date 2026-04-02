#!/usr/bin/env python3
"""
MUTX Gap Scanner v4 — CTO Signal Generator
Analyzes codebase directly for engineering gaps. No GitHub issues dependency.
Outputs a human-readable signal file for the CTO (CIPHER) to review and act on.

KEY CHANGE v4: Previously wrote to action-queue.json (dead end, agents couldn't execute).
Now writes to signals/gap-scan signal.md — a readable brief for the orchestrator.
"""
import os, re, glob
from pathlib import Path
from datetime import datetime

_REPO = None
def _get_repo():
    global _REPO
    if _REPO:
        return _REPO
    _REPO = os.environ.get("MUTX_REPO")
    if _REPO and Path(_REPO).exists():
        return _REPO
    _REPO = str(Path(__file__).resolve().parents[2])
    return _REPO

REPO = _get_repo()
SIGNAL_FILE = f"{REPO}/signals/gap-scan signal.md"
GH_REPO = "mutx-dev/mutx-dev"

TODOS_RE = re.compile(r'(TODO|FIXME|HACK|XXX|BUG|NOTE):\s*(.+)', re.I)
PRIORITY_MAP = {'critical': 'p1', 'security': 'p1', 'bug': 'p2', 'fixme': 'p2', 'hack': 'p3', 'todo': 'p3'}

# Items that are noise, not signal
NOISE_PATTERNS = [
    'pgvector',           # Can't install without infra decision
    'This file should not be edited',
    'This is a SHOULD requirement',
    'Full implementation requires',
    'Scheduler feature is planned',
    'TODO: {desc.strip()}',  # gap scanner's own format string literal
    "{desc.strip()}",        # format string in scanner source
    'implement full test coverage',  # meta-comment in daemon
]

def is_noise(desc):
    for pattern in NOISE_PATTERNS:
        if pattern.lower() in desc.lower():
            return True
    return False

def scan_todos():
    """Find TODOs/FIXMEs that represent real engineering work."""
    findings = []
    for pattern in [
        f"{REPO}/**/*.py",
        f"{REPO}/**/*.ts",
        f"{REPO}/**/*.tsx",
    ]:
        for path in glob.glob(pattern, recursive=True):
            skip = any(s in path for s in ['node_modules', '.venv', '__pycache__', '.git', 'venv', 'dist', 'build', 'mutx-engineering-agents'])
            if skip:
                continue
            try:
                with open(path) as f:
                    lines = f.readlines()
                for i, line in enumerate(lines):
                    m = TODOS_RE.search(line)
                    if m:
                        tag, desc = m.groups()
                        desc = desc.strip()
                        rel_path = path.replace(REPO + '/', '')
                        priority = PRIORITY_MAP.get(tag.lower(), 'p3')
                        if len(desc) < 15:
                            continue
                        if is_noise(desc):
                            continue
                        if desc.startswith('remove'):
                            continue
                        # Categorize by area
                        area = 'frontend' if any(ext in path for ext in ['.tsx', '.ts']) else 'backend'
                        effort = 'L' if i < 5 else 'M' if i < 20 else 'H'
                        findings.append({
                            'type': 'TODO',
                            'tag': tag,
                            'desc': desc[:100],
                            'file': f"{rel_path}:{i+1}",
                            'area': area,
                            'priority': priority,
                            'effort': effort
                        })
            except:
                pass
    return findings[:20]

def scan_untested():
    """Find SDK modules without test coverage."""
    findings = []
    sdk_path = f"{REPO}/sdk/mutx"
    test_path = f"{REPO}/tests"

    if not os.path.exists(sdk_path):
        return findings

    modules = []
    for f in glob.glob(f"{sdk_path}/*.py"):
        name = os.path.basename(f).replace('.py', '')
        if name.startswith('_'):
            continue
        modules.append(name)

    tested = set()
    for f in glob.glob(f"{test_path}/test_*.py"):
        name = os.path.basename(f).replace('test_', '').replace('.py', '')
        for variant in [name, name.replace('_contract', '').replace('_async', '').replace('_sdk_', '_')]:
            tested.add(variant)
            tested.add(f"{variant}_contract")
            tested.add(f"{variant}_async")
            # Also handle sdk/ prefix (test_sdk_agents_contract.py → agents)
            for strip in ['sdk_', 'test_sdk_', 'api_', 'cli_']:
                tested.add(variant.replace(strip, ''))
                tested.add(variant.replace(strip, '') + '_contract')

    for module in sorted(modules):
        if module not in tested:
            findings.append({
                'type': 'Coverage',
                'desc': f"Add coverage for SDK module `{module}`",
                'file': f"sdk/mutx/{module}.py",
                'area': 'backend',
                'priority': 'p2',
                'effort': 'L'
            })
    return findings[:10]

def scan_deps():
    """Check for outdated dependencies."""
    findings = []
    reqs = f"{REPO}/requirements.txt"
    if os.path.exists(reqs):
        with open(reqs) as f:
            content = f.read()
        outdated = {
            'urllib3': ('2.0+ has breaking changes but better security', 'p3'),
            'requests': ('2.32+ has security fixes', 'p2'),
            'sqlalchemy': ('2.0+ has async improvements', 'p3'),
        }
        for pkg, (note, priority) in outdated.items():
            if re.search(rf'{pkg}[=<>~\-]+\d', content):
                findings.append({
                    'type': 'Dependency',
                    'desc': f"Update `{pkg}` — {note}",
                    'file': 'requirements.txt',
                    'area': 'infra',
                    'priority': priority,
                    'effort': 'L'
                })
    return findings[:5]

def write_signal(high, medium, noise):
    """Write a human-readable signal brief for the CTO."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    lines = [
        f"# Gap Scan Signal — {now}",
        "",
        f"**Total findings**: {len(high) + len(medium)} | **High**: {len(high)} | **Medium**: {len(medium)} | **Noise filtered**: {len(noise)}",
        "",
    ]

    if high:
        lines += ["## 🔴 High Priority (do this week)", ""]
        for item in sorted(high, key=lambda x: x['priority']):
            lines.append(f"- [{item['area']}] [{item['priority']}] {item['desc']} | {item['file']} | effort: {item['effort']}")
        lines.append("")

    if medium:
        lines += ["## 🟡 Medium Priority (backlog)", ""]
        for item in sorted(medium, key=lambda x: x['priority']):
            lines.append(f"- [{item['area']}] [{item['priority']}] {item['desc']} | {item['file']} | effort: {item['effort']}")
        lines.append("")

    if noise:
        lines += ["## 🔇 Noise (ignored or deferred)", ""]
        for item in noise[:10]:
            lines.append(f"- [noise] {item['file']} — {item['desc'][:60]}")
        if len(noise) > 10:
            lines.append(f"_... and {len(noise) - 10} more noise items_")
        lines.append("")

    lines += [
        "---",
        "*Generated by gap-scanner v4. Signal file — not an action queue.*",
        "*CTO (CIPHER) reviews and spawns coding agents as appropriate.*",
    ]

    os.makedirs(os.path.dirname(SIGNAL_FILE), exist_ok=True)
    with open(SIGNAL_FILE, 'w') as f:
        f.write('\n'.join(lines))

    return len(high), len(medium), len(noise)

def main():
    print(f"[gap-scanner-v4] Running at {datetime.now().isoformat()}", flush=True)
    print(f"[gap-scanner-v4] Repo: {REPO}", flush=True)

    high = []
    medium = []
    noise = []

    scanners = [
        ('TODOs/FIXMEs', scan_todos),
        ('Untested modules', scan_untested),
        ('Outdated dependencies', scan_deps),
    ]

    for name, scanner_fn in scanners:
        try:
            findings = scanner_fn()
            for f in findings:
                if f['priority'] in ['p1', 'p2']:
                    high.append(f)
                else:
                    medium.append(f)
            print(f"  [{name}] {len(findings)} findings", flush=True)
        except Exception as e:
            print(f"  [!] {name} scanner error: {e}", flush=True)

    # Classify noise from high/medium that matches noise patterns
    real_high = []
    for item in high:
        if is_noise(item.get('desc', '')):
            noise.append(item)
        else:
            real_high.append(item)

    real_medium = []
    for item in medium:
        if is_noise(item.get('desc', '')):
            noise.append(item)
        else:
            real_medium.append(item)

    h, m, n = write_signal(real_high, real_medium, noise)
    print(f"[gap-scanner-v4] Signal written: {h} high, {m} medium, {n} noise filtered", flush=True)
    print(f"[gap-scanner-v4] → {SIGNAL_FILE}", flush=True)

if __name__ == '__main__':
    main()
