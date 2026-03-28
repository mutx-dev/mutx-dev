#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

MUTX_SKIP_PLAYWRIGHT="${MUTX_SKIP_PLAYWRIGHT:-0}"
MUTX_SKIP_COMPOSE_SMOKE="${MUTX_SKIP_COMPOSE_SMOKE:-1}"
MUTX_PLAYWRIGHT_WORKERS="${MUTX_PLAYWRIGHT_WORKERS:-1}"
MUTX_RELEASE_WEB_SMOKE="${MUTX_RELEASE_WEB_SMOKE:-0}"
MUTX_SKIP_DESKTOP_RELEASE="${MUTX_SKIP_DESKTOP_RELEASE:-1}"

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
  tests/test_generate_homebrew_formula.py \
  tests/test_release_soft_launch.py \
  tests/test_sdk_*.py \
  tests/test_hosted_llm_executor.py \
  --maxfail=1 -q

echo ""
echo "Running app-level frontend unit tests..."
npm run test:app

echo ""
echo "Verifying generated OpenAPI artifacts are current..."
PYTHON_BIN="$PYTHON_BIN" bash scripts/verify-generated-artifacts.sh

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
  if [ "$MUTX_RELEASE_WEB_SMOKE" = "1" ]; then
    npm run test:e2e:release
  else
    npx playwright test --project=chromium --workers="$MUTX_PLAYWRIGHT_WORKERS"
  fi
fi

echo ""
if [ "$MUTX_SKIP_COMPOSE_SMOKE" = "1" ]; then
  echo "Skipping production compose smoke test (MUTX_SKIP_COMPOSE_SMOKE=1)."
else
  echo "Running production compose smoke test..."
  bash scripts/smoke-compose-prod.sh
fi

echo ""
if [ "$MUTX_SKIP_DESKTOP_RELEASE" = "1" ]; then
  echo "Skipping signed desktop artifact validation (MUTX_SKIP_DESKTOP_RELEASE=1)."
else
  echo "Running signed desktop artifact validation..."
  npm run desktop:release:validate
fi

echo ""
echo "Validation complete!"
