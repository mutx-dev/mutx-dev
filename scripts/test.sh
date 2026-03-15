#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

MUTX_SKIP_PLAYWRIGHT="${MUTX_SKIP_PLAYWRIGHT:-0}"

PYTHON_BIN=""
for candidate in ".venv/bin/python" "python3.11" "python3.10" "python3"; do
  if [ "$candidate" = ".venv/bin/python" ]; then
    [ -x "$candidate" ] || continue
  elif ! command -v "$candidate" >/dev/null 2>&1; then
    continue
  fi

  if "$candidate" -c "import fastapi, pytest" >/dev/null 2>&1; then
    PYTHON_BIN="$candidate"
    break
  fi
done

if [ -z "$PYTHON_BIN" ]; then
  echo "No Python interpreter with fastapi + pytest found."
  echo "Install deps with: pip install -r requirements.txt && pip install -e \".[dev]\""
  exit 1
fi

echo "Checking pinned dependency compatibility..."
"$PYTHON_BIN" scripts/check_requirements_compat.py

if [ -x ".venv/bin/ruff" ]; then
  RUFF_BIN=".venv/bin/ruff"
else
  RUFF_BIN="ruff"
fi

if [ -x ".venv/bin/black" ]; then
  BLACK_BIN=".venv/bin/black"
else
  BLACK_BIN="black"
fi

echo "Using Python interpreter: $PYTHON_BIN"

echo "Running Python lint and format checks..."
"$RUFF_BIN" check src/api cli sdk
"$BLACK_BIN" --check src/api cli sdk

echo ""
echo "Running Python compile check..."
"$PYTHON_BIN" -m compileall src/api cli sdk/mutx

echo ""
echo "Running Python API test suite..."
"$PYTHON_BIN" -m pytest tests/api --maxfail=1 -q

echo ""
echo "Generating frontend API types..."
npm run generate-types

echo ""
echo "Running app-level frontend unit tests..."
npm run test:app

echo ""
echo "Checking generated frontend API types are committed..."
git diff --exit-code -- app/types/api.ts

echo ""
echo "Running frontend lint..."
npm run lint

echo ""
echo "Running frontend build check..."
npm run build

echo ""
if [ "$MUTX_SKIP_PLAYWRIGHT" = "1" ]; then
  echo "Skipping frontend smoke tests (MUTX_SKIP_PLAYWRIGHT=1)."
else
  echo "Running frontend smoke tests..."
  npx playwright test --project=chromium
fi

echo ""
echo "Validation complete!"
