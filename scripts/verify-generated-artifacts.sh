#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PYTHON_BIN="${PYTHON_BIN:-${1:-}}"
OPENAPI_PATH="docs/api/openapi.json"
TYPES_PATH="app/types/api.ts"

if [[ -z "$PYTHON_BIN" ]]; then
  echo "PYTHON_BIN is required to verify generated artifacts."
  exit 1
fi

TMP_DIR="$(mktemp -d)"
restore_artifacts() {
  if [[ -f "$TMP_DIR/openapi.json" ]]; then
    cp "$TMP_DIR/openapi.json" "$OPENAPI_PATH"
  fi
  if [[ -f "$TMP_DIR/api.ts" ]]; then
    cp "$TMP_DIR/api.ts" "$TYPES_PATH"
  fi
  rm -rf "$TMP_DIR"
}
trap restore_artifacts EXIT

cp "$OPENAPI_PATH" "$TMP_DIR/openapi.json"
cp "$TYPES_PATH" "$TMP_DIR/api.ts"

PYTHON_BIN="$PYTHON_BIN" bash "$ROOT_DIR/scripts/generate-contract-artifacts.sh"

if ! cmp -s "$OPENAPI_PATH" "$TMP_DIR/openapi.json"; then
  echo "OpenAPI spec is out of date. Run: npm run generate:contracts"
  exit 1
fi

if ! cmp -s "$TYPES_PATH" "$TMP_DIR/api.ts"; then
  echo "Frontend API types are out of date. Run: npm run generate:contracts"
  exit 1
fi

echo "Generated OpenAPI artifacts are current."
