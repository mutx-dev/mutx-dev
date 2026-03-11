#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

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
echo "Running pytest collection..."
"$PYTHON_BIN" -m pytest --collect-only -q

echo ""
echo "Generating frontend API types..."
npm run generate-types

echo ""
echo "Running frontend build check..."
npm run build

echo ""
echo "Skipping frontend lint: current ESLint setup is known broken in this repo."

echo ""
echo "Validation complete!"
