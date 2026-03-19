#!/usr/bin/env bash
set -euo pipefail

TAP="${MUTX_TAP:-mutx-dev/homebrew-tap}"
FORMULA="${MUTX_FORMULA:-mutx}"
OPEN_TUI="${MUTX_OPEN_TUI:-1}"

say() {
  printf '==> %s\n' "$*"
}

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

if [[ "$(uname -s)" != "Darwin" ]]; then
  die "This quickstart currently targets macOS with Homebrew. Use the source install path in README.md on other platforms."
fi

if ! command -v brew >/dev/null 2>&1; then
  die "Homebrew is required. Install it from https://brew.sh and rerun this command."
fi

say "Tapping ${TAP}"
brew tap "${TAP}"

if brew list --versions "${FORMULA}" >/dev/null 2>&1; then
  say "Refreshing ${FORMULA}"
  brew upgrade "${FORMULA}" >/dev/null || true
else
  say "Installing ${FORMULA}"
  brew install "${FORMULA}"
fi

say "Linking ${FORMULA}"
brew link --overwrite "${FORMULA}" >/dev/null
hash -r 2>/dev/null || true

if ! command -v mutx >/dev/null 2>&1; then
  die "mutx was not found on PATH after Homebrew install."
fi

say "Using $(command -v mutx)"
say "Running CLI smoke check"
mutx --help >/dev/null
mutx status

if [[ "${OPEN_TUI}" == "0" ]]; then
  say "Skipping TUI launch because MUTX_OPEN_TUI=0"
  exit 0
fi

say "Launching mutx tui"
exec mutx tui
