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

current_api_url() {
  mutx config get api_url 2>/dev/null | tr -d '\r'
}

is_logged_in() {
  mutx status 2>/dev/null | grep -q "Status: Logged in"
}

run_login_wizard() {
  local email=""

  if [[ "${HAS_TTY}" != "1" ]]; then
    return
  fi

  tty_prompt "Email address:"
  read_tty_line email

  if [[ -z "${email}" ]]; then
    tty_note "Skipping login because no email was entered."
    return
  fi

  tty_note "Password prompt is handled by mutx itself."
  mutx login --email "${email}" < /dev/tty > /dev/tty 2>&1
}

run_setup_wizard() {
  local api_url=""

  if [[ "${HAS_TTY}" != "1" ]]; then
    say "Install complete"
    note "Run 'mutx status' to inspect local state."
    note "Run 'mutx tui' when you want to open the operator shell."
    return
  fi

  tty_say "Guided setup"
  tty_note "Current API URL: $(current_api_url)"

  if confirm_tty "Use a different API URL?" "n"; then
    tty_prompt "API URL:"
    read_tty_line api_url

    if [[ -n "${api_url}" ]]; then
      mutx config set api_url "${api_url}" > /dev/tty 2>&1
      tty_note "Saved API URL to ~/.mutx/config.json"
    else
      tty_note "Keeping the existing API URL."
    fi
  fi

  if is_logged_in; then
    tty_note "You already have a local MUTX session."
  elif confirm_tty "Log in now?" "y"; then
    run_login_wizard
  else
    tty_note "Skipping login. The TUI can still open in local-only mode."
  fi

  if [[ "${OPEN_TUI}" == "0" ]]; then
    tty_note "Skipping TUI launch because MUTX_OPEN_TUI=0"
    return
  fi

  if confirm_tty "Open mutx tui now?" "y"; then
    tty_say "Launching mutx tui"
    exec mutx tui < /dev/tty > /dev/tty 2>&1
  fi

  tty_say "Setup complete"
  tty_note "Next steps:"
  tty_note "  mutx status"
  tty_note "  mutx whoami"
  tty_note "  mutx tui"
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

run_setup_wizard
