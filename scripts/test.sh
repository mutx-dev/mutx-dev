#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

MUTX_SKIP_PLAYWRIGHT="${MUTX_SKIP_PLAYWRIGHT:-0}"
MUTX_SKIP_COMPOSE_SMOKE="${MUTX_SKIP_COMPOSE_SMOKE:-1}"

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
"$RUFF_BIN" check src/api cli sdk src/security
"$RUFF_BIN" format --check src/api cli sdk src/security

echo ""
echo "Running Python compile check..."
"$PYTHON_BIN" -m compileall src/api cli sdk/mutx src/security

echo ""
echo "Running expanded Python validation suite..."
"$PYTHON_BIN" -m pytest \
  tests/api \
  tests/unit/python \
  tests/test_cli_*.py \
  tests/test_sdk_*.py \
  tests/test_hosted_llm_executor.py \
  --maxfail=1 -q

echo ""
echo "Generating OpenAPI spec..."
"$PYTHON_BIN" scripts/generate_openapi.py

echo ""
echo "Generating frontend API types..."
npm run generate-types

echo ""
echo "Running app-level frontend unit tests..."
npm run test:app

echo ""
echo "Checking generated OpenAPI artifacts are committed..."
git diff --exit-code -- docs/api/openapi.json app/types/api.ts

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
if [ "$MUTX_SKIP_COMPOSE_SMOKE" = "1" ]; then
  echo "Skipping production compose smoke test (MUTX_SKIP_COMPOSE_SMOKE=1)."
else
  echo "Running production compose smoke test..."
  bash scripts/smoke-compose-prod.sh
fi

echo ""
echo "Validation complete!"
