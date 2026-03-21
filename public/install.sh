#!/usr/bin/env bash
set -euo pipefail

TAP="${MUTX_TAP:-mutx-dev/homebrew-tap}"
FORMULA="${MUTX_FORMULA:-mutx}"
OPEN_TUI="${MUTX_OPEN_TUI:-1}"
MUTX_HOME_DIR="${MUTX_HOME_DIR:-$HOME/.mutx}"
MUTX_CLI_SOURCE_REF="${MUTX_CLI_SOURCE_REF:-https://github.com/mutx-dev/mutx-dev/archive/refs/heads/main.tar.gz}"
HOSTED_API_URL="${MUTX_HOSTED_API_URL:-https://api.mutx.dev}"
LOCAL_API_URL="${MUTX_LOCAL_API_URL:-http://localhost:8000}"
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
ASCII_FRAME_COUNT=1
ASCII_FRAME_INDEX=0
ALT_SCREEN_ACTIVE=0
DASHBOARD_ACTIVE=0
TERM_COLS=100
TERM_ROWS=30
ART_PANEL_WIDTH=44
PANEL_GAP=3
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
OPENCLAW_DETECTED=0
OPENCLAW_BIN=""
OPENCLAW_HOME=""
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
  if [[ "${TERM_COLS}" -lt 72 ]]; then
    TERM_COLS=72
  fi
}

repeat_char() {
  local char="$1"
  local count="$2"
  local out=""

  while [[ "${#out}" -lt "${count}" ]]; do
    out="${out}${char}"
  done

  printf '%s' "${out:0:${count}}"
}

display_path() {
  local path="$1"
  local max_len="${2:-36}"
  local rendered="${path}"

  if [[ -z "${rendered}" ]]; then
    printf '%s' "n/a"
    return
  fi

  rendered="${rendered/#${HOME}/\~}"
  if [[ "${#rendered}" -le "${max_len}" ]]; then
    printf '%s' "${rendered}"
    return
  fi

  printf '…%s' "${rendered: -$((max_len - 1))}"
}

wrap_text() {
  local text="$1"
  local width="$2"
  local remaining="${text}"
  local candidate=""

  if [[ -z "${remaining}" ]]; then
    return
  fi

  if [[ "${width}" -lt 24 ]]; then
    width=24
  fi

  while [[ "${#remaining}" -gt "${width}" ]]; do
    candidate="${remaining:0:${width}}"
    if [[ "${remaining:${width}:1}" != " " && "${candidate}" == *" "* ]]; then
      candidate="${candidate% *}"
    fi
    if [[ -z "${candidate}" ]]; then
      candidate="${remaining:0:${width}}"
    fi
    printf '%s\n' "${candidate}"
    remaining="${remaining:${#candidate}}"
    while [[ "${remaining}" == " "* ]]; do
      remaining="${remaining# }"
    done
  done

  if [[ -n "${remaining}" ]]; then
    printf '%s\n' "${remaining}"
  fi
}

dashboard_compact_layout() {
  refresh_terminal_size
  [[ "${TERM_COLS}" -lt 118 ]]
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
  MUTX_CONTROL_SOURCE_REF=...  Override the managed localhost control-plane source
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

detect_openclaw_runtime() {
  OPENCLAW_BIN="$(command -v openclaw 2>/dev/null || true)"
  OPENCLAW_DETECTED=0
  if [[ -n "${OPENCLAW_BIN}" ]]; then
    OPENCLAW_DETECTED=1
  fi

  if [[ -n "${OPENCLAW_HOME:-}" ]]; then
    OPENCLAW_HOME="${OPENCLAW_HOME}"
  elif [[ -n "${OPENCLAW_STATE_DIR:-}" ]]; then
    OPENCLAW_HOME="${OPENCLAW_STATE_DIR}"
  else
    OPENCLAW_HOME="${HOME}/.openclaw"
  fi
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
  if [[ "${OPENCLAW_DETECTED}" == "1" ]]; then
    ui_kv "OpenClaw" "detected at ${OPENCLAW_BIN}"
    ui_kv "OpenClaw home" "${OPENCLAW_HOME}"
  else
    ui_kv "OpenClaw" "not detected yet (wizard can install it)"
  fi
  ui_kv "Tracking" "~/.mutx/providers/openclaw"
  ui_kv "Secrets" "OpenClaw keys stay local and are not uploaded by MUTX"
}

show_finish_message() {
  if [[ "${NO_ONBOARD}" == "1" ]] || ! is_promptable; then
    FINISH_MESSAGE="Install complete. Run setup when you are ready."
    if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
      dashboard_render
      return
    fi
    tty_print "\n${C_GOOD}${C_BOLD}${FINISH_MESSAGE}${C_RESET}\n"
    return
  fi

  FINISH_MESSAGE="Install complete. Choose a setup lane."
  if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
    dashboard_render
    return
  fi
  tty_print "\n${C_GOOD}${C_BOLD}${FINISH_MESSAGE}${C_RESET}\n"
}

ascii_frame_content() {
  cat <<'EOF'
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
}

ascii_frame_color() {
  printf '%s' "${C_MUTX}"
}

ascii_frame_phase() {
  printf '%s' "current runtime"
}

ascii_stage_sigil() {
  printf '%s' "•"
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

  if dashboard_compact_layout; then
    refresh_terminal_size
    printf '\033[H\033[2J' > /dev/tty
    printf '\033[2;3H%bMUTX setup wizard%b' "${C_BOLD}${C_MUTX}" "${C_RESET}" > /dev/tty
    printf '\033[4;3H%bSingle-screen bootstrap for the current MUTX runtime.%b' "${C_SOFT}" "${C_RESET}" > /dev/tty
    printf '\033[6;3H%b%s%b' "${C_FLARE_SOFT}" "${phase}" "${C_RESET}" > /dev/tty
    printf '\033[8;3H%bcurrent runtime • clean handoff • assistant-first%b' "${C_DIM}" "${C_RESET}" > /dev/tty
    return
  fi

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

dashboard_put_line() {
  local row="$1"
  local col="$2"
  local text="$3"

  printf '\033[%d;%dH%b' "${row}" "${col}" "${text}" > /dev/tty
}

dashboard_render_compact_status() {
  local row=2
  local wrap_width=$((TERM_COLS - 6))
  local feed_entry=""
  local detail_line=""

  PROMPT_CURSOR_ROW=0
  PROMPT_CURSOR_COL=0

  printf '\033[H\033[2J' > /dev/tty
  dashboard_put_line "${row}" 3 "${C_BOLD}${C_MUTX}MUTX install${C_RESET}"
  row=$((row + 1))
  dashboard_put_line "${row}" 3 "${C_SOFT}Quiet install, current CLI surface, clean setup handoff.${C_RESET}"
  row=$((row + 2))

  dashboard_put_line "${row}" 3 "${C_MUTX_ALT}Stages${C_RESET}"
  row=$((row + 1))
  dashboard_put_line "${row}" 3 "$(dashboard_stage_line 0)"
  row=$((row + 1))
  dashboard_put_line "${row}" 3 "$(dashboard_stage_line 1)"
  row=$((row + 1))
  dashboard_put_line "${row}" 3 "$(dashboard_stage_line 2)"
  row=$((row + 2))

  dashboard_put_line "${row}" 3 "${C_MUTX_ALT}Current${C_RESET}"
  row=$((row + 1))
  case "${CURRENT_STEP_STATE}" in
    running)
      dashboard_put_line "${row}" 3 "${C_MUTX_ALT}$(dashboard_spinner_glyph)${C_RESET} ${CURRENT_STEP_LABEL}"
      ;;
    done)
      dashboard_put_line "${row}" 3 "${C_GOOD}✓${C_RESET} ${CURRENT_STEP_LABEL}"
      ;;
    warn)
      dashboard_put_line "${row}" 3 "${C_WARN}!${C_RESET} ${CURRENT_STEP_LABEL}"
      ;;
    *)
      dashboard_put_line "${row}" 3 "${C_SOFT}stand by${C_RESET}"
      ;;
  esac
  row=$((row + 1))

  if [[ -n "${CURRENT_STEP_DETAIL}" ]]; then
    while IFS= read -r detail_line; do
      dashboard_put_line "${row}" 3 "${C_SOFT}${detail_line}${C_RESET}"
      row=$((row + 1))
    done < <(wrap_text "${CURRENT_STEP_DETAIL}" "${wrap_width}")
  fi

  if [[ "${#FEED_LINES[@]}" -gt 0 ]]; then
    row=$((row + 1))
    dashboard_put_line "${row}" 3 "${C_MUTX_ALT}Recent${C_RESET}"
    row=$((row + 1))
    for feed_entry in "${FEED_LINES[@]}"; do
      dashboard_put_line "${row}" 3 "$(dashboard_feed_line "${feed_entry}")"
      row=$((row + 1))
    done
  fi

  if [[ -n "${FINISH_MESSAGE}" ]]; then
    row=$((row + 1))
    dashboard_put_line "${row}" 3 "${C_GOOD}${FINISH_MESSAGE}${C_RESET}"
  fi
}

dashboard_render_wizard() {
  local row=2
  local wrap_width=$((TERM_COLS - 6))
  local prompt_label="Select a lane [1/2/3]: "
  local runtime_label=""
  local path_label=""
  local home_label=""
  local note_text=""
  local message_line=""

  PROMPT_CURSOR_ROW=0
  PROMPT_CURSOR_COL=0

  runtime_label="package runtime current"
  if [[ "${SOURCE_OVERLAY_USED}" == "1" ]]; then
    runtime_label="fresh runtime active"
  fi

  if [[ "${OPENCLAW_DETECTED}" == "1" ]]; then
    path_label="$(display_path "${OPENCLAW_BIN}" 52)"
    home_label="$(display_path "${OPENCLAW_HOME}" 52)"
  fi

  printf '\033[H\033[2J' > /dev/tty
  dashboard_put_line "${row}" 3 "${C_BOLD}${C_MUTX}MUTX setup${C_RESET}"
  row=$((row + 1))
  dashboard_put_line "${row}" 3 "${C_SOFT}OpenClaw provider wizard. Same terminal. Clean handoff.${C_RESET}"
  row=$((row + 2))

  dashboard_put_line "${row}" 3 "${C_MUTX_ALT}Stages${C_RESET}"
  row=$((row + 1))
  dashboard_put_line "${row}" 3 "$(dashboard_stage_line 0)"
  row=$((row + 1))
  dashboard_put_line "${row}" 3 "$(dashboard_stage_line 1)"
  row=$((row + 1))
  dashboard_put_line "${row}" 3 "$(dashboard_stage_line 2)"
  row=$((row + 2))

  dashboard_put_line "${row}" 3 "${C_MUTX_ALT}Runtime${C_RESET}"
  row=$((row + 1))
  dashboard_put_line "${row}" 3 "${C_GOOD}${runtime_label}${C_RESET}"
  row=$((row + 1))
  if [[ "${OPENCLAW_DETECTED}" == "1" ]]; then
    dashboard_put_line "${row}" 3 "${C_GOOD}OpenClaw detected${C_RESET} ${C_DIM}${path_label}${C_RESET}"
    row=$((row + 1))
    dashboard_put_line "${row}" 3 "${C_GOOD}Importing for tracking${C_RESET} ${C_DIM}${home_label} -> ~/.mutx/providers/openclaw${C_RESET}"
    row=$((row + 1))
  else
    dashboard_put_line "${row}" 3 "${C_WARN}OpenClaw not detected yet${C_RESET} ${C_DIM}the wizard can install it${C_RESET}"
    row=$((row + 1))
  fi
  dashboard_put_line "${row}" 3 "${C_SOFT}Local OpenClaw keys stay on this machine.${C_RESET}"
  row=$((row + 2))

  dashboard_put_line "${row}" 3 "${C_MUTX_ALT}Lanes${C_RESET}"
  row=$((row + 1))
  dashboard_put_line "${row}" 3 "${C_PANEL}1${C_RESET} Hosted   ${C_DIM}${HOSTED_API_URL}${C_RESET}"
  row=$((row + 1))
  dashboard_put_line "${row}" 3 "${C_PANEL}2${C_RESET} Local    ${C_DIM}${LOCAL_API_URL}${C_RESET}"
  row=$((row + 1))
  dashboard_put_line "${row}" 3 "${C_PANEL}3${C_RESET} Later    ${C_DIM}finish install and exit cleanly${C_RESET}"
  row=$((row + 2))

  note_text="${WIZARD_HINT}"
  if [[ -n "${WIZARD_ERROR}" ]]; then
    while IFS= read -r message_line; do
      dashboard_put_line "${row}" 3 "${C_WARN}${message_line}${C_RESET}"
      row=$((row + 1))
    done < <(wrap_text "${WIZARD_ERROR}" "${wrap_width}")
  elif [[ -n "${note_text}" ]]; then
    while IFS= read -r message_line; do
      dashboard_put_line "${row}" 3 "${C_SOFT}${message_line}${C_RESET}"
      row=$((row + 1))
    done < <(wrap_text "${note_text}" "${wrap_width}")
  elif [[ -n "${FINISH_MESSAGE}" ]]; then
    while IFS= read -r message_line; do
      dashboard_put_line "${row}" 3 "${C_GOOD}${message_line}${C_RESET}"
      row=$((row + 1))
    done < <(wrap_text "${FINISH_MESSAGE}" "${wrap_width}")
  fi

  PROMPT_CURSOR_ROW="${row}"
  PROMPT_CURSOR_COL=$((3 + ${#prompt_label}))
  dashboard_put_line "${row}" 3 "${C_PANEL}${prompt_label}${C_RESET}"
}

dashboard_render() {
  local frame_color=""
  local max_lines=0
  local idx=0
  local art_line=""
  local info_line=""
  local -a art_lines=()
  local -a info_lines=()

  if [[ "${DASHBOARD_ACTIVE}" != "1" ]]; then
    return
  fi

  refresh_terminal_size

  if [[ "${WIZARD_VISIBLE}" == "1" ]]; then
    dashboard_render_wizard
    return
  fi

  if dashboard_compact_layout; then
    dashboard_render_compact_status
    return
  fi

  PROMPT_CURSOR_ROW=0
  PROMPT_CURSOR_COL=0
  frame_color="$(ascii_frame_color 0)"

  while IFS= read -r art_line; do
    art_lines+=("${art_line}")
  done <<< "$(ascii_frame_content 0)"

  info_lines+=("${C_BOLD}${C_MUTX}MUTX install${C_RESET}")
  info_lines+=("${C_SOFT}Quiet install, current CLI surface, clean setup handoff.${C_RESET}")
  info_lines+=("")
  info_lines+=("${C_MUTX_ALT}Stages${C_RESET}")
  info_lines+=("$(dashboard_stage_line 0)")
  info_lines+=("$(dashboard_stage_line 1)")
  info_lines+=("$(dashboard_stage_line 2)")
  info_lines+=("")

  info_lines+=("${C_MUTX_ALT}Current${C_RESET}")
  case "${CURRENT_STEP_STATE}" in
    running)
      info_lines+=("${C_MUTX_ALT}$(dashboard_spinner_glyph)${C_RESET} ${CURRENT_STEP_LABEL}")
      ;;
    done)
      info_lines+=("${C_GOOD}✓${C_RESET} ${CURRENT_STEP_LABEL}")
      ;;
    warn)
      info_lines+=("${C_WARN}!${C_RESET} ${CURRENT_STEP_LABEL}")
      ;;
    *)
      info_lines+=("${C_SOFT}stand by${C_RESET}")
      ;;
  esac
  if [[ -n "${CURRENT_STEP_DETAIL}" ]]; then
    info_lines+=("${C_SOFT}${CURRENT_STEP_DETAIL}${C_RESET}")
  fi
  if [[ -n "${FINISH_MESSAGE}" ]]; then
    info_lines+=("")
    info_lines+=("${C_GOOD}${FINISH_MESSAGE}${C_RESET}")
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
  local title="${C_BOLD}${C_MUTX}MUTX install${C_RESET}"
  local subtitle="${C_SOFT}Install the CLI, verify the command surface, and hand off to setup.${C_RESET}"

  if [[ "${HAS_TTY}" == "1" ]]; then
    enter_alt_screen
  fi

  if [[ "${DASHBOARD_ACTIVE}" == "1" ]]; then
    BANNER_HAS_ANIMATED=1
    CURRENT_STEP_LABEL="Install plan"
    CURRENT_STEP_DETAIL="Preparing the package lane and command surface."
    CURRENT_STEP_STATE="idle"
    dashboard_render
    return
  fi

  clear_tty_screen
  tty_print '\n'
  render_ascii_frame 0 0
  tty_print "\n${title}\n"
  tty_print "${subtitle}\n\n"

  BANNER_HAS_ANIMATED=1
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

mutx_help_output() {
  local spec="$1"
  local -a cmd=("${MUTX_BIN}")
  local -a parts=()
  read -r -a parts <<< "${spec}"
  cmd+=("${parts[@]}")
  "${cmd[@]}" --help 2>&1 || true
}

mutx_supports_option() {
  local spec="$1"
  local option="$2"
  local help_text=""

  help_text="$(mutx_help_output "${spec}")"
  [[ "${help_text}" == *"${option}"* ]]
}

append_if_supported() {
  local target_name="$1"
  local spec="$2"
  local option="$3"
  shift 3

  if mutx_supports_option "${spec}" "${option}"; then
    eval "${target_name}+=(\"\${option}\")"
    while [[ "$#" -gt 0 ]]; do
      local value="$1"
      shift
      eval "${target_name}+=(\"\${value}\")"
    done
  fi
}

resolve_mutx_bin() {
  hash -r 2>/dev/null || true
  MUTX_BIN="$(command -v mutx || true)"
  [[ -n "${MUTX_BIN}" ]] || die "mutx was not found on PATH after install."
}

mutx_points_to_source_overlay() {
  local candidate="${MUTX_BIN}"
  if [[ -L "${MUTX_BIN}" ]]; then
    local linked=""
    linked="$(readlink "${MUTX_BIN}" 2>/dev/null || true)"
    if [[ -n "${linked}" ]]; then
      if [[ "${linked}" != /* ]]; then
        linked="$(cd "$(dirname "${MUTX_BIN}")" && pwd)/${linked}"
      fi
      candidate="${linked}"
    fi
  fi

  [[ "${candidate}" == "${MUTX_HOME_DIR}/runtime/source-cli/"* ]]
}

check_assistant_first_surface() {
  local -a required_specs=(
    "setup"
    "setup hosted"
    "setup local"
    "doctor"
    "runtime"
    "runtime inspect"
    "runtime open"
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

  if ! mutx_supports_option "setup hosted" "--provider"; then
    missing+=("mutx setup hosted --provider")
  fi
  if ! mutx_supports_option "setup hosted" "--install-openclaw"; then
    missing+=("mutx setup hosted --install-openclaw")
  fi
  if ! mutx_supports_option "setup hosted" "--import-openclaw"; then
    missing+=("mutx setup hosted --import-openclaw")
  fi
  if ! mutx_supports_option "setup local" "--provider"; then
    missing+=("mutx setup local --provider")
  fi
  if ! mutx_supports_option "setup local" "--install-openclaw"; then
    missing+=("mutx setup local --install-openclaw")
  fi
  if ! mutx_supports_option "setup local" "--import-openclaw"; then
    missing+=("mutx setup local --import-openclaw")
  fi

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
  if mutx_points_to_source_overlay; then
    note "Refreshing the MUTX source overlay to the latest main build."
    run_stage "Refreshing local CLI overlay" install_source_overlay
    SOURCE_OVERLAY_USED=1
    resolve_mutx_bin
  fi

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

local_control_plane_ready() {
  if ! command -v curl >/dev/null 2>&1; then
    return 1
  fi

  curl -fsS --max-time 2 "${LOCAL_API_URL}/health" >/dev/null 2>&1 && return 0
  curl -fsS --max-time 2 "${LOCAL_API_URL}/ready" >/dev/null 2>&1 && return 0
  return 1
}

detect_local_repo_root() {
  local current="${PWD}"

  while [[ -n "${current}" && "${current}" != "/" ]]; do
    if [[ -f "${current}/Makefile" && -f "${current}/scripts/dev.sh" ]]; then
      printf '%s\n' "${current}"
      return 0
    fi
    current="$(dirname "${current}")"
  done

  return 1
}

maybe_start_local_control_plane() {
  if local_control_plane_ready; then
    return 0
  fi

  local repo_root=""
  repo_root="$(detect_local_repo_root 2>/dev/null || true)"
  if [[ -z "${repo_root}" ]] || ! command -v make >/dev/null 2>&1; then
    return 1
  fi

  local restore_alt="${ALT_SCREEN_ACTIVE}"
  if [[ "${restore_alt}" == "1" ]]; then
    leave_alt_screen
  fi

  say "Detected a MUTX repo at ${repo_root}. Starting the local control plane with make dev-up"
  if ! (cd "${repo_root}" && make dev-up) < /dev/tty > /dev/tty 2>&1; then
    if [[ "${restore_alt}" == "1" ]]; then
      enter_alt_screen
    fi
    return 1
  fi

  local attempts=0
  while [[ "${attempts}" -lt 30 ]]; do
    if local_control_plane_ready; then
      if [[ "${restore_alt}" == "1" ]]; then
        enter_alt_screen
      fi
      return 0
    fi
    sleep 1
    attempts=$((attempts + 1))
  done

  if [[ "${restore_alt}" == "1" ]]; then
    enter_alt_screen
  fi
  return 1
}

run_setup_handoff() {
  detect_openclaw_runtime
  local -a hosted_cmd=("${MUTX_BIN}" setup hosted --api-url "${HOSTED_API_URL}")
  local -a local_cmd=("${MUTX_BIN}" setup local)
  local handoff_note=""

  append_if_supported hosted_cmd "setup hosted" "--provider" "openclaw"
  append_if_supported hosted_cmd "setup hosted" "--install-openclaw"
  append_if_supported local_cmd "setup local" "--provider" "openclaw"
  append_if_supported local_cmd "setup local" "--install-openclaw"

  if [[ "${OPEN_TUI}" != "0" ]]; then
    append_if_supported hosted_cmd "setup hosted" "--open-tui"
    append_if_supported local_cmd "setup local" "--open-tui"
    handoff_note="MUTX validates OpenClaw, resumes upstream onboarding if needed, then opens the TUI."
  else
    handoff_note="MUTX validates OpenClaw, resumes upstream onboarding if needed, then stays in the CLI."
  fi

  if [[ "${NO_ONBOARD}" == "1" ]] || ! is_promptable; then
    leave_alt_screen
    say "Install complete"
    note "Next steps:"
    note "  mutx setup hosted --install-openclaw"
    note "  mutx setup local --install-openclaw"
    note "  mutx setup hosted --import-openclaw"
    note "  mutx setup local --import-openclaw"
    note "Local setup can provision a private localhost control plane under ~/.mutx/runtime/local-control."
    note "  mutx doctor"
    note "  mutx runtime inspect openclaw"
    if [[ "${OPENCLAW_DETECTED}" == "1" ]]; then
      note "OpenClaw detected at ${OPENCLAW_BIN}; setup will offer Import Existing OpenClaw 🦞 and track it under ~/.mutx/providers/openclaw."
    fi
    note "MUTX leaves your upstream OpenClaw home in place and does not upload local gateway keys."
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
      tty_print "${C_MUTX_ALT}●${C_RESET} ${C_GOOD}ready for setup handoff${C_RESET}\n"
      tty_print "\n"
      tty_print "${C_PANEL}╭─ ${C_BOLD}Setup Wizard${C_RESET}${C_PANEL} ─────────────────────────────────────────────╮${C_RESET}\n"
      tty_print "${C_PANEL}│${C_RESET} ${C_SOFT}Choose the next lane and provider wizard.${C_RESET}\n"
      if [[ "${SOURCE_OVERLAY_USED}" == "1" ]]; then
        tty_print "${C_PANEL}│${C_RESET} ${C_GOOD}runtime${C_RESET} fresh CLI overlay active\n"
      else
        tty_print "${C_PANEL}│${C_RESET} ${C_GOOD}runtime${C_RESET} packaged CLI is current\n"
      fi
      tty_print "${C_PANEL}│${C_RESET} ${C_BOLD}providers${C_RESET} OpenClaw active · LangChain soon · n8n soon\n"
      if [[ "${OPENCLAW_DETECTED}" == "1" ]]; then
        tty_print "${C_PANEL}│${C_RESET} ${C_GOOD}openclaw${C_RESET} detected at ${C_DIM}$(display_path "${OPENCLAW_BIN}" 34)${C_RESET}\n"
        tty_print "${C_PANEL}│${C_RESET} ${C_GOOD}import${C_RESET} tracking ${C_DIM}$(display_path "${OPENCLAW_HOME}" 22)${C_RESET} in ~/.mutx/providers/openclaw\n"
      else
        tty_print "${C_PANEL}│${C_RESET} ${C_WARN}openclaw${C_RESET} not detected yet · the wizard can install and track it for you\n"
      fi
      tty_print "${C_PANEL}│${C_RESET} ${C_SOFT}privacy${C_RESET} OpenClaw stays local and MUTX does not upload keys\n"
      tty_print "${C_PANEL}│${C_RESET} ${C_SOFT}${handoff_note}${C_RESET}\n"
      tty_print "${C_PANEL}│${C_RESET} ${C_SOFT}local${C_RESET} MUTX can bootstrap a private localhost control plane when you choose Local\n"
      tty_print "${C_PANEL}│${C_RESET}\n"
      tty_print "${C_PANEL}│${C_RESET} ${C_BOLD}1${C_RESET}  Hosted lane   ${C_DIM}${HOSTED_API_URL}${C_RESET}\n"
      tty_print "${C_PANEL}│${C_RESET} ${C_BOLD}2${C_RESET}  Local lane    ${C_DIM}${LOCAL_API_URL}${C_RESET}\n"
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
  note "  mutx setup hosted --install-openclaw"
  note "  mutx setup local --install-openclaw"
  note "  mutx setup hosted --import-openclaw"
  note "  mutx setup local --import-openclaw"
  note "  local setup can provision a private localhost stack under ~/.mutx/runtime/local-control"
  note "  mutx doctor"
  note "  mutx runtime inspect openclaw"
  if [[ "${OPENCLAW_DETECTED}" == "1" ]]; then
    note "OpenClaw detected at ${OPENCLAW_BIN}; setup will offer Import Existing OpenClaw 🦞 and track it under ~/.mutx/providers/openclaw."
  fi
  note "Local OpenClaw secrets remain on this machine."
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
