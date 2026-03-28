#!/usr/bin/env bash

set -euo pipefail

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

if [[ "${RUNNER_OS:-}" != "macOS" ]]; then
  echo "CI signing setup only supports macOS runners." >&2
  exit 1
fi

require_env APPLE_DEVELOPER_ID_APP_CERT_B64
require_env APPLE_DEVELOPER_ID_APP_CERT_PASSWORD
require_env APPLE_API_KEY_B64
require_env APPLE_API_KEY_ID
require_env APPLE_API_ISSUER
require_env APPLE_TEAM_ID
require_env GITHUB_ENV

RUNNER_TEMP_DIR="${RUNNER_TEMP:-$(mktemp -d)}"
KEYCHAIN_PASSWORD="${APPLE_KEYCHAIN_PASSWORD:-mutx-ci-signing}"
CERT_PATH="$RUNNER_TEMP_DIR/mutx-developer-id.p12"
KEYCHAIN_PATH="$RUNNER_TEMP_DIR/mutx-signing.keychain-db"
API_KEY_PATH="$RUNNER_TEMP_DIR/AuthKey_${APPLE_API_KEY_ID}.p8"

echo "$APPLE_DEVELOPER_ID_APP_CERT_B64" | base64 --decode >"$CERT_PATH"
echo "$APPLE_API_KEY_B64" | base64 --decode >"$API_KEY_PATH"

security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
security set-keychain-settings -lut 21600 "$KEYCHAIN_PATH"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
security import "$CERT_PATH" \
  -k "$KEYCHAIN_PATH" \
  -P "$APPLE_DEVELOPER_ID_APP_CERT_PASSWORD" \
  -T /usr/bin/codesign \
  -T /usr/bin/security \
  -T /usr/bin/productbuild
security set-key-partition-list -S apple-tool:,apple: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"

EXISTING_KEYCHAINS="$(security list-keychains -d user | tr -d '"')"
security list-keychains -d user -s "$KEYCHAIN_PATH" $EXISTING_KEYCHAINS
security default-keychain -d user -s "$KEYCHAIN_PATH"

{
  echo "APPLE_API_KEY=$API_KEY_PATH"
  echo "APPLE_API_KEY_ID=$APPLE_API_KEY_ID"
  echo "APPLE_API_ISSUER=$APPLE_API_ISSUER"
  echo "APPLE_TEAM_ID=$APPLE_TEAM_ID"
  echo "APPLE_KEYCHAIN=$KEYCHAIN_PATH"
} >>"$GITHUB_ENV"

echo "Configured macOS signing keychain at $KEYCHAIN_PATH"
echo "Configured App Store Connect API key at $API_KEY_PATH"
