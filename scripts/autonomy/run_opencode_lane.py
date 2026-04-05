from __future__ import annotations

import argparse
import json
import shlex
import subprocess
from pathlib import Path
from typing import Any

from failure_classifier import classify_failure, extract_retry_after_seconds


DEFAULT_MODEL = 'minimax/MiniMax-M2.7'
TS_SYNTAX_SUFFIXES = {'.ts', '.tsx', '.js', '.jsx'}


def load_work_order(path: str) -> dict[str, Any]:
    return json.loads(Path(path).read_text())


def build_prompt(work_order: dict[str, Any]) -> str:
    allowed_paths = '\n'.join(f'- {path}' for path in work_order.get('allowed_paths', []))
    verification = '\n'.join(f'- {cmd}' for cmd in work_order.get('verification', []))
    constraints = '\n'.join(f'- {item}' for item in work_order.get('constraints', []))
    return f'''You are the OpenCode frontend worker for MUTX.

Task ID: {work_order['id']}
Title: {work_order['title']}
Lane: {work_order['lane']}
Worktree: {work_order['worktree']}

Description:
{work_order['description']}

Allowed paths:
{allowed_paths or '- (none declared)'}

Verification commands:
{verification or '- (none declared)'}

Constraints:
{constraints or '- keep the change small and focused'}

Execution rules:
- Stay inside the allowed paths unless you must touch one tiny dependency file.
- Keep edits minimal and production-minded.
- Do not mutate queue state.
- Do not edit scheduling or orchestration policy.
- Return a concise summary of what changed and what verification should run.
'''


def build_command(work_order: dict[str, Any], model: str) -> list[str]:
    return [
        'opencode',
        'run',
        '-m',
        model,
        build_prompt(work_order),
    ]


def run_command(command: list[str], cwd: str, timeout: int) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=cwd, text=True, capture_output=True, timeout=timeout)


def changed_files(cwd: str) -> list[str]:
    result = subprocess.run(['git', 'status', '--short'], cwd=cwd, text=True, capture_output=True)
    if result.returncode != 0:
        return []
    files = []
    for line in result.stdout.splitlines():
        if not line.strip():
            continue
        files.append(line[3:] if len(line) > 3 else line)
    return files


def _candidate_typescript_modules(cwd: str) -> list[Path]:
    current = Path(cwd).resolve()
    candidates: list[Path] = []
    for base in [current, *current.parents]:
        candidate = base / 'node_modules' / 'typescript'
        if candidate.exists():
            candidates.append(candidate)
    deduped: list[Path] = []
    seen: set[str] = set()
    for candidate in candidates:
        key = str(candidate)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(candidate)
    return deduped


def verify_changed_ts_syntax(cwd: str, files: list[str]) -> list[dict[str, Any]]:
    targets = [path for path in files if Path(path).suffix in TS_SYNTAX_SUFFIXES]
    if not targets:
        return []
    ts_candidates = _candidate_typescript_modules(cwd)
    if not ts_candidates:
        return [
            {
                'command': 'ts-syntax-check',
                'exit_code': 1,
                'stdout': '',
                'stderr': 'typescript module not found for frontend syntax verification',
            }
        ]
    node_script = r'''
const fs = require('fs')
const ts = require(process.argv[1])
const files = JSON.parse(process.argv[2])
const failures = []
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  const out = ts.transpileModule(src, {
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext },
    fileName: file,
    reportDiagnostics: true,
  })
  const diags = (out.diagnostics || []).filter((d) => d.category === ts.DiagnosticCategory.Error)
  if (diags.length) {
    failures.push({
      file,
      messages: diags.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')),
    })
  }
}
if (failures.length) {
  console.log(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}
console.log(JSON.stringify({ ok: true, files }, null, 2))
'''
    absolute_targets = [str(Path(cwd, path).resolve()) for path in targets]
    last_failure: dict[str, Any] | None = None
    for ts_module in ts_candidates:
        proc = subprocess.run(
            ['node', '-e', node_script, str(ts_module), json.dumps(absolute_targets)],
            cwd=cwd,
            text=True,
            capture_output=True,
        )
        result = {
            'command': f"node ts-syntax-check via {ts_module}",
            'exit_code': proc.returncode,
            'stdout': proc.stdout[-4000:],
            'stderr': proc.stderr[-4000:],
        }
        if proc.returncode == 0:
            return [result]
        last_failure = result
    return [last_failure] if last_failure else []


def run_verification(commands: list[str], cwd: str, files: list[str]) -> list[dict[str, Any]]:
    results = []
    results.extend(verify_changed_ts_syntax(cwd, files))
    for command in commands:
        proc = subprocess.run(command, cwd=cwd, text=True, capture_output=True, shell=True)
        results.append(
            {
                'command': command,
                'exit_code': proc.returncode,
                'stdout': proc.stdout[-4000:],
                'stderr': proc.stderr[-4000:],
            }
        )
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description='Run or preview the MUTX OpenCode lane')
    parser.add_argument('work_order', help='Path to normalized work-order JSON')
    parser.add_argument('--model', default=DEFAULT_MODEL)
    parser.add_argument('--timeout', type=int, default=1800)
    parser.add_argument('--execute', action='store_true', help='Actually invoke OpenCode')
    args = parser.parse_args()

    work_order = load_work_order(args.work_order)
    command = build_command(work_order, args.model)
    preview = {
        'runner': 'opencode',
        'task_id': work_order.get('id'),
        'lane': work_order.get('lane'),
        'worktree': work_order['worktree'],
        'command': shlex.join(command),
        'allowed_paths': work_order.get('allowed_paths', []),
        'verification_commands': work_order.get('verification', []),
    }

    if not args.execute:
        print(json.dumps(preview, indent=2, sort_keys=True))
        return 0

    result = run_command(command, cwd=work_order['worktree'], timeout=args.timeout)
    files = changed_files(work_order['worktree'])
    verification = run_verification(work_order.get('verification', []), work_order['worktree'], files)
    combined_output = (result.stdout or '') + '\n' + (result.stderr or '')
    blocker_class = classify_failure(combined_output)
    retry_after_seconds = extract_retry_after_seconds(combined_output)
    payload = {
        **preview,
        'exit_code': result.returncode,
        'stdout': result.stdout,
        'stderr': result.stderr,
        'changed_files': files,
        'verification': verification,
        'verification_passed': all(item['exit_code'] == 0 for item in verification) if verification else True,
        'blocker_class': blocker_class,
        'retry_after_seconds': retry_after_seconds,
    }
    print(json.dumps(payload, indent=2, sort_keys=True))
    return result.returncode if result.returncode != 0 else (0 if payload['verification_passed'] else 2)


if __name__ == '__main__':
    raise SystemExit(main())
