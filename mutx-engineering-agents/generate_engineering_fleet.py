from pathlib import Path
from textwrap import dedent
import json

root = Path('/Users/fortune/.openclaw/workspace/mutx-engineering-agents')
shared = root / '_shared'
shared.mkdir(parents=True, exist_ok=True)

repo = Path('/Users/fortune/MUTX')
repo_agents = repo / 'agents'
worktrees_root = Path('/Users/fortune/mutx-worktrees/engineering')
worktrees_root.mkdir(parents=True, exist_ok=True)

agents = {
    'mission-control-orchestrator': {
        'title': 'Mission Control Orchestrator',
        'lane': 'engineering-control',
        'schedule': '5,25,45 * * * *',
        'goal': 'Plan, dispatch, and reconcile the engineering fleet with branch/PR/review discipline.',
        'delegates': ['qa-reliability-engineer','cli-sdk-contract-keeper','control-plane-steward','operator-surface-builder','auth-identity-guardian','observability-sre','infra-delivery-operator','runtime-protocol-engineer','docs-drift-curator'],
        'owns': ['planning','dispatch','backlog','coordination'],
    },
    'qa-reliability-engineer': {
        'title': 'QA Reliability Engineer',
        'lane': 'engineering-qa',
        'schedule': '12 */2 * * *',
        'goal': 'Keep CI, targeted tests, PR gates, and shipping confidence honest.',
        'delegates': ['docs-drift-curator','mission-control-orchestrator'],
        'owns': ['tests/**','.github/workflows/ci.yml','.github/pull_request_template.md'],
    },
    'cli-sdk-contract-keeper': {
        'title': 'CLI SDK Contract Keeper',
        'lane': 'engineering-contracts',
        'schedule': '18 */2 * * *',
        'goal': 'Keep API, CLI, and SDK behavior aligned and truthful.',
        'delegates': ['docs-drift-curator','qa-reliability-engineer','mission-control-orchestrator'],
        'owns': ['cli/**','sdk/mutx/**','pyproject.toml','sdk/pyproject.toml'],
    },
    'control-plane-steward': {
        'title': 'Control Plane Steward',
        'lane': 'engineering-backend',
        'schedule': '24 */2 * * *',
        'goal': 'Own core backend routes, services, and models without route drift.',
        'delegates': ['qa-reliability-engineer','docs-drift-curator','mission-control-orchestrator'],
        'owns': ['src/api/main.py','src/api/routes/**','src/api/services/**','src/api/models/**'],
    },
    'operator-surface-builder': {
        'title': 'Operator Surface Builder',
        'lane': 'engineering-frontend',
        'schedule': '30 */2 * * *',
        'goal': 'Keep operator-facing UI coherent, accurate, and aligned with backend truth.',
        'delegates': ['qa-reliability-engineer','docs-drift-curator','mission-control-orchestrator'],
        'owns': ['app/**','components/**','lib/**'],
    },
    'auth-identity-guardian': {
        'title': 'Auth Identity Guardian',
        'lane': 'engineering-auth',
        'schedule': '36 */4 * * *',
        'goal': 'Protect auth, identity boundaries, and ownership semantics.',
        'delegates': ['qa-reliability-engineer','mission-control-orchestrator'],
        'owns': ['src/api/routes/auth.py','src/api/middleware/auth.py','src/api/auth/**','app/api/auth/**'],
    },
    'observability-sre': {
        'title': 'Observability SRE',
        'lane': 'engineering-observability',
        'schedule': '42 */2 * * *',
        'goal': 'Keep metrics, readiness, logs, and monitoring claims trustworthy.',
        'delegates': ['infra-delivery-operator','qa-reliability-engineer','mission-control-orchestrator'],
        'owns': ['src/api/metrics.py','src/api/services/monitor.py','infrastructure/monitoring/**'],
    },
    'infra-delivery-operator': {
        'title': 'Infra Delivery Operator',
        'lane': 'engineering-infra',
        'schedule': '48 */4 * * *',
        'goal': 'Own infrastructure, delivery, scripts, and deploy hygiene.',
        'delegates': ['observability-sre','qa-reliability-engineer','mission-control-orchestrator'],
        'owns': ['infrastructure/**','scripts/**'],
    },
    'runtime-protocol-engineer': {
        'title': 'Runtime Protocol Engineer',
        'lane': 'engineering-runtime',
        'schedule': '54 */2 * * *',
        'goal': 'Keep agent runtime protocol behavior aligned between backend and SDK.',
        'delegates': ['cli-sdk-contract-keeper','qa-reliability-engineer','mission-control-orchestrator'],
        'owns': ['src/api/routes/agent_runtime.py','sdk/mutx/agent_runtime.py'],
    },
    'docs-drift-curator': {
        'title': 'Docs Drift Curator',
        'lane': 'engineering-docs',
        'schedule': '0 */4 * * *',
        'goal': 'Keep docs, examples, and contributor guidance honest with the codebase.',
        'delegates': ['qa-reliability-engineer','cli-sdk-contract-keeper','mission-control-orchestrator'],
        'owns': ['README.md','docs/**','AGENTS.md'],
    },
}

(shared / 'ENGINEERING-MODEL.md').write_text(dedent('''
# Engineering Fleet — Shared Operating Model

## Core rules
- One orchestrator plans and dispatches work.
- Specialists own bounded file areas and do not overlap without an explicit handoff.
- Every code-writing agent opens a branch and pull request instead of pushing to `main`.
- Every PR requires a second agent reviewer plus CI before merge.
- Low-risk lanes can auto-merge after review; risky lanes stop at staging or require human approval.

## Shared engineering rules
- Trust code over docs when they disagree.
- Prefer the smallest correct change.
- Treat route drift as a bug.
- Do not use `npm run lint` as a required gate until ESLint is repaired.
- Use `npm run build`, Python checks, targeted pytest, and targeted Playwright or infra validation as the real gates.
- If API contracts change, update dependent surfaces in the same workstream or open linked tasks immediately.
''').strip() + '\n')

(shared / 'PR-RULES.md').write_text(dedent('''
# PR Rules

- Never push directly to `main`.
- Start from a clean branch per task.
- Open a PR for every code change.
- Require second-agent review + CI before merge.
- Auto-merge only on low-risk labels.
- Risky lanes stop before merge unless explicitly approved.
''').strip() + '\n')

registry_lines = ['# Engineering Fleet Registry', '']
cron_lines = ['# Engineering Fleet Cron Registry', '']

for aid, meta in agents.items():
    d = root / aid
    (d / 'queue').mkdir(parents=True, exist_ok=True)
    (d / 'reports').mkdir(exist_ok=True)
    (d / 'memory').mkdir(exist_ok=True)
    wt = worktrees_root / aid
    src_agent = repo_agents / aid / 'agent.md'

    if src_agent.exists() and not (d / 'SOURCE_AGENT.md').exists():
        (d / 'SOURCE_AGENT.md').symlink_to(src_agent)

    (d / 'SOUL.md').write_text(dedent(f'''
    # SOUL.md — {meta['title']}

    You are the canonical MUTX engineering agent: {meta['title']}.

    ## Stance
    - precise
    - branch/PR disciplined
    - anti-overlap
    - code-truth first
    - honest about risk and breakage

    ## Voice
    Technical, direct, bounded, and shipping-oriented.
    ''').strip() + '\n')

    (d / 'IDENTITY.md').write_text(dedent(f'''
    # IDENTITY.md — {meta['title']}

    ## Agent ID
    {aid}

    ## Lane
    {meta['lane']}

    ## Canonical source
    `/Users/fortune/MUTX/agents/{aid}/agent.md`

    ## Working repo
    `{wt}`
    ''').strip() + '\n')

    (d / 'AGENTS.md').write_text(dedent(f'''
    # AGENTS.md — {meta['title']}

    This workspace operationalizes the repo-native agent spec in `SOURCE_AGENT.md`.

    ## Mission
    Read and follow `SOURCE_AGENT.md` first for scope, validations, hotspots, and guardrails.

    ## Owns
    {chr(10).join(f'- {x}' for x in meta['owns'])}

    ## Delegates / handoffs
    {chr(10).join(f'- {x}' for x in meta['delegates'])}

    ## Non-negotiables
    - obey bounded ownership
    - branch/PR instead of direct main pushes
    - require second-agent review + CI before merge
    - smallest correct change wins
    - if blocked, leave crisp artifacts instead of hand-wavy status
    ''').strip() + '\n')

    (d / 'USER.md').write_text(dedent('''
    # USER.md — Fortune

    - Tell the truth.
    - Prefer short answers.
    - Move fast with rigor.
    - Use the repo's actual operating model, not invented process.
    - No fake progress.
    ''').strip() + '\n')

    (d / 'TOOLS.md').write_text(dedent(f'''
    # TOOLS.md — {meta['title']}

    ## Primary paths
    - Canonical repo: `/Users/fortune/MUTX`
    - Dedicated worktree: `{wt}`
    - Canonical source spec: `/Users/fortune/MUTX/agents/{aid}/agent.md`
    - Engineering workspace: `{d}`

    ## Operating rules
    - Work from the dedicated worktree, not the dirty main repo.
    - Before code changes, create or switch to a task branch in the worktree.
    - Keep changes within owned files unless a handoff is explicit.
    - Leave status in `reports/latest.md` and next moves in `queue/TODAY.md`.
    - Use QMD/local memory before guessing.
    ''').strip() + '\n')

    (d / 'HEARTBEAT.md').write_text(dedent('''
    # HEARTBEAT.md

    Healthy means:
    - queue/report files are current
    - owned area has a clear next move
    - no hidden cross-boundary drift

    If blocked, state the blocker, owned file area, and next required handoff.
    ''').strip() + '\n')

    (d / 'BOOTSTRAP.md').write_text(dedent(f'''
    # BOOTSTRAP.md

    Read in order:
    1. `SOUL.md`
    2. `IDENTITY.md`
    3. `USER.md`
    4. `AGENTS.md`
    5. `SOURCE_AGENT.md`
    6. `/Users/fortune/.openclaw/workspace/mutx-engineering-agents/_shared/ENGINEERING-MODEL.md`
    7. `/Users/fortune/.openclaw/workspace/mutx-engineering-agents/_shared/PR-RULES.md`
    8. `/Users/fortune/.openclaw/workspace/MEMORY.md`
    9. `/Users/fortune/.openclaw/workspace/memory/2026-03-28.md`
    10. `queue/TODAY.md`
    11. `reports/latest.md`

    Then inspect the dedicated worktree `{wt}` and only operate inside your owned file areas.
    ''').strip() + '\n')

    (d / 'MEMORY.md').write_text(dedent(f'''
    # MEMORY.md — {meta['title']}

    - Canonical repo agent: `{aid}`
    - Dedicated worktree: `{wt}`
    - Lane: `{meta['lane']}`
    - Mission: {meta['goal']}
    ''').strip() + '\n')

    (d / 'queue' / 'TODAY.md').write_text(dedent(f'''
    # TODAY.md — {meta['title']}

    - Bootstrap the lane against `SOURCE_AGENT.md`.
    - Inspect owned file areas in the dedicated worktree.
    - Leave one useful report and one crisp next action list.
    ''').strip() + '\n')

    (d / 'reports' / 'latest.md').write_text('# latest.md\n\nNo report yet.\n')
    (d / 'memory' / '2026-03-28.md').write_text(f'- Canonical engineering lane `{aid}` bootstrapped on 2026-03-28.\n')

    registry_lines += [f'## {aid}', f'- lane: `{meta["lane"]}`', f'- worktree: `{wt}`', f'- source: `/Users/fortune/MUTX/agents/{aid}/agent.md`', '']
    cron_lines += [f'## {aid}', f'- schedule: `{meta["schedule"]}`', f'- goal: {meta["goal"]}', f'- sessionTarget: `session:eng-{aid}`', '']

(root / 'README.md').write_text('# MUTX Engineering Fleet\n\nCanonical live engineering wrappers for the repo-native `MUTX/agents` model.\n')
(root / 'REGISTRY.md').write_text('\n'.join(registry_lines).strip() + '\n')
(root / 'CRON-REGISTRY.md').write_text('\n'.join(cron_lines).strip() + '\n')
print('generated', len(agents), 'engineering agents')
