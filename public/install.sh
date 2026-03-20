#!/usr/bin/env bash
set -euo pipefail

TAP="${MUTX_TAP:-mutx-dev/homebrew-tap}"
FORMULA="${MUTX_FORMULA:-mutx}"
OPEN_TUI="${MUTX_OPEN_TUI:-1}"
MUTX_HOME_DIR="${MUTX_HOME_DIR:-$HOME/.mutx}"
MUTX_CLI_SOURCE_REF="${MUTX_CLI_SOURCE_REF:-https://github.com/mutx-dev/mutx-dev/archive/refs/heads/main.tar.gz}"
MUTX_NO_ANIMATION="${MUTX_NO_ANIMATION:-0}"
NO_ONBOARD="${MUTX_NO_ONBOARD:-0}"
NO_PROMPT="${MUTX_NO_PROMPT:-0}"
HELP=0
export HOMEBREW_NO_AUTO_UPDATE="${HOMEBREW_NO_AUTO_UPDATE:-1}"
export HOMEBREW_NO_INSTALL_FROM_API="${HOMEBREW_NO_INSTALL_FROM_API:-1}"

HAS_TTY=0
MOTION_OK=0
CURSOR_HIDDEN=0
KEEP_LOG=0
INSTALL_LOG="${TMPDIR:-/tmp}/mutx-install.$$.$RANDOM.log"
CLI_MISSING_COMMANDS=""
MUTX_BIN=""
SOURCE_OVERLAY_USED=0
WIZARD_SELECTION=""
BANNER_HAS_ANIMATED=0
OS_NAME="unknown"
INSTALL_STAGE_TOTAL=3
INSTALL_STAGE_CURRENT=0
ASCII_FRAME_COUNT=5
ASCII_FRAME_INDEX=0
ALT_SCREEN_ACTIVE=0
DASHBOARD_ACTIVE=0
TERM_COLS=100
TERM_ROWS=30
ART_PANEL_WIDTH=56
PANEL_GAP=4
CURRENT_STAGE_INDEX=-1
CURRENT_STEP_LABEL=""
CURRENT_STEP_DETAIL=""
CURRENT_STEP_STATE="idle"
FINISH_MESSAGE=""
WIZARD_VISIBLE=0
WIZARD_ERROR=""
WIZARD_HINT=""
SPINNER_FRAME_INDEX=0
PROMPT_CURSOR_ROW=0
PROMPT_CURSOR_COL=0
STAGE_TITLES=(
  "Preparing environment"
  "Installing MUTX runtime"
  "Finalizing setup"
)
STAGE_STATUSES=(
  "pending"
  "pending"
  "pending"
)
FEED_LINES=()

if [[ -t 1 ]]; then
  C_RESET=$'\033[0m'
  C_BOLD=$'\033[1m'
  C_MUTX=$'\033[38;5;45m'
  C_MUTX_ALT=$'\033[38;5;51m'
  C_SOFT=$'\033[38;5;110m'
  C_DIM=$'\033[38;5;245m'
  C_WARN=$'\033[38;5;221m'
  C_GOOD=$'\033[38;5;85m'
  C_PANEL=$'\033[38;5;159m'
  C_FLARE=$'\033[38;5;229m'
  C_FLARE_SOFT=$'\033[38;5;223m'
else
  C_RESET=''
  C_BOLD=''
  C_MUTX=''
  C_MUTX_ALT=''
  C_SOFT=''
  C_DIM=''
  C_WARN=''
  C_GOOD=''
  C_PANEL=''
  C_FLARE=''
  C_FLARE_SOFT=''
fi

if [[ -r /dev/tty && -w /dev/tty ]] && [[ -t 0 || -t 1 || -t 2 ]]; then
  HAS_TTY=1
fi

if [[ "${HAS_TTY}" == "1" && "${MUTX_NO_ANIMATION}" != "1" ]]; then
  MOTION_OK=1
fi

cleanup() {
  leave_alt_screen
  show_cursor

  if [[ "${KEEP_LOG}" != "1" && -f "${INSTALL_LOG}" ]]; then
    rm -f "${INSTALL_LOG}"
  fi
}

trap cleanup EXIT

tty_print() {
  if [[ "${HAS_TTY}" == "1" ]]; then
    printf '%b' "$1" > /dev/tty
  else
    printf '%b' "$1"
  fi
}

motion_sleep() {
  local duration="${1:-0}"
  if [[ "${MOTION_OK}" == "1" ]]; then
    sleep "${duration}"
  fi
}

type_tty() {
  local text="$1"
  local delay="${2:-0.008}"
  local idx=0

  if [[ "${MOTION_OK}" != "1" ]]; then
    tty_print "${text}"
    return
  fi

  while [[ "${idx}" -lt "${#text}" ]]; do
    tty_print "${text:${idx}:1}"
    idx=$((idx + 1))
    sleep "${delay}"
  done
}

say() {
  if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
    dashboard_record "info" "$*"
    return
  fi
  tty_print "${C_MUTX}==>${C_RESET} $*\n"
}

note() {
  if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
    dashboard_record "note" "$*"
    return
  fi
  tty_print "${C_SOFT}   $*${C_RESET}\n"
}

warn() {
  if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
    dashboard_record "warn" "$*"
    return
  fi
  tty_print "${C_WARN} ! ${C_RESET}$*\n"
}

success() {
  if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
    dashboard_record "success" "$*"
    return
  fi
  tty_print "${C_GOOD} ✓ ${C_RESET}$*\n"
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

clear_tty_screen() {
  if [[ "${HAS_TTY}" == "1" ]]; then
    printf '\033[2J\033[H' > /dev/tty
  fi
}

refresh_terminal_size() {
  local tty_size=""

  if [[ "${HAS_TTY}" != "1" ]]; then
    return
  fi

  tty_size="$(stty size < /dev/tty 2>/dev/null || true)"
  if [[ -n "${tty_size}" ]]; then
    TERM_ROWS="${tty_size%% *}"
    TERM_COLS="${tty_size##* }"
  fi

  if [[ "${TERM_ROWS}" -lt 24 ]]; then
    TERM_ROWS=24
  fi
  if [[ "${TERM_COLS}" -lt 96 ]]; then
    TERM_COLS=96
  fi
}

enter_alt_screen() {
  if [[ "${HAS_TTY}" != "1" || "${ALT_SCREEN_ACTIVE}" == "1" ]]; then
    return
  fi

  refresh_terminal_size
  printf '\033[?1049h\033[2J\033[H' > /dev/tty
  hide_cursor
  ALT_SCREEN_ACTIVE=1
  DASHBOARD_ACTIVE=1
}

leave_alt_screen() {
  if [[ "${ALT_SCREEN_ACTIVE}" != "1" ]]; then
    return
  fi

  show_cursor
  printf '\033[?1049l' > /dev/tty
  ALT_SCREEN_ACTIVE=0
  DASHBOARD_ACTIVE=0
}

print_usage() {
  cat <<EOF
Usage: curl -fsSL https://mutx.dev/install.sh | bash -s -- [options]

Options:
  --help           Show this help text
  --no-onboard     Install MUTX but skip the setup wizard handoff
  --onboard        Force the setup wizard handoff
  --no-prompt      Disable interactive prompts even when a TTY is present
  --prompt         Re-enable interactive prompts

Environment:
  MUTX_OPEN_TUI=0          Keep setup in the CLI instead of opening the TUI
  MUTX_NO_ANIMATION=1      Disable animated installer output
  MUTX_NO_ONBOARD=1        Skip the setup wizard handoff
  MUTX_NO_PROMPT=1         Disable prompts and finish with next-step commands
  MUTX_CLI_SOURCE_REF=...  Override the fallback source runtime reference
EOF
}

parse_args() {
  while [[ "$#" -gt 0 ]]; do
    case "$1" in
      --help|-h)
        HELP=1
        ;;
      --no-onboard)
        NO_ONBOARD=1
        ;;
      --onboard)
        NO_ONBOARD=0
        ;;
      --no-prompt)
        NO_PROMPT=1
        ;;
      --prompt)
        NO_PROMPT=0
        ;;
      *)
        die "Unknown installer option: $1"
        ;;
    esac
    shift
  done
}

detect_os_or_die() {
  case "$(uname -s)" in
    Darwin)
      OS_NAME="macos"
      ;;
    *)
      die "This installer currently targets macOS with Homebrew. Use the source install path from the repo on other platforms."
      ;;
  esac
}

is_promptable() {
  if [[ "${NO_PROMPT}" == "1" ]]; then
    return 1
  fi
  if [[ "${HAS_TTY}" == "1" ]]; then
    return 0
  fi
  return 1
}

ui_section() {
  if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
    dashboard_record "section" "$1"
    return
  fi
  tty_print "\n${C_MUTX}${C_BOLD}$1${C_RESET}\n"
}

ui_stage() {
  local title="$1"

  INSTALL_STAGE_CURRENT=$((INSTALL_STAGE_CURRENT + 1))
  if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
    dashboard_begin_stage "${INSTALL_STAGE_CURRENT}" "${title}"
    return
  fi
  ui_section "[${INSTALL_STAGE_CURRENT}/${INSTALL_STAGE_TOTAL}] ${title}"
}

ui_kv() {
  local key="$1"
  local value="$2"
  printf '%b%-18s%b %s\n' "${C_DIM}" "${key}:" "${C_RESET}" "${value}" | {
    if [[ "${HAS_TTY}" == "1" ]]; then
      cat > /dev/tty
    else
      cat
    fi
  }
}

show_install_plan() {
  local onboarding_mode="interactive wizard"
  local prompt_mode="interactive"
  local tui_mode="open after setup"

  if [[ "${NO_ONBOARD}" == "1" ]]; then
    onboarding_mode="skipped"
  fi
  if ! is_promptable; then
    prompt_mode="disabled"
  fi
  if [[ "${OPEN_TUI}" == "0" ]]; then
    tui_mode="stay in CLI"
  fi

  if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
    dashboard_render
    return
  fi

  ui_section "Install plan"
  ui_kv "OS" "${OS_NAME}"
  ui_kv "Package lane" "homebrew"
  ui_kv "Runtime fallback" "source overlay if packaged CLI is stale"
  ui_kv "Onboarding" "${onboarding_mode}"
  ui_kv "Prompt mode" "${prompt_mode}"
  ui_kv "TUI" "${tui_mode}"
  ui_kv "Config dir" "${MUTX_HOME_DIR}"
}

show_finish_message() {
  local -a install_messages=(
    "Runtime locked in. Pick a lane."
    "Package synced. Operator loop is next."
    "Bootstrap complete. Hand it to the CLI."
    "Fresh install. Clean runway."
    "MUTX is in. Time to wire the control plane."
  )
  local -a deferred_messages=(
    "Install complete. Setup can wait."
    "Runtime is ready. Onboarding is one command away."
    "Clean exit. Launch the wizard when you want it."
    "MUTX is staged. Finish setup when you're ready."
    "Everything is installed. Handoff deferred."
  )
  local index=0

  index=$((RANDOM % ${#install_messages[@]}))
  if [[ "${NO_ONBOARD}" == "1" ]] || ! is_promptable; then
    index=$((RANDOM % ${#deferred_messages[@]}))
    FINISH_MESSAGE="${deferred_messages[${index}]}"
    if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
      dashboard_render
      return
    fi
    tty_print "\n${C_GOOD}${C_BOLD}${FINISH_MESSAGE}${C_RESET}\n"
    return
  fi

  FINISH_MESSAGE="${install_messages[${index}]}"
  if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
    dashboard_render
    return
  fi
  tty_print "\n${C_GOOD}${C_BOLD}${FINISH_MESSAGE}${C_RESET}\n"
}

ascii_frame_content() {
  case "$1" in
    0)
      cat <<'EOF'
                    ++
                   ++++
                  ++++++
                 ++++++++
               ++++++++++++  +++++++
              ++++++++++++++  +++++++++
            +++++++++ +++++++  ++++++++
           ++++++++    ++++++++  +++++++
          ++++++++  ++  ++++++  +++++++
        +++++++++  +++++  +++  ++++++++
       ++++++++   +++++++  + +++++++++
      ++++++++  ++++++++++  ++++++++
    +++++++++    ++++++++  ++++++++
   +++++++++  ++  ++++++  ++++++++ +++
  ++++++++  +++++  +++  +++++++++++++++
 ++++++++  +++++++     ++++++++ +++++++++
 +++++++    ++++++++  ++++++++   ++++++++
 +++++       ++++++++++++++++      ++++++
 ++++         +++++++++++++         +++++
 +++            ++++++++++           ++++
 +               ++++++++             +++
                  ++++++                +
EOF
      ;;
    1)
      cat <<'EOF'
                    ##
                   ####
                  ######
                 ########
               ############  #######
              ##############  #########
            ######### #######  ########
           ########    ########  #######
          ########  ##  ######  #######
        #########  #####  ###  ########
       ########   #######  # #########
      ########  ##########  ########
    #########    ########  ########
   #########  ##  ######  ######## ###
  ########  #####  ###  ###############
 ########  #######     ######## #########
 #######    ########  ########   ########
 #####       ################      ######
 ####         #############         #####
 ###            ##########           ####
 #               ########             ###
                  ######                #
EOF
      ;;
    2)
      cat <<'EOF'
                    ↑↑
                   ↑↑↑↑
                  ↑↑↑↑↑↑
                 ↑↑↑↑↑↑↑↑
               ↑↑↑↑↑↑↑↑↑↑↑↑  ↑↑↑↑↑↑↑
              ↑↑↑↑↑↑↑↑↑↑↑↑↑↑  ↑↑↑↑↑↑↑↑↑
            ↑↑↑↑↑↑↑↑↑ ↑↑↑↑↑↑↑  ↑↑↑↑↑↑↑↑
           ↑↑↑↑↑↑↑↑    ↑↑↑↑↑↑↑↑  ↑↑↑↑↑↑↑
          ↑↑↑↑↑↑↑↑  ↑↑  ↑↑↑↑↑↑  ↑↑↑↑↑↑↑
        ↑↑↑↑↑↑↑↑↑  ↑↑↑↑↑  ↑↑↑  ↑↑↑↑↑↑↑↑
       ↑↑↑↑↑↑↑↑   ↑↑↑↑↑↑↑  ↑ ↑↑↑↑↑↑↑↑↑
      ↑↑↑↑↑↑↑↑  ↑↑↑↑↑↑↑↑↑↑  ↑↑↑↑↑↑↑↑
    ↑↑↑↑↑↑↑↑↑    ↑↑↑↑↑↑↑↑  ↑↑↑↑↑↑↑↑
   ↑↑↑↑↑↑↑↑↑  ↑↑  ↑↑↑↑↑↑  ↑↑↑↑↑↑↑↑ ↑↑↑
  ↑↑↑↑↑↑↑↑  ↑↑↑↑↑  ↑↑↑  ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
 ↑↑↑↑↑↑↑↑  ↑↑↑↑↑↑↑     ↑↑↑↑↑↑↑↑ ↑↑↑↑↑↑↑↑↑
 ↑↑↑↑↑↑↑    ↑↑↑↑↑↑↑↑  ↑↑↑↑↑↑↑↑   ↑↑↑↑↑↑↑↑
 ↑↑↑↑↑       ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑      ↑↑↑↑↑↑
 ↑↑↑↑         ↑↑↑↑↑↑↑↑↑↑↑↑↑         ↑↑↑↑↑
 ↑↑↑            ↑↑↑↑↑↑↑↑↑↑           ↑↑↑↑
 ↑               ↑↑↑↑↑↑↑↑             ↑↑↑
                  ↑↑↑↑↑↑                ↑
EOF
      ;;
    3)
      cat <<'EOF'
                    AA
                   AAAA
                  AAAAAA
                 AAAAAAAA
               AAAAAAAAAAAA  AAAAAAA
              AAAAAAAAAAAAAA  AAAAAAAAA
            AAAAAAAAA AAAAAAA  AAAAAAAA
           AAAAAAAA    AAAAAAAA  AAAAAAA
          AAAAAAAA  AA  AAAAAA  AAAAAAA
        AAAAAAAAA  AAAAA  AAA  AAAAAAAA
       AAAAAAAA   AAAAAAA  A AAAAAAAAA
      AAAAAAAA  AAAAAAAAAA  AAAAAAAA
    AAAAAAAAA    AAAAAAAA  AAAAAAAA
   AAAAAAAAA  AA  AAAAAA  AAAAAAAA AAA
  AAAAAAAA  AAAAA  AAA  AAAAAAAAAAAAAAA
 AAAAAAAA  AAAAAAA     AAAAAAAA AAAAAAAAA
 AAAAAAA    AAAAAAAA  AAAAAAAA   AAAAAAAA
 AAAAA       AAAAAAAAAAAAAAAA      AAAAAA
 AAAA         AAAAAAAAAAAAA         AAAAA
 AAA            AAAAAAAAAA           AAAA
 A               AAAAAAAA             AAA
                  AAAAAA                A
EOF
      ;;
    *)
      cat <<'EOF'
                    ÆÆ
                   ÆÆÆÆ
                  ÆÆÆÆÆÆ
                 ÆÆÆÆÆÆÆÆ
               ÆÆÆÆÆÆÆÆÆÆÆÆ  ÆÆÆÆÆÆÆ
              ÆÆÆÆÆÆÆÆÆÆÆÆÆÆ  ÆÆÆÆÆÆÆÆÆ
            ÆÆÆÆÆÆÆÆÆ ÆÆÆÆÆÆÆ  ÆÆÆÆÆÆÆÆ
           ÆÆÆÆÆÆÆÆ    ÆÆÆÆÆÆÆÆ  ÆÆÆÆÆÆÆ
          ÆÆÆÆÆÆÆÆ  ÆÆ  ÆÆÆÆÆÆ  ÆÆÆÆÆÆÆ
        ÆÆÆÆÆÆÆÆÆ  ÆÆÆÆÆ  ÆÆÆ  ÆÆÆÆÆÆÆÆ
       ÆÆÆÆÆÆÆÆ   ÆÆÆÆÆÆÆ  Æ ÆÆÆÆÆÆÆÆÆ
      ÆÆÆÆÆÆÆÆ  ÆÆÆÆÆÆÆÆÆÆ  ÆÆÆÆÆÆÆÆ
    ÆÆÆÆÆÆÆÆÆ    ÆÆÆÆÆÆÆÆ  ÆÆÆÆÆÆÆÆ
   ÆÆÆÆÆÆÆÆÆ  ÆÆ  ÆÆÆÆÆÆ  ÆÆÆÆÆÆÆÆ ÆÆÆ
  ÆÆÆÆÆÆÆÆ  ÆÆÆÆÆ  ÆÆÆ  ÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆ
 ÆÆÆÆÆÆÆÆ  ÆÆÆÆÆÆÆ     ÆÆÆÆÆÆÆÆ ÆÆÆÆÆÆÆÆÆ
 ÆÆÆÆÆÆÆ    ÆÆÆÆÆÆÆÆ  ÆÆÆÆÆÆÆÆ   ÆÆÆÆÆÆÆÆ
 ÆÆÆÆÆ       ÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆ      ÆÆÆÆÆÆ
 ÆÆÆÆ         ÆÆÆÆÆÆÆÆÆÆÆÆÆ         ÆÆÆÆÆ
 ÆÆÆ            ÆÆÆÆÆÆÆÆÆÆ           ÆÆÆÆ
 Æ               ÆÆÆÆÆÆÆÆ             ÆÆÆ
                  ÆÆÆÆÆÆ                Æ
EOF
      ;;
  esac
}

ascii_frame_color() {
  case "$1" in
    0) printf '%s' "${C_DIM}" ;;
    1) printf '%s' "${C_FLARE_SOFT}" ;;
    2) printf '%s' "${C_PANEL}" ;;
    3) printf '%s' "${C_MUTX_ALT}" ;;
    *) printf '%s' "${C_FLARE}" ;;
  esac
}

ascii_frame_phase() {
  case "$1" in
    0) printf '%s' "spark lattice" ;;
    1) printf '%s' "forge lattice" ;;
    2) printf '%s' "raise signal" ;;
    3) printf '%s' "align operator" ;;
    *) printf '%s' "merge control" ;;
  esac
}

ascii_stage_sigil() {
  case "$1" in
    0) printf '%s' "++" ;;
    1) printf '%s' "##" ;;
    2) printf '%s' "↑↑" ;;
    3) printf '%s' "AA" ;;
    *) printf '%s' "ÆÆ" ;;
  esac
}

render_ascii_frame() {
  local frame_idx="$1"
  local per_line_delay="${2:-0}"
  local frame_color=""
  frame_color="$(ascii_frame_color "${frame_idx}")"

  while IFS= read -r line; do
    tty_print "${frame_color}${line}${C_RESET}\n"
    if [[ "${MOTION_OK}" == "1" ]]; then
      sleep "${per_line_delay}"
    fi
  done <<< "$(ascii_frame_content "${frame_idx}")"
}

dashboard_spinner_glyph() {
  local -a frames=( "⠁" "⠃" "⠇" "⠧" "⠷" "⠿" "⠷" "⠧" )
  printf '%s' "${frames[$((SPINNER_FRAME_INDEX % ${#frames[@]}))]}"
}

dashboard_feed_line() {
  local entry="$1"
  local level="${entry%%|*}"
  local message="${entry#*|}"
  local glyph="•"
  local color="${C_SOFT}"

  case "${level}" in
    success)
      glyph="✓"
      color="${C_GOOD}"
      ;;
    warn)
      glyph="!"
      color="${C_WARN}"
      ;;
    info)
      glyph="›"
      color="${C_MUTX_ALT}"
      ;;
  esac

  printf '%b%s%b %s' "${color}" "${glyph}" "${C_RESET}" "${message}"
}

dashboard_record() {
  local level="$1"
  shift
  local message="$*"

  CURRENT_STEP_DETAIL="${message}"

  if [[ "${level}" == "warn" && "${CURRENT_STAGE_INDEX}" -ge 0 ]]; then
    STAGE_STATUSES[${CURRENT_STAGE_INDEX}]="warn"
  fi

  if [[ "${level}" != "section" ]]; then
    FEED_LINES+=("${level}|${message}")
    while [[ "${#FEED_LINES[@]}" -gt 4 ]]; do
      FEED_LINES=("${FEED_LINES[@]:1}")
    done
  fi

  dashboard_render
}

dashboard_begin_stage() {
  local stage_number="$1"
  local title="$2"
  local stage_idx=$((stage_number - 1))

  if [[ "${CURRENT_STAGE_INDEX}" -ge 0 && "${CURRENT_STAGE_INDEX}" -lt "${#STAGE_STATUSES[@]}" ]]; then
    if [[ "${STAGE_STATUSES[${CURRENT_STAGE_INDEX}]}" == "running" ]]; then
      STAGE_STATUSES[${CURRENT_STAGE_INDEX}]="done"
    fi
  fi

  CURRENT_STAGE_INDEX="${stage_idx}"
  STAGE_STATUSES[${stage_idx}]="running"
  CURRENT_STEP_LABEL="${title}"
  CURRENT_STEP_DETAIL="Stage armed."
  CURRENT_STEP_STATE="running"
  dashboard_render
}

dashboard_mark_stage_done() {
  local stage_idx="${1:-${CURRENT_STAGE_INDEX}}"

  if [[ "${stage_idx}" -ge 0 && "${stage_idx}" -lt "${#STAGE_STATUSES[@]}" ]]; then
    STAGE_STATUSES[${stage_idx}]="done"
  fi
  CURRENT_STEP_STATE="done"
  dashboard_render
}

dashboard_stage_line() {
  local stage_idx="$1"
  local stage_number=$((stage_idx + 1))
  local title="${STAGE_TITLES[${stage_idx}]}"
  local status="${STAGE_STATUSES[${stage_idx}]}"
  local glyph="·"
  local color="${C_DIM}"
  local label="pending"

  case "${status}" in
    running)
      glyph="$(dashboard_spinner_glyph)"
      color="${C_MUTX_ALT}"
      label="live"
      ;;
    done)
      glyph="✓"
      color="${C_GOOD}"
      label="locked"
      ;;
    warn)
      glyph="!"
      color="${C_WARN}"
      label="attention"
      ;;
  esac

  printf '%b%s%b [%d/%d] %s %b%s%b' \
    "${color}" \
    "${glyph}" \
    "${C_RESET}" \
    "${stage_number}" \
    "${INSTALL_STAGE_TOTAL}" \
    "${title}" \
    "${C_DIM}" \
    "${label}" \
    "${C_RESET}"
}

dashboard_render_splash() {
  local frame_idx="$1"
  local phase="$2"
  local frame_color=""

  frame_color="$(ascii_frame_color "${frame_idx}")"
  refresh_terminal_size
  printf '\033[H\033[2J' > /dev/tty

  while IFS= read -r line; do
    printf '%b%-*s%b' "${frame_color}" "${ART_PANEL_WIDTH}" "${line}" "${C_RESET}" > /dev/tty
    printf '%*s' "${PANEL_GAP}" "" > /dev/tty
    case "${line}" in
      "")
        printf '\n' > /dev/tty
        ;;
      *)
        printf '\n' > /dev/tty
        ;;
    esac
  done <<< "$(ascii_frame_content "${frame_idx}")"

  printf '\033[%d;%dH%bMUTX setup wizard%b' 3 $((ART_PANEL_WIDTH + PANEL_GAP + 1)) "${C_BOLD}${C_MUTX}" "${C_RESET}" > /dev/tty
  printf '\033[%d;%dH%bSingle-screen bootstrap for the current MUTX runtime.%b' 5 $((ART_PANEL_WIDTH + PANEL_GAP + 1)) "${C_SOFT}" "${C_RESET}" > /dev/tty
  printf '\033[%d;%dH%b%s%b' 8 $((ART_PANEL_WIDTH + PANEL_GAP + 1)) "${C_FLARE_SOFT}" "${phase}" "${C_RESET}" > /dev/tty
  printf '\033[%d;%dH%bneon bootstrap • current runtime • clean handoff%b' 10 $((ART_PANEL_WIDTH + PANEL_GAP + 1)) "${C_DIM}" "${C_RESET}" > /dev/tty
}

dashboard_render() {
  local frame_idx=4
  local frame_color=""
  local max_lines=0
  local idx=0
  local art_line=""
  local info_line=""
  local onboarding_mode="interactive wizard"
  local prompt_mode="interactive"
  local tui_mode="open after setup"
  local -a art_lines=()
  local -a info_lines=()

  if [[ "${DASHBOARD_ACTIVE}" != "1" ]]; then
    return
  fi

  PROMPT_CURSOR_ROW=0
  PROMPT_CURSOR_COL=0

  if [[ "${NO_ONBOARD}" == "1" ]]; then
    onboarding_mode="skipped"
  fi
  if ! is_promptable; then
    prompt_mode="disabled"
  fi
  if [[ "${OPEN_TUI}" == "0" ]]; then
    tui_mode="stay in CLI"
  fi

  if [[ "${WIZARD_VISIBLE}" == "1" ]]; then
    if [[ "${SOURCE_OVERLAY_USED}" == "1" ]]; then
      frame_idx=4
    else
      frame_idx=1
    fi
  elif [[ "${CURRENT_STEP_STATE}" == "running" ]]; then
    frame_idx=$((SPINNER_FRAME_INDEX % ASCII_FRAME_COUNT))
  elif [[ "${CURRENT_STAGE_INDEX}" -ge 0 ]]; then
    frame_idx=$((CURRENT_STAGE_INDEX % ASCII_FRAME_COUNT))
  fi

  frame_color="$(ascii_frame_color "${frame_idx}")"
  while IFS= read -r art_line; do
    art_lines+=("${art_line}")
  done <<< "$(ascii_frame_content "${frame_idx}")"

  info_lines+=("${C_BOLD}${C_MUTX}MUTX setup wizard${C_RESET}")
  info_lines+=("${C_SOFT}Single-screen bootstrap for the current MUTX runtime.${C_RESET}")
  info_lines+=("")
  info_lines+=("${C_MUTX_ALT}Install plan${C_RESET}")
  info_lines+=("${C_DIM}${OS_NAME} • homebrew • ${tui_mode}${C_RESET}")
  info_lines+=("${C_DIM}fallback: source overlay if packaged CLI is stale${C_RESET}")
  info_lines+=("${C_DIM}onboarding: ${onboarding_mode} • prompts: ${prompt_mode}${C_RESET}")
  info_lines+=("")
  info_lines+=("${C_MUTX_ALT}Progress${C_RESET}")
  info_lines+=("$(dashboard_stage_line 0)")
  info_lines+=("$(dashboard_stage_line 1)")
  info_lines+=("$(dashboard_stage_line 2)")
  info_lines+=("")

  if [[ "${WIZARD_VISIBLE}" == "1" ]]; then
    info_lines+=("${C_MUTX_ALT}Setup Wizard${C_RESET}")
    if [[ "${SOURCE_OVERLAY_USED}" == "1" ]]; then
      info_lines+=("${C_GOOD}fresh overlay active${C_RESET} so setup uses the current CLI surface")
    else
      info_lines+=("${C_GOOD}package surface current${C_RESET} and ready for handoff")
    fi
    info_lines+=("${C_DIM}1 Hosted lane  authenticate against your control plane${C_RESET}")
    info_lines+=("${C_DIM}2 Local lane   use http://localhost:8000${C_RESET}")
    info_lines+=("${C_DIM}3 Later        finish install and exit cleanly${C_RESET}")
    PROMPT_CURSOR_ROW=$((${#info_lines[@]} + 1))
    PROMPT_CURSOR_COL=$((ART_PANEL_WIDTH + PANEL_GAP + 24))
    info_lines+=("${C_PANEL}Select a lane [1/2/3]: ${C_RESET}")
    if [[ -n "${WIZARD_ERROR}" ]]; then
      info_lines+=("${C_WARN}${WIZARD_ERROR}${C_RESET}")
    elif [[ -n "${WIZARD_HINT}" ]]; then
      info_lines+=("${C_SOFT}${WIZARD_HINT}${C_RESET}")
    elif [[ -n "${FINISH_MESSAGE}" ]]; then
      info_lines+=("${C_GOOD}${FINISH_MESSAGE}${C_RESET}")
    else
      info_lines+=("${C_SOFT}The lane will ${tui_mode} when setup completes.${C_RESET}")
    fi
  else
    info_lines+=("${C_MUTX_ALT}Now${C_RESET}")
    if [[ "${CURRENT_STEP_STATE}" == "running" ]]; then
      info_lines+=("${C_MUTX_ALT}$(dashboard_spinner_glyph)${C_RESET} ${CURRENT_STEP_LABEL}")
    elif [[ "${CURRENT_STEP_STATE}" == "done" ]]; then
      info_lines+=("${C_GOOD}✓${C_RESET} ${CURRENT_STEP_LABEL}")
    else
      info_lines+=("${C_SOFT}stand by${C_RESET}")
    fi
    if [[ -n "${CURRENT_STEP_DETAIL}" ]]; then
      info_lines+=("${C_SOFT}${CURRENT_STEP_DETAIL}${C_RESET}")
    else
      info_lines+=("${C_SOFT}Syncing the install lane and current command surface.${C_RESET}")
    fi
    info_lines+=("")
    info_lines+=("${C_MUTX_ALT}Signal${C_RESET}")
    if [[ "${#FEED_LINES[@]}" == "0" ]]; then
      info_lines+=("${C_SOFT}No events yet.${C_RESET}")
      info_lines+=("")
      info_lines+=("")
      info_lines+=("")
    else
      idx=0
      while [[ "${idx}" -lt "${#FEED_LINES[@]}" ]]; do
        info_lines+=("$(dashboard_feed_line "${FEED_LINES[${idx}]}")")
        idx=$((idx + 1))
      done
      while [[ "${#info_lines[@]}" -lt 22 ]]; do
        info_lines+=("")
      done
    fi
    if [[ -n "${FINISH_MESSAGE}" ]]; then
      info_lines+=("${C_GOOD}${FINISH_MESSAGE}${C_RESET}")
    fi
  fi

  max_lines="${#art_lines[@]}"
  if [[ "${#info_lines[@]}" -gt "${max_lines}" ]]; then
    max_lines="${#info_lines[@]}"
  fi
  if [[ "${max_lines}" -gt $((TERM_ROWS - 1)) ]]; then
    max_lines=$((TERM_ROWS - 1))
  fi

  printf '\033[H\033[2J' > /dev/tty
  idx=0
  while [[ "${idx}" -lt "${max_lines}" ]]; do
    art_line="${art_lines[${idx}]:-}"
    info_line="${info_lines[${idx}]:-}"
    printf '%b%-*s%b' "${frame_color}" "${ART_PANEL_WIDTH}" "${art_line}" "${C_RESET}" > /dev/tty
    printf '%*s' "${PANEL_GAP}" "" > /dev/tty
    printf '%b\n' "${info_line}" > /dev/tty
    idx=$((idx + 1))
  done
}

die() {
  KEEP_LOG=1
  leave_alt_screen
  printf '%berror:%b %s\n' "${C_WARN}" "${C_RESET}" "$*" >&2
  if [[ -f "${INSTALL_LOG}" ]]; then
    printf '%b   log:%b %s\n' "${C_DIM}" "${C_RESET}" "${INSTALL_LOG}" >&2
  fi
  exit 1
}

log_command() {
  printf '\n[%s] ' "$(date '+%Y-%m-%d %H:%M:%S')" >> "${INSTALL_LOG}"
  printf '%q ' "$@" >> "${INSTALL_LOG}"
  printf '\n' >> "${INSTALL_LOG}"
  "$@" >> "${INSTALL_LOG}" 2>&1
}

spinner_loop() {
  local pid="$1"
  local label="$2"
  local i=0

  if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
    while kill -0 "${pid}" 2>/dev/null; do
      SPINNER_FRAME_INDEX="${i}"
      CURRENT_STEP_LABEL="${label}"
      CURRENT_STEP_STATE="running"
      dashboard_render
      i=$((i + 1))
      sleep 0.08
    done
    return
  fi

  local -a frames=( "⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏" )
  local -a beams=( "▰▱▱▱▱" "▰▰▱▱▱" "▰▰▰▱▱" "▰▰▰▰▱" "▰▰▰▰▰" "▱▰▰▰▰" "▱▱▰▰▰" "▱▱▱▰▰" "▱▱▱▱▰" "▱▱▱▱▱" )

  while kill -0 "${pid}" 2>/dev/null; do
    local sigil
    sigil="$(ascii_stage_sigil $((i % ASCII_FRAME_COUNT)))"
    printf '\r%b%s%b %s  %b%s%b %b%s%b' "${C_MUTX_ALT}" "${frames[${i}]}" "${C_RESET}" "${label}" "${C_PANEL}" "${beams[${i}]}" "${C_RESET}" "${C_FLARE_SOFT}" "${sigil}" "${C_RESET}" > /dev/tty
    i=$(( (i + 1) % ${#frames[@]} ))
    sleep 0.08
  done
}

run_stage() {
  local label="$1"
  shift

  CURRENT_STEP_LABEL="${label}"
  CURRENT_STEP_STATE="running"
  CURRENT_STEP_DETAIL="Running…"

  if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
    dashboard_render
  elif [[ "${HAS_TTY}" == "1" && "${MOTION_OK}" == "1" ]]; then
    hide_cursor
  else
    say "${label}"
  fi

  log_command "$@" &
  local pid=$!
  local exit_code=0

  if [[ "${DASHBOARD_ACTIVE}" == "1" && "${MOTION_OK}" == "1" ]]; then
    spinner_loop "${pid}" "${label}"
  elif [[ "${HAS_TTY}" == "1" && "${MOTION_OK}" == "1" ]]; then
    spinner_loop "${pid}" "${label}"
  fi

  wait "${pid}" || exit_code=$?

  if [[ "${HAS_TTY}" == "1" && "${MOTION_OK}" == "1" && "${DASHBOARD_ACTIVE}" != "1" ]]; then
    printf '\r\033[K' > /dev/tty
  fi

  if [[ "${DASHBOARD_ACTIVE}" != "1" ]]; then
    show_cursor
  fi

  if [[ "${exit_code}" == "0" ]]; then
    CURRENT_STEP_STATE="done"
    CURRENT_STEP_DETAIL="Complete."
    success "${label}"
    return 0
  fi

  CURRENT_STEP_STATE="warn"
  KEEP_LOG=1
  warn "${label}"
  if [[ -f "${INSTALL_LOG}" ]]; then
    note "Last output:"
    tail -n 12 "${INSTALL_LOG}" | while IFS= read -r line; do
      note "${line}"
    done
  fi
  die "Stage failed: ${label}"
}

render_banner() {
  local title="${C_BOLD}${C_MUTX}MUTX setup wizard${C_RESET}"
  local subtitle="${C_SOFT}Install the CLI, verify the onboarding surface, and land in the right lane.${C_RESET}"
  local signal="${C_DIM}neon bootstrap ▸ current runtime ▸ clean operator handoff${C_RESET}"
  local frame_idx="${ASCII_FRAME_INDEX}"
  local phase=""

  if [[ "${HAS_TTY}" == "1" ]]; then
    enter_alt_screen
  fi

  if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
    if [[ "${MOTION_OK}" == "1" && "${BANNER_HAS_ANIMATED}" != "1" ]]; then
      local idx=0
      while [[ "${idx}" -lt "${ASCII_FRAME_COUNT}" ]]; do
        phase="$(ascii_frame_phase "${idx}")"
        dashboard_render_splash "${idx}" "${phase}"
        motion_sleep 0.16
        idx=$((idx + 1))
      done
    fi

    BANNER_HAS_ANIMATED=1
    ASCII_FRAME_INDEX=$((ASCII_FRAME_COUNT - 1))
    CURRENT_STEP_LABEL="Install plan"
    CURRENT_STEP_DETAIL="Calibrating the package lane and operator handoff."
    CURRENT_STEP_STATE="idle"
    dashboard_render
    return
  fi

  clear_tty_screen
  tty_print '\n'

  if [[ "${MOTION_OK}" == "1" && "${BANNER_HAS_ANIMATED}" != "1" ]]; then
    local idx=0
    while [[ "${idx}" -lt "${ASCII_FRAME_COUNT}" ]]; do
      clear_tty_screen
      tty_print "\n"
      render_ascii_frame "${idx}" 0.018
      phase="$(ascii_frame_phase "${idx}")"
      tty_print "\n${C_FLARE_SOFT}   ${phase}${C_RESET}\n"
      motion_sleep 0.18
      idx=$((idx + 1))
    done
    frame_idx=$((ASCII_FRAME_COUNT - 1))
    clear_tty_screen
    tty_print "\n"
    render_ascii_frame "${frame_idx}" 0.010
    tty_print "\n"
    type_tty "${title}" 0.006
    tty_print "\n"
    type_tty "${subtitle}" 0.0035
    tty_print "\n"
    type_tty "${signal}" 0.0025
    tty_print "\n\n"
    motion_sleep 0.08
  else
    render_ascii_frame "${frame_idx}" 0
    tty_print "\n${title}\n"
    tty_print "${subtitle}\n"
    tty_print "${signal}\n\n"
  fi

  BANNER_HAS_ANIMATED=1
  ASCII_FRAME_INDEX=$(( (ASCII_FRAME_INDEX + 1) % ASCII_FRAME_COUNT ))
}

tty_prompt() {
  if [[ "${HAS_TTY}" == "1" ]]; then
    printf '%b?%b %s ' "${C_MUTX_ALT}" "${C_RESET}" "$1" > /dev/tty
  else
    printf '? %s ' "$1"
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

resolve_mutx_bin() {
  hash -r 2>/dev/null || true
  MUTX_BIN="$(command -v mutx || true)"
  [[ -n "${MUTX_BIN}" ]] || die "mutx was not found on PATH after install."
}

check_assistant_first_surface() {
  local -a required_specs=(
    "setup"
    "setup hosted"
    "setup local"
    "doctor"
  )
  local -a missing=()
  local spec=""

  for spec in "${required_specs[@]}"; do
    local -a cmd=("${MUTX_BIN}")
    local -a parts=()
    read -r -a parts <<< "${spec}"
    cmd+=("${parts[@]}")

    if ! "${cmd[@]}" --help >/dev/null 2>&1; then
      missing+=("mutx ${spec}")
    fi
  done

  if [[ "${#missing[@]}" == "0" ]]; then
    CLI_MISSING_COMMANDS=""
    return 0
  fi

  CLI_MISSING_COMMANDS="${missing[0]}"
  local idx=1
  while [[ "${idx}" -lt "${#missing[@]}" ]]; do
    CLI_MISSING_COMMANDS+=", ${missing[${idx}]}"
    idx=$((idx + 1))
  done

  return 1
}

show_surface_status() {
  local label="$1"
  if check_assistant_first_surface; then
    success "${label}"
    return 0
  fi

  warn "${label}"
  note "Missing commands: ${CLI_MISSING_COMMANDS}"
  return 1
}

resolve_python_bin() {
  if command -v python3 >/dev/null 2>&1; then
    command -v python3
    return 0
  fi

  local brew_python_prefix=""
  brew_python_prefix="$(brew --prefix python@3.12 2>>"${INSTALL_LOG}" || true)"
  if [[ -n "${brew_python_prefix}" ]]; then
    if [[ -x "${brew_python_prefix}/bin/python3" ]]; then
      printf '%s\n' "${brew_python_prefix}/bin/python3"
      return 0
    fi
    if [[ -x "${brew_python_prefix}/bin/python3.12" ]]; then
      printf '%s\n' "${brew_python_prefix}/bin/python3.12"
      return 0
    fi
  fi

  return 1
}

upgrade_or_keep_formula() {
  brew upgrade "${FORMULA}" || true
}

install_source_overlay() {
  local python_bin=""
  python_bin="$(resolve_python_bin)" || return 1

  local overlay_root="${MUTX_HOME_DIR}/runtime/source-cli"
  local final_venv="${overlay_root}/venv"
  local brew_prefix=""

  mkdir -p "${overlay_root}"
  rm -rf "${final_venv}"

  "${python_bin}" -m venv "${final_venv}"
  "${final_venv}/bin/pip" install --disable-pip-version-check --quiet --upgrade pip setuptools wheel
  "${final_venv}/bin/pip" install --disable-pip-version-check --quiet --upgrade "${MUTX_CLI_SOURCE_REF}"
  "${final_venv}/bin/pip" install --disable-pip-version-check --quiet --upgrade "textual>=0.58.0,<2.0.0"

  brew_prefix="$(brew --prefix)"
  mkdir -p "${brew_prefix}/bin"
  ln -sf "${final_venv}/bin/mutx" "${brew_prefix}/bin/mutx"
  hash -r 2>/dev/null || true
}

ensure_assistant_first_surface() {
  if show_surface_status "Checking onboarding surface"; then
    dashboard_mark_stage_done "${CURRENT_STAGE_INDEX}"
    return 0
  fi

  note "The packaged CLI is older than this installer. Pulling a fresh MUTX runtime."
  run_stage "Recovering current CLI surface" install_source_overlay
  SOURCE_OVERLAY_USED=1
  resolve_mutx_bin

  if show_surface_status "Rechecking onboarding surface"; then
    note "mutx now resolves to ${MUTX_BIN}"
    dashboard_mark_stage_done "${CURRENT_STAGE_INDEX}"
    return 0
  fi

  die "The installed CLI is still missing required commands: ${CLI_MISSING_COMMANDS}"
}

run_setup_handoff() {
  local -a hosted_cmd=("${MUTX_BIN}" setup hosted)
  local -a local_cmd=("${MUTX_BIN}" setup local)
  local handoff_note=""

  if [[ "${OPEN_TUI}" != "0" ]]; then
    hosted_cmd+=(--open-tui)
    local_cmd+=(--open-tui)
    handoff_note="The lane will open the TUI when setup completes."
  else
    handoff_note="The lane will stay in the CLI when setup completes."
  fi

  if [[ "${NO_ONBOARD}" == "1" ]] || ! is_promptable; then
    leave_alt_screen
    say "Install complete"
    note "Next steps:"
    note "  mutx setup hosted"
    note "  mutx setup local"
    note "  mutx doctor"
    note "  mutx tui"
    return
  fi

  WIZARD_VISIBLE=1
  WIZARD_HINT="${handoff_note}"
  WIZARD_ERROR=""

  while true; do
    if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
      dashboard_render
      if [[ "${PROMPT_CURSOR_ROW}" -gt 0 && "${PROMPT_CURSOR_COL}" -gt 0 ]]; then
        printf '\033[%d;%dH' "${PROMPT_CURSOR_ROW}" "${PROMPT_CURSOR_COL}" > /dev/tty
      fi
    else
      render_banner
      tty_print "${C_MUTX_ALT}●${C_RESET} ${C_GOOD}package lane synced${C_RESET}\n"
      tty_print "${C_MUTX_ALT}●${C_RESET} ${C_GOOD}command surface verified${C_RESET}\n"
      tty_print "${C_MUTX_ALT}●${C_RESET} ${C_GOOD}ready for operator handoff${C_RESET}\n"
      tty_print "\n"
      tty_print "${C_PANEL}╭─ ${C_BOLD}Setup Wizard${C_RESET}${C_PANEL} ─────────────────────────────────────────────╮${C_RESET}\n"
      tty_print "${C_PANEL}│${C_RESET} ${C_SOFT}Choose where MUTX should land next.${C_RESET}\n"
      if [[ "${SOURCE_OVERLAY_USED}" == "1" ]]; then
        tty_print "${C_PANEL}│${C_RESET} ${C_GOOD}runtime${C_RESET} fresh CLI overlay active so setup uses the current surface\n"
      else
        tty_print "${C_PANEL}│${C_RESET} ${C_GOOD}runtime${C_RESET} packaged CLI is current and ready\n"
      fi
      tty_print "${C_PANEL}│${C_RESET} ${C_SOFT}${handoff_note}${C_RESET}\n"
      tty_print "${C_PANEL}│${C_RESET}\n"
      tty_print "${C_PANEL}│${C_RESET} ${C_BOLD}1${C_RESET}  Hosted lane   ${C_DIM}authenticate against your control plane${C_RESET}\n"
      tty_print "${C_PANEL}│${C_RESET} ${C_BOLD}2${C_RESET}  Local lane    ${C_DIM}use http://localhost:8000${C_RESET}\n"
      tty_print "${C_PANEL}│${C_RESET} ${C_BOLD}3${C_RESET}  Later         ${C_DIM}finish install and exit cleanly${C_RESET}\n"
      tty_print "${C_PANEL}╰───────────────────────────────────────────────────────────────╯${C_RESET}\n"
      tty_prompt "Select a lane [1/2/3]"
    fi

    read_tty_line WIZARD_SELECTION
    WIZARD_SELECTION="${WIZARD_SELECTION:-1}"
    WIZARD_ERROR=""

    case "${WIZARD_SELECTION}" in
      1|h|H|hosted|Hosted)
        break
        ;;
      2|l|L|local|Local)
        break
        ;;
      3|later|Later|q|Q|quit|exit)
        WIZARD_SELECTION="later"
        break
        ;;
      *)
        WIZARD_ERROR="Choose 1, 2, or 3."
        if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
          dashboard_render
        else
          note "${WIZARD_ERROR}"
        fi
        sleep 1
        ;;
    esac
  done

  if [[ "${WIZARD_SELECTION}" == "1" || "${WIZARD_SELECTION}" == "h" || "${WIZARD_SELECTION}" == "H" || "${WIZARD_SELECTION}" == "hosted" || "${WIZARD_SELECTION}" == "Hosted" ]]; then
    leave_alt_screen
    say "Launching: ${hosted_cmd[*]}"
    exec "${hosted_cmd[@]}" < /dev/tty > /dev/tty 2>&1
  fi

  if [[ "${WIZARD_SELECTION}" == "2" || "${WIZARD_SELECTION}" == "l" || "${WIZARD_SELECTION}" == "L" || "${WIZARD_SELECTION}" == "local" || "${WIZARD_SELECTION}" == "Local" ]]; then
    leave_alt_screen
    say "Launching: ${local_cmd[*]}"
    exec "${local_cmd[@]}" < /dev/tty > /dev/tty 2>&1
  fi

  leave_alt_screen
  say "Install complete"
  note "Run one of:"
  note "  mutx setup hosted"
  note "  mutx setup local"
  note "  mutx doctor"
}

parse_args "$@"

if [[ "${HELP}" == "1" ]]; then
  print_usage
  exit 0
fi

detect_os_or_die
render_banner
show_install_plan

if ! command -v brew >/dev/null 2>&1; then
  die "Homebrew is required. Install it from https://brew.sh and rerun: curl -fsSL https://mutx.dev/install.sh | bash"
fi

ui_stage "Preparing environment"
run_stage "Syncing package lane" brew tap "${TAP}"

ui_stage "Installing MUTX runtime"
if brew list --versions "${FORMULA}" >/dev/null 2>&1; then
  run_stage "Refreshing MUTX runtime" upgrade_or_keep_formula
else
  run_stage "Installing MUTX runtime" brew install "${FORMULA}"
fi

run_stage "Linking mutx into PATH" brew link --overwrite "${FORMULA}"
resolve_mutx_bin
run_stage "Warming CLI" "${MUTX_BIN}" --help

ui_stage "Finalizing setup"
ensure_assistant_first_surface
show_finish_message
run_setup_handoff
