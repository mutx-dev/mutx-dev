#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

MUTX_SKIP_PLAYWRIGHT="${MUTX_SKIP_PLAYWRIGHT:-0}"

if [ -x ".venv/bin/python" ]; then
  PYTHON_BIN=".venv/bin/python"
else
  PYTHON_BIN="python3"
fi

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
