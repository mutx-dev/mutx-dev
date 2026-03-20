#!/usr/bin/env bash
set -euo pipefail

TAP="${MUTX_TAP:-mutx-dev/homebrew-tap}"
FORMULA="${MUTX_FORMULA:-mutx}"
OPEN_TUI="${MUTX_OPEN_TUI:-1}"
export HOMEBREW_NO_AUTO_UPDATE="${HOMEBREW_NO_AUTO_UPDATE:-1}"
export HOMEBREW_NO_INSTALL_FROM_API="${HOMEBREW_NO_INSTALL_FROM_API:-1}"
HAS_TTY=0

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

if [[ -r /dev/tty && -w /dev/tty ]]; then
  HAS_TTY=1
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

tty_say() {
  if [[ "${HAS_TTY}" == "1" ]]; then
    printf '%b==>%b %s\n' "${C_MUTX}" "${C_RESET}" "$*" > /dev/tty
  else
    say "$@"
  fi
}

tty_note() {
  if [[ "${HAS_TTY}" == "1" ]]; then
    printf '%b   %s%b\n' "${C_SOFT}" "$*" "${C_RESET}" > /dev/tty
  else
    note "$@"
  fi
}

tty_prompt() {
  local prompt="$1"
  if [[ "${HAS_TTY}" == "1" ]]; then
    printf '%b?%b %s ' "${C_MUTX}" "${C_RESET}" "${prompt}" > /dev/tty
  else
    printf '? %s ' "${prompt}"
  fi
}

read_tty_line() {
  local __resultvar="$1"
  local line=""

  if [[ "${HAS_TTY}" != "1" ]]; then
    printf -v "${__resultvar}" '%s' ""
    return 1
  fi

  IFS= read -r line < /dev/tty || true
  printf -v "${__resultvar}" '%s' "${line}"
}

confirm_tty() {
  local prompt="$1"
  local default="${2:-y}"
  local reply=""

  if [[ "${HAS_TTY}" != "1" ]]; then
    [[ "${default}" == "y" ]]
    return
  fi

  while true; do
    if [[ "${default}" == "y" ]]; then
      tty_prompt "${prompt} [Y/n]"
    else
      tty_prompt "${prompt} [y/N]"
    fi

    read_tty_line reply
    reply="${reply:-${default}}"

    case "${reply}" in
      y|Y|yes|YES)
        return 0
        ;;
      n|N|no|NO)
        return 1
        ;;
      *)
        tty_note "Please answer y or n."
        ;;
    esac
  done
}

run_setup_handoff() {
  local -a hosted_cmd=(mutx setup hosted)
  local -a local_cmd=(mutx setup local)

  if [[ "${OPEN_TUI}" != "0" ]]; then
    hosted_cmd+=(--open-tui)
    local_cmd+=(--open-tui)
  fi

  if [[ "${HAS_TTY}" != "1" ]]; then
    say "Install complete"
    note "Next steps:"
    note "  mutx setup hosted"
    note "  mutx setup local"
    note "  mutx doctor"
    note "  mutx tui"
    return
  fi

  tty_say "CLI onboarding handoff"
  tty_note "The installer now stops at package installation and lets the CLI own setup."

  if confirm_tty "Start hosted setup now?" "y"; then
    tty_say "Launching: ${hosted_cmd[*]}"
    exec "${hosted_cmd[@]}" < /dev/tty > /dev/tty 2>&1
  fi

  if confirm_tty "Start local setup now?" "n"; then
    tty_say "Launching: ${local_cmd[*]}"
    exec "${local_cmd[@]}" < /dev/tty > /dev/tty 2>&1
  fi

  tty_say "Install complete"
  tty_note "Run one of:"
  tty_note "  mutx setup hosted"
  tty_note "  mutx setup local"
  tty_note "  mutx doctor"
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

run_setup_handoff
