#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DIST_DIR="$ROOT_DIR/dist/desktop"
VERSION="$(node -p "require('$ROOT_DIR/package.json').version")"
OUTPUT_FILE="$DIST_DIR/MUTX-${VERSION}-SHA256SUMS.txt"

if [[ ! -d "$DIST_DIR" ]]; then
  echo "Desktop artifact directory does not exist: $DIST_DIR" >&2
  exit 1
fi

cd "$DIST_DIR"

artifacts=()
for pattern in *.dmg *.zip; do
  for artifact in $pattern; do
    if [[ -f "$artifact" ]]; then
      artifacts+=("$artifact")
    fi
  done
done

if [[ "${#artifacts[@]}" -eq 0 ]]; then
  echo "No desktop artifacts found in $DIST_DIR" >&2
  exit 1
fi

IFS=$'\n' artifacts=($(printf '%s\n' "${artifacts[@]}" | sort))
unset IFS

shasum -a 256 "${artifacts[@]}" >"$OUTPUT_FILE"

echo "Wrote checksums to $OUTPUT_FILE"
