#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "${1:-}" == "--with-playwright" ]]; then
  export MUTX_SKIP_PLAYWRIGHT=0
else
  export MUTX_SKIP_PLAYWRIGHT="${MUTX_SKIP_PLAYWRIGHT:-1}"
fi

export NEXT_PUBLIC_TURNSTILE_SITE_KEY="${NEXT_PUBLIC_TURNSTILE_SITE_KEY:-ci-test-site-key}"
export TURNSTILE_SECRET_KEY="${TURNSTILE_SECRET_KEY:-ci-test-secret-key}"

echo "Running MUTX release check"
echo "- MUTX_SKIP_PLAYWRIGHT=$MUTX_SKIP_PLAYWRIGHT"
echo "- NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY"
echo "- TURNSTILE_SECRET_KEY=***"
echo ""

bash "$ROOT_DIR/scripts/test.sh"
