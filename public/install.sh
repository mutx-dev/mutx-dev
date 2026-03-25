#!/usr/bin/env bash
set -euo pipefail

TAP="${MUTX_TAP:-mutx-dev/homebrew-tap}"
FORMULA="${MUTX_FORMULA:-mutx}"
MUTX_HOME_DIR="${MUTX_HOME_DIR:-$HOME/.mutx}"
MUTX_CLI_SOURCE_REF="${MUTX_CLI_SOURCE_REF:-https://github.com/mutx-dev/mutx-dev/archive/refs/heads/main.tar.gz}"
MUTX_INSTALL_TIMEOUT="${MUTX_INSTALL_TIMEOUT:-1200}"
MUTX_BREW_TIMEOUT="${MUTX_BREW_TIMEOUT:-300}"
MUTX_OPEN_TUI="${MUTX_OPEN_TUI:-1}"
MUTX_NO_ANIMATION="${MUTX_NO_ANIMATION:-0}"
MUTX_NO_ONBOARD="${MUTX_NO_ONBOARD:-0}"
MUTX_NO_PROMPT="${MUTX_NO_PROMPT:-0}"
HELP=0

export HOMEBREW_NO_AUTO_UPDATE="${HOMEBREW_NO_AUTO_UPDATE:-1}"
export HOMEBREW_NO_INSTALL_FROM_API="${HOMEBREW_NO_INSTALL_FROM_API:-1}"
export HOMEBREW_NO_INSTALLED_HOST_CHECK="${HOMEBREW_NO_INSTALLED_HOST_CHECK:-1}"

INSTALL_LOG="${TMPDIR:-/tmp}/mutx-install.$$.$RANDOM.log"
WATCHDOG_PID=""
KEEP_LOG=0
HAS_TTY=0
MOTION_OK=0
CURSOR_HIDDEN=0
MUTX_BIN=""
SOURCE_OVERLAY_USED=0
OPENCLAW_BIN=""
OPENCLAW_HOME="${OPENCLAW_HOME:-${OPENCLAW_STATE_DIR:-$HOME/.openclaw}}"
OPENCLAW_DETECTED=0
OS_NAME="unknown"
INSTALL_STAGE_TOTAL=3
INSTALL_STAGE_CURRENT=0
CURRENT_STEP_LABEL=""
CURRENT_STEP_DETAIL=""

if [[ -r /dev/tty && -w /dev/tty ]] && [[ -t 0 || -t 1 || -t 2 ]]; then
  HAS_TTY=1
fi

if [[ "${HAS_TTY}" == "1" && "${MUTX_NO_ANIMATION}" != "1" ]]; then
  MOTION_OK=1
fi

if [[ -t 1 ]]; then
  C_RESET=$'\033[0m'
  C_BOLD=$'\033[1m'
  C_ACCENT=$'\033[38;5;45m'
  C_ACCENT_SOFT=$'\033[38;5;51m'
  C_GOOD=$'\033[38;5;85m'
  C_WARN=$'\033[38;5;221m'
  C_DIM=$'\033[38;5;245m'
else
  C_RESET=''
  C_BOLD=''
  C_ACCENT=''
  C_ACCENT_SOFT=''
  C_GOOD=''
  C_WARN=''
  C_DIM=''
fi

start_watchdog() {
  (
    sleep "${MUTX_INSTALL_TIMEOUT}"
    kill -USR1 "$$" 2>/dev/null || true
  ) >/dev/null 2>&1 &
  WATCHDOG_PID=$!
}

cleanup() {
  show_cursor
  if [[ -n "${WATCHDOG_PID}" ]]; then
    kill "${WATCHDOG_PID}" 2>/dev/null || true
    wait "${WATCHDOG_PID}" 2>/dev/null || true
  fi
  if [[ "${KEEP_LOG}" != "1" && -f "${INSTALL_LOG}" ]]; then
    rm -f "${INSTALL_LOG}"
  fi
}

on_timeout() {
  KEEP_LOG=1
  show_cursor
  printf '%berror:%b install timed out after %s seconds\n' "${C_WARN}" "${C_RESET}" "${MUTX_INSTALL_TIMEOUT}" >&2
  printf '%b   log:%b %s\n' "${C_DIM}" "${C_RESET}" "${INSTALL_LOG}" >&2
  exit 124
}

trap cleanup EXIT
trap on_timeout USR1

start_watchdog

print_tty() {
  if [[ "${HAS_TTY}" == "1" ]]; then
    printf '%b' "$1" > /dev/tty
  else
    printf '%b' "$1"
  fi
}

hide_cursor() {
  if [[ "${HAS_TTY}" == "1" && "${CURSOR_HIDDEN}" != "1" ]]; then
    printf '\033[?25l' > /dev/tty
    CURSOR_HIDDEN=1
  fi
}

show_cursor() {
  if [[ "${HAS_TTY}" == "1" && "${CURSOR_HIDDEN}" == "1" ]]; then
    printf '\033[?25h' > /dev/tty
    CURSOR_HIDDEN=0
  fi
}

clear_screen() {
  if [[ "${HAS_TTY}" == "1" ]]; then
    printf '\033[2J\033[H' > /dev/tty
  fi
}

say() {
  print_tty "${C_ACCENT}==>${C_RESET} $*\n"
}

note() {
  print_tty "${C_DIM}   $*${C_RESET}\n"
}

warn() {
  print_tty "${C_WARN} ! ${C_RESET}$*\n"
}

success() {
  print_tty "${C_GOOD} ✓ ${C_RESET}$*\n"
}

die() {
  KEEP_LOG=1
  show_cursor
  printf '%berror:%b %s\n' "${C_WARN}" "${C_RESET}" "$*" >&2
  if [[ -f "${INSTALL_LOG}" ]]; then
    printf '%b   log:%b %s\n' "${C_DIM}" "${C_RESET}" "${INSTALL_LOG}" >&2
  fi
  exit 1
}

run_with_timeout() {
  local timeout_secs="${1:-30}"
  shift

  if command -v gtimeout >/dev/null 2>&1; then
    gtimeout "${timeout_secs}" "$@"
    return $?
  fi

  if command -v timeout >/dev/null 2>&1; then
    timeout "${timeout_secs}" "$@"
    return $?
  fi

  "$@" &
  local cmd_pid=$!
  (
    sleep "${timeout_secs}"
    kill -TERM "${cmd_pid}" 2>/dev/null || true
    sleep 2
    kill -KILL "${cmd_pid}" 2>/dev/null || true
  ) >/dev/null 2>&1 &
  local killer_pid=$!

  local rc=0
  wait "${cmd_pid}" || rc=$?
  kill "${killer_pid}" 2>/dev/null || true
  wait "${killer_pid}" 2>/dev/null || true
  return "${rc}"
}

log_command() {
  printf '\n[%s] ' "$(date '+%Y-%m-%d %H:%M:%S')" >> "${INSTALL_LOG}"
  printf '%q ' "$@" >> "${INSTALL_LOG}"
  printf '\n' >> "${INSTALL_LOG}"
  "$@" >> "${INSTALL_LOG}" 2>&1
}

spinner() {
  local pid="$1"
  local label="$2"
  local -a frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
  local i=0

  if [[ "${HAS_TTY}" != "1" || "${MOTION_OK}" != "1" ]]; then
    return 0
  fi

  hide_cursor
  while kill -0 "${pid}" 2>/dev/null; do
    printf '\r%b%s%b %s' "${C_ACCENT_SOFT}" "${frames[$((i % ${#frames[@]}))]}" "${C_RESET}" "${label}" > /dev/tty
    i=$((i + 1))
    sleep 0.08
  done
  printf '\r\033[K' > /dev/tty
}

run_stage() {
  local fatal="1"
  if [[ "${1:-}" == "--soft" ]]; then
    fatal="0"
    shift
  fi

  local label="$1"
  shift

  CURRENT_STEP_LABEL="${label}"
  CURRENT_STEP_DETAIL="Running…"

  if [[ "${HAS_TTY}" != "1" || "${MOTION_OK}" != "1" ]]; then
    say "${label}"
  fi

  local rc=0
  log_command "$@" || rc=$?
  show_cursor

  if [[ "${rc}" == "0" ]]; then
    CURRENT_STEP_DETAIL="Complete."
    success "${label}"
    return 0
  fi

  KEEP_LOG=1
  CURRENT_STEP_DETAIL="Failed."
  warn "${label}"
  if [[ -f "${INSTALL_LOG}" ]]; then
    note "Last output:"
    tail -n 12 "${INSTALL_LOG}" | while IFS= read -r line; do
      note "${line}"
    done
  fi

  if [[ "${fatal}" == "1" ]]; then
    die "Stage failed: ${label}"
  fi
  return "${rc}"
}

print_usage() {
  cat <<EOF
Usage: curl -fsSL https://mutx.dev/install.sh | bash -s -- [options]

Options:
  --help           Show this help text
  --no-onboard     Install MUTX but do not launch onboarding
  --onboard        Force onboarding handoff
  --no-prompt      Disable interactive prompts
  --prompt         Re-enable interactive prompts

Environment:
  MUTX_OPEN_TUI=0          Keep onboarding in the CLI instead of opening the TUI
  MUTX_NO_ANIMATION=1      Disable animated output
  MUTX_NO_ONBOARD=1        Skip automatic handoff to onboarding
  MUTX_NO_PROMPT=1         Disable prompts and print next steps only
  MUTX_CLI_SOURCE_REF=...  Override the fallback CLI source archive
  MUTX_INSTALL_TIMEOUT=... Overall installer timeout in seconds
  MUTX_BREW_TIMEOUT=...    Timeout for individual brew install/upgrade calls
EOF
}

parse_args() {
  while [[ "$#" -gt 0 ]]; do
    case "$1" in
      --help|-h) HELP=1 ;;
      --no-onboard) MUTX_NO_ONBOARD=1 ;;
      --onboard) MUTX_NO_ONBOARD=0 ;;
      --no-prompt) MUTX_NO_PROMPT=1 ;;
      --prompt) MUTX_NO_PROMPT=0 ;;
      *) die "Unknown installer option: $1" ;;
    esac
    shift
  done
}

is_promptable() {
  [[ "${MUTX_NO_PROMPT}" != "1" && "${HAS_TTY}" == "1" ]]
}

detect_os_or_die() {
  case "$(uname -s)" in
    Darwin) OS_NAME="macos" ;;
    *) die "This installer currently supports macOS with Homebrew." ;;
  esac
}

detect_openclaw_runtime() {
  OPENCLAW_BIN="$(command -v openclaw 2>/dev/null || true)"
  OPENCLAW_DETECTED=0
  if [[ -n "${OPENCLAW_BIN}" ]]; then
    OPENCLAW_DETECTED=1
  fi
}

render_banner() {
  clear_screen
  print_tty "${C_ACCENT}${C_BOLD}mutx install${C_RESET}\n"
  print_tty "${C_DIM}install the cli, verify the command surface, then hand off to onboarding.${C_RESET}\n\n"
}

ui_stage() {
  local title="$1"
  INSTALL_STAGE_CURRENT=$((INSTALL_STAGE_CURRENT + 1))
  print_tty "\n${C_ACCENT}${C_BOLD}[${INSTALL_STAGE_CURRENT}/${INSTALL_STAGE_TOTAL}] ${title}${C_RESET}\n"
}

ui_kv() {
  local key="$1"
  local value="$2"
  print_tty "${C_DIM}$(printf '%-18s' "${key}:")${C_RESET} ${value}\n"
}

show_install_plan() {
  local onboarding_mode="interactive handoff"
  local prompt_mode="interactive"
  local tui_mode="open after onboarding"

  if [[ "${MUTX_NO_ONBOARD}" == "1" ]]; then
    onboarding_mode="skipped"
  fi
  if ! is_promptable; then
    prompt_mode="disabled"
  fi
  if [[ "${MUTX_OPEN_TUI}" == "0" ]]; then
    tui_mode="stay in cli"
  fi

  print_tty "${C_ACCENT}${C_BOLD}install plan${C_RESET}\n"
  ui_kv "OS" "${OS_NAME}"
  ui_kv "Package lane" "homebrew"
  ui_kv "Runtime fallback" "source overlay if packaged cli is unavailable"
  ui_kv "Onboarding" "${onboarding_mode}"
  ui_kv "Prompt mode" "${prompt_mode}"
  ui_kv "TUI" "${tui_mode}"
  ui_kv "Config dir" "${MUTX_HOME_DIR}"
  if [[ "${OPENCLAW_DETECTED}" == "1" ]]; then
    ui_kv "OpenClaw" "detected at ${OPENCLAW_BIN}"
    ui_kv "OpenClaw home" "${OPENCLAW_HOME}"
  else
    ui_kv "OpenClaw" "not detected yet"
  fi
  ui_kv "Tracking" "~/.mutx/providers/openclaw"
  ui_kv "Secrets" "OpenClaw keys stay local and are not uploaded by MUTX"
}

path_realpath() {
  python3 - "$1" <<'PY'
import os, sys
print(os.path.realpath(sys.argv[1]))
PY
}

resolve_mutx_bin() {
  local candidate=""
  local resolved=""
  local cellar=""

  hash -r 2>/dev/null || true

  candidate="$(command -v mutx 2>/dev/null || true)"
  if [[ -n "${candidate}" ]]; then
    if [[ -L "${candidate}" ]]; then
      resolved="$(path_realpath "${candidate}" 2>/dev/null || true)"
      if [[ -x "${resolved}" ]]; then
        MUTX_BIN="${candidate}"
        return 0
      fi
    elif [[ -x "${candidate}" ]]; then
      MUTX_BIN="${candidate}"
      return 0
    fi
  fi

  for candidate in "/opt/homebrew/bin/mutx" "/usr/local/bin/mutx" "${MUTX_HOME_DIR}/runtime/source-cli/venv/bin/mutx"; do
    if [[ -x "${candidate}" ]]; then
      MUTX_BIN="${candidate}"
      return 0
    fi
  done

  cellar="$(brew --prefix "${FORMULA}" 2>/dev/null || true)"
  if [[ -n "${cellar}" ]]; then
    for candidate in "${cellar}/bin/mutx" "${cellar}/libexec/bin/mutx"; do
      if [[ -x "${candidate}" ]]; then
        MUTX_BIN="${candidate}"
        return 0
      fi
    done
  fi

  return 1
}

resolve_python_bin() {
  local candidate=""
  if candidate="$(command -v python3 2>/dev/null || true)" && [[ -n "${candidate}" ]]; then
    printf '%s\n' "${candidate}"
    return 0
  fi

  candidate="$(run_with_timeout 30 brew --prefix python@3.12 2>/dev/null || true)"
  for p in "${candidate}/bin/python3" "${candidate}/bin/python3.12"; do
    if [[ -x "${p}" ]]; then
      printf '%s\n' "${p}"
      return 0
    fi
  done

  return 1
}

relink_formula() {
  brew unlink "${FORMULA}" >/dev/null 2>&1 || true
  brew link --overwrite "${FORMULA}"
}

install_source_overlay() {
  local python_bin=""
  python_bin="$(resolve_python_bin)" || die "python3 is required for the source fallback"

  local overlay_root="${MUTX_HOME_DIR}/runtime/source-cli"
  local venv_path="${overlay_root}/venv"
  local brew_prefix=""

  mkdir -p "${overlay_root}"
  rm -rf "${venv_path}"

  "${python_bin}" -m venv "${venv_path}"
  "${venv_path}/bin/pip" install --disable-pip-version-check --quiet --upgrade pip setuptools wheel
  "${venv_path}/bin/pip" install --disable-pip-version-check --quiet --upgrade "${MUTX_CLI_SOURCE_REF}"
  "${venv_path}/bin/pip" install --disable-pip-version-check --quiet --upgrade "textual>=0.58.0,<2.0.0"

  if ! "${venv_path}/bin/mutx" --help >/dev/null 2>&1; then
    die "source fallback installed but mutx is still not runnable"
  fi

  brew_prefix="$(brew --prefix)"
  mkdir -p "${brew_prefix}/bin"
  ln -sf "${venv_path}/bin/mutx" "${brew_prefix}/bin/mutx"
  hash -r 2>/dev/null || true
  SOURCE_OVERLAY_USED=1
}

check_brew_upgrade_needed() {
  if ! brew list --versions "${FORMULA}" >/dev/null 2>&1; then
    BREW_UPGRADE_NEEDED="not-installed"
    return 0
  fi

  if [[ -n "$(run_with_timeout 30 brew outdated --quiet "${FORMULA}" 2>/dev/null || true)" ]]; then
    BREW_UPGRADE_NEEDED="yes"
  else
    BREW_UPGRADE_NEEDED="no"
  fi
}

install_or_upgrade_formula() {
  case "${BREW_UPGRADE_NEEDED}" in
    not-installed)
      run_with_timeout "${MUTX_BREW_TIMEOUT}" brew install "${FORMULA}"
      ;;
    yes)
      run_with_timeout "${MUTX_BREW_TIMEOUT}" brew upgrade "${FORMULA}"
      ;;
    no)
      return 0
      ;;
    *)
      die "unknown brew state: ${BREW_UPGRADE_NEEDED}"
      ;;
  esac
}

verify_cli_surface() {
  local help_output=""

  resolve_mutx_bin || return 1

  help_output="$("${MUTX_BIN}" --help 2>&1)" || return 1
  [[ "${help_output}" == *"onboard"* ]] || return 1
  [[ "${help_output}" == *"setup"* ]] || return 1
  [[ "${help_output}" == *"doctor"* ]] || return 1

  help_output="$("${MUTX_BIN}" setup --help 2>&1)" || return 1
  [[ "${help_output}" == *"hosted"* ]] || return 1
  [[ "${help_output}" == *"local"* ]] || return 1

  help_output="$("${MUTX_BIN}" setup hosted --help 2>&1)" || return 1
  [[ "${help_output}" == *"--install-openclaw"* ]] || return 1
  [[ "${help_output}" == *"--import-openclaw"* ]] || return 1

  help_output="$("${MUTX_BIN}" setup local --help 2>&1)" || return 1
  [[ "${help_output}" == *"--install-openclaw"* ]] || return 1
  [[ "${help_output}" == *"--import-openclaw"* ]] || return 1

  help_output="$("${MUTX_BIN}" runtime --help 2>&1)" || return 1
  [[ "${help_output}" == *"inspect"* ]] || return 1
  [[ "${help_output}" == *"open"* ]] || return 1

  "${MUTX_BIN}" onboard --help >/dev/null 2>&1 || return 1
  return 0
}

run_setup_handoff() {
  detect_openclaw_runtime

  if [[ "${MUTX_NO_ONBOARD}" == "1" ]] || ! is_promptable; then
    say "install complete."
    note "next:"
    note "  mutx onboard"
    if [[ "${OPENCLAW_DETECTED}" == "1" ]]; then
      note "OpenClaw detected — onboarding will offer to import it."
    fi
    return
  fi

  local -a onboard_cmd=("${MUTX_BIN}" onboard)
  if [[ "${MUTX_OPEN_TUI}" != "0" ]]; then
    onboard_cmd+=(--open-tui)
  fi

  say "handing off to mutx onboarding..."
  exec "${onboard_cmd[@]}" < /dev/tty > /dev/tty 2>&1
}

parse_args "$@"
if [[ "${HELP}" == "1" ]]; then
  print_usage
  exit 0
fi

detect_os_or_die
detect_openclaw_runtime
render_banner
show_install_plan

if ! command -v brew >/dev/null 2>&1; then
  die "Homebrew is required. Install it from https://brew.sh and rerun the installer."
fi

ui_stage "Preparing environment"
if brew tap | grep -qx "${TAP}"; then
  success "Package lane already synced"
else
  run_stage "Syncing package lane" run_with_timeout 120 brew tap "${TAP}"
fi

ui_stage "Installing MUTX runtime"
check_brew_upgrade_needed

FORMULA_OK=1
case "${BREW_UPGRADE_NEEDED}" in
  no)
    success "MUTX runtime already up-to-date"
    ;;
  not-installed)
    if ! run_stage --soft "Installing MUTX runtime" install_or_upgrade_formula; then
      FORMULA_OK=0
      warn "Packaged install failed — switching to source fallback"
    fi
    ;;
  yes)
    if ! run_stage --soft "Upgrading MUTX runtime" install_or_upgrade_formula; then
      FORMULA_OK=0
      warn "Packaged upgrade failed — switching to source fallback"
    fi
    ;;
esac

if [[ "${FORMULA_OK}" == "1" ]]; then
  if ! run_stage --soft "Linking mutx into PATH" relink_formula; then
    FORMULA_OK=0
    warn "Homebrew link step failed — switching to source fallback"
  fi
fi

if [[ "${FORMULA_OK}" != "1" ]]; then
  run_stage "Installing source fallback" install_source_overlay
fi

ui_stage "Finalizing setup"
if ! run_stage --soft "Verifying CLI" verify_cli_surface; then
  if [[ "${SOURCE_OVERLAY_USED}" != "1" ]]; then
    warn "Packaged CLI is incomplete — switching to source fallback"
    run_stage "Installing source fallback" install_source_overlay
    run_stage "Verifying CLI" verify_cli_surface
  else
    die "Installed CLI is still missing required commands after source fallback"
  fi
fi

if [[ "${SOURCE_OVERLAY_USED}" == "1" ]]; then
  note "Using fresh source overlay at ${MUTX_HOME_DIR}/runtime/source-cli/venv"
else
  note "Using packaged Homebrew CLI"
fi
note "mutx resolves to ${MUTX_BIN}"
run_setup_handoff
