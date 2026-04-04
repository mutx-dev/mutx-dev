#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RELEASE_VERSION="${RELEASE_VERSION:-$(node -p "require('./package.json').version")}"
RELEASE_LINE="${RELEASE_VERSION%.*}"
SITE_URL="${SITE_URL:-https://mutx.dev}"
APP_URL="${APP_URL:-https://app.mutx.dev}"
API_URL="${API_URL:-https://api.mutx.dev}"
DOCS_RELEASE_URL="${DOCS_RELEASE_URL:-https://docs.mutx.dev/docs/releases/v${RELEASE_LINE}}"
RELEASE_NOTES_ROUTE="${RELEASE_NOTES_ROUTE:-${SITE_URL}/download/macos/release-notes}"

normalize_url() {
  local url="$1"
  printf '%s' "${url%/}"
}

require_content() {
  local url="$1"
  local pattern="$2"
  local body

  echo "Checking ${url} contains ${pattern}..."
  body="$(curl -fsSL --retry 3 --retry-delay 2 "${url}")"
  if ! grep -qi "${pattern}" <<<"${body}"; then
    echo "Expected ${url} to contain pattern: ${pattern}" >&2
    exit 1
  fi
}

require_ok() {
  local url="$1"

  echo "Checking ${url}..."
  curl -fsSL --retry 3 --retry-delay 2 "${url}" >/dev/null
}

effective_url() {
  curl -fsSL --retry 3 --retry-delay 2 -o /dev/null -w '%{url_effective}' "$1"
}

require_content "${SITE_URL}" "Download for Mac"
require_content "${SITE_URL}" "Open dashboard"
require_content "${SITE_URL}/download/macos" "Download MUTX for macOS"
require_content "${APP_URL}/login" "Welcome back"
require_content "${APP_URL}/register" "Create your account"
require_content "${DOCS_RELEASE_URL}" "MUTX v1.3"
require_ok "${API_URL}/health"
require_ok "${API_URL}/ready"

bash "$ROOT_DIR/scripts/verify-production-seo.sh"

dashboard_effective_url="$(normalize_url "$(effective_url "${APP_URL}/dashboard")")"
expected_dashboard_url="$(normalize_url "${APP_URL}/dashboard")"
expected_login_url="$(normalize_url "${APP_URL}/login")"
if [[ "${dashboard_effective_url}" != "${expected_dashboard_url}" && "${dashboard_effective_url}" != "${expected_login_url}" ]]; then
  echo "Unexpected dashboard redirect target: ${dashboard_effective_url}" >&2
  exit 1
fi

release_notes_effective_url="$(normalize_url "$(effective_url "${RELEASE_NOTES_ROUTE}")")"
expected_release_notes_url="$(normalize_url "${DOCS_RELEASE_URL}")"
if [[ "${release_notes_effective_url}" != "${expected_release_notes_url}" ]]; then
  echo "Release notes route resolved to ${release_notes_effective_url}, expected ${expected_release_notes_url}" >&2
  exit 1
fi

echo "Public release verification passed for ${RELEASE_VERSION}."
