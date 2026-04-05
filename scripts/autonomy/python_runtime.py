from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Iterable

MIN_VERSION = (3, 10)
PYENV_DEFAULT_VERSION = '3.12.8'


def candidate_paths() -> list[str]:
    seen: set[str] = set()
    candidates: list[str] = []

    def add(value: str | None) -> None:
        if not value:
            return
        normalized = value.strip()
        if not normalized or normalized in seen:
            return
        seen.add(normalized)
        candidates.append(normalized)

    add(os.environ.get('MUTX_AUTONOMY_PYTHON'))
    add(os.environ.get('PYTHON_BIN'))
    pyenv_root = Path(os.environ.get('PYENV_ROOT') or Path.home() / '.pyenv')
    add(str(pyenv_root / 'versions' / PYENV_DEFAULT_VERSION / 'bin' / 'python3'))
    add(sys.executable)

    for name in ('python3', 'python'):
        resolved = shutil.which(name)
        add(resolved)

    add('/usr/bin/python3')
    return candidates


def python_version(path: str) -> tuple[int, int] | None:
    try:
        completed = subprocess.run(
            [path, '-c', 'import sys; print(f"{sys.version_info[0]}.{sys.version_info[1]}")'],
            capture_output=True,
            text=True,
            check=True,
        )
    except (FileNotFoundError, PermissionError, subprocess.SubprocessError):
        return None

    output = completed.stdout.strip()
    if not output:
        return None
    major, _, minor = output.partition('.')
    if not major or not minor:
        return None
    try:
        return int(major), int(minor)
    except ValueError:
        return None


def find_supported_python(paths: Iterable[str], minimum: tuple[int, int] = MIN_VERSION) -> tuple[str, tuple[int, int]] | None:
    for path in paths:
        version = python_version(path)
        if version is None:
            continue
        if version >= minimum:
            return path, version
    return None


def build_error(paths: Iterable[str], minimum: tuple[int, int] = MIN_VERSION) -> str:
    rendered = ', '.join(paths) or '<none>'
    return (
        f'No supported Python interpreter found. Need >= {minimum[0]}.{minimum[1]}; '
        f'checked: {rendered}'
    )


def main() -> int:
    parser = argparse.ArgumentParser(description='Resolve a supported Python runtime for autonomy scripts')
    parser.add_argument('--min-major', type=int, default=MIN_VERSION[0])
    parser.add_argument('--min-minor', type=int, default=MIN_VERSION[1])
    parser.add_argument('--print-version', action='store_true')
    args = parser.parse_args()

    minimum = (args.min_major, args.min_minor)
    paths = candidate_paths()
    selected = find_supported_python(paths, minimum=minimum)
    if selected is None:
        print(build_error(paths, minimum=minimum), file=sys.stderr)
        return 1

    path, version = selected
    if args.print_version:
        print(f'{version[0]}.{version[1]}')
    else:
        print(path)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
