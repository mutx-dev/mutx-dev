#!/usr/bin/env bash
# =============================================================================
# scripts/pre-commit-install.sh
# Bootstrap pre-commit for the MUTX repo.
#
# Usage:
#   bash scripts/pre-commit-install.sh
#
# What it does:
#   1. Installs pre-commit into .venv (if not already present)
#   2. Installs pre-commit git hook (pre-commit)
#   3. Installs pre-push git hook (pre-push) for slower checks
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# ---- Colors ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[pre-commit]${NC} $*"; }
warn()  { echo -e "${YELLOW}[pre-commit]${NC} $*"; }
error() { echo -e "${RED}[pre-commit]${NC} $*" >&2; exit 1; }

# ---- 1. Ensure .venv exists ----
if [[ ! -x ".venv/bin/python" ]]; then
  warn ".venv not found. Creating it with python3.11..."
  python3.11 -m venv .venv
fi

VENV_PYTHON=".venv/bin/python"

# ---- 2. Install pre-commit into .venv ----
info "Installing pre-commit into .venv..."
"$VENV_PYTHON" -m pip install --quiet --upgrade pre-commit

PRE_COMMIT=".venv/bin/pre-commit"
if [[ ! -x "$PRE_COMMIT" ]]; then
  error "pre-commit not found at .venv/bin/pre-commit after install."
fi

info "pre-commit $("$PRE_COMMIT" --version)"

# ---- 3. Install pre-commit hook (runs on every commit — fast checks) ----
info "Installing pre-commit hook..."
"$PRE_COMMIT" install

# ---- 4. Install pre-push hook (runs before push — slower checks) ----
info "Installing pre-push hook..."
"$PRE_COMMIT" install --hook-type pre-push

# ---- 5. Optional: run against all files to seed the cache ----
read -rp "$(echo -e ${YELLOW}[pre-commit]${NC} Run against all files now to warm cache? [y/N] ) " choice
case "$choice" in
  y|Y)
    info "Running pre-commit on all files (first run downloads remote hooks)..."
    "$PRE_COMMIT" run --all-files --show-diff-on-failure || true
    info "Cache warmed. Future commits will be fast."
    ;;
  *)
    info "Skipped. You can run '.venv/bin/pre-commit run --all-files' anytime."
    ;;
esac

echo ""
info "Done! Hooks installed:"
info "  pre-commit  → fast checks (ruff format, ruff check, eslint, whitespace, etc.)"
info "  pre-push    → slower checks (verify generated artifacts, compile check)"
info ""
info "To skip hooks temporarily: git commit --no-verify"
info "To run manually:           .venv/bin/pre-commit run --all-files"
