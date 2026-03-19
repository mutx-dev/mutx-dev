#!/usr/bin/env bash
set -euo pipefail

TAP="${MUTX_TAP:-mutx-dev/homebrew-tap}"
FORMULA="${MUTX_FORMULA:-mutx}"
OPEN_TUI="${MUTX_OPEN_TUI:-1}"
export HOMEBREW_NO_AUTO_UPDATE="${HOMEBREW_NO_AUTO_UPDATE:-1}"
export HOMEBREW_NO_INSTALL_FROM_API="${HOMEBREW_NO_INSTALL_FROM_API:-1}"

MUTX_ASCII_LOGO="$(cat <<'EOF'
                     ≠≠
                    ≠≠≠≠
                   ≠====≠
                 ≠≠======≠≠
                ≠≠=========≠  ==≠≠≠≈≈≈
               =======÷======  ÷÷=====≠=
             =======÷÷÷÷=======  ÷======≠
            =======÷÷   ÷=======  ÷÷=====≠
           ==÷====×   ÷  ÷÷====÷  ≠======≠
         ==÷÷÷÷÷÷÷  ÷==÷  ÷÷==÷  =======÷
        ==÷÷÷÷÷÷÷  ÷======  ÷÷ =======÷÷
       =÷÷÷÷÷÷÷÷ =÷÷=======   =======÷÷
     ==÷÷÷÷÷÷÷   ÷÷===÷÷÷÷÷  ==÷÷÷÷÷÷
    ==÷÷÷÷÷÷÷  ÷  ÷÷÷÷==÷  ==÷÷÷÷÷÷÷ ==
   =÷÷÷÷÷÷÷÷  ÷=÷  ÷÷÷÷÷  ÷=÷÷÷÷÷÷÷ ==÷=
  =÷÷÷÷÷÷÷   ÷÷===  ÷÷÷  ÷=÷÷÷÷÷×÷÷=÷÷÷÷=≠
 ÷÷÷÷÷÷÷÷   ×÷==÷÷==    ===÷÷÷÷÷  ÷÷÷÷÷÷÷=≠
 ÷÷÷÷÷÷÷     ×÷÷÷÷÷== =====÷÷÷÷    ≠÷÷÷÷÷÷=
 ÷÷÷÷÷        ÷÷÷÷÷÷===÷÷==÷÷÷       ÷÷÷÷÷=
 ÷÷÷÷           ÷÷÷÷÷÷÷÷÷÷÷÷          ÷÷÷÷=
 ÷÷÷             ÷÷÷÷÷÷÷÷÷÷            ÷÷÷=
 ÷÷               ÷÷÷÷÷÷÷÷              ÷÷=
                   ÷÷÷÷÷÷                 =
EOF
)"

if [[ -t 1 ]]; then
  C_RESET=$'\033[0m'
  C_BOLD=$'\033[1m'
  C_MUTX=$'\033[38;5;45m'
  C_SOFT=$'\033[38;5;110m'
  C_WARN=$'\033[38;5;221m'
  C_GOOD=$'\033[38;5;85m'
else
  C_RESET=''
  C_BOLD=''
  C_MUTX=''
  C_SOFT=''
  C_WARN=''
  C_GOOD=''
fi

say() {
  printf '%b==>%b %s\n' "${C_MUTX}" "${C_RESET}" "$*"
}

note() {
  printf '%b   %s%b\n' "${C_SOFT}" "$*" "${C_RESET}"
}

die() {
  printf '%berror:%b %s\n' "${C_WARN}" "${C_RESET}" "$*" >&2
  exit 1
}

banner() {
  printf '\n%b%s%b\n' "${C_MUTX}" "${MUTX_ASCII_LOGO}" "${C_RESET}"
  printf '%bMUTX install%b\n' "${C_BOLD}" "${C_RESET}"
  printf '%bT for TUI  •  /v1 control plane  •  ~/.mutx/config.json%b\n\n' "${C_SOFT}" "${C_RESET}"
}

banner

if [[ "$(uname -s)" != "Darwin" ]]; then
  die "This installer currently targets macOS with Homebrew. Use the source install path from the repo on other platforms."
fi

if ! command -v brew >/dev/null 2>&1; then
  die "Homebrew is required. Install it from https://brew.sh and rerun: curl -fsSL https://mutx.dev/install.sh | bash"
fi

say "Preparing MUTX"
note "tap: ${TAP}"
note "formula: ${FORMULA}"

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
note "Overwriting an older /opt/homebrew/bin/mutx shim if one exists"
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
note "If you have not logged in yet, the operator shell will open in local-only mode."
exec mutx tui
