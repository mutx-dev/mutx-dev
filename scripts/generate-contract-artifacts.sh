#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PYTHON_BIN="${PYTHON_BIN:-${1:-}}"

if [[ -z "$PYTHON_BIN" ]]; then
  for candidate in ".venv/bin/python" "python3.11" "python3.10" "python3"; do
    if [[ "$candidate" == ".venv/bin/python" ]]; then
      [[ -x "$candidate" ]] || continue
    elif ! command -v "$candidate" >/dev/null 2>&1; then
      continue
    fi

    if "$candidate" -c "import fastapi" >/dev/null 2>&1; then
      PYTHON_BIN="$candidate"
      break
    fi
  done
fi

if [[ -z "$PYTHON_BIN" ]]; then
  echo "No Python interpreter with fastapi found."
  exit 1
fi

echo "Generating OpenAPI spec with $PYTHON_BIN..."
"$PYTHON_BIN" scripts/generate_openapi.py

echo "Generating frontend API types..."
npm run generate-types
