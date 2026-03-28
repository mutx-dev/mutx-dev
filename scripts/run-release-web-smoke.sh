#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -n "${PORT:-}" ]]; then
  PORT="$PORT"
else
  PORT="$(node --input-type=module <<'NODE'
import net from "node:net";

const start = 3100;
const end = 3199;

function isFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

for (let port = start; port <= end; port += 1) {
  if (await isFree(port)) {
    process.stdout.write(String(port));
    process.exit(0);
  }
}

process.stderr.write("No free port found in 3100-3199.\n");
process.exit(1);
NODE
)"
fi
BASE_URL="${BASE_URL:-http://127.0.0.1:${PORT}}"
SERVER_LOG="$(mktemp)"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi
  rm -f "$SERVER_LOG"
}
trap cleanup EXIT

echo "Preparing standalone assets for release smoke..."
npm run prepare:standalone

echo "Starting standalone server on ${BASE_URL}..."
PORT="$PORT" HOSTNAME="127.0.0.1" node scripts/start-standalone.mjs >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 120); do
  if curl -fsS "${BASE_URL}/dashboard" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "${BASE_URL}/dashboard" >/dev/null 2>&1; then
  echo "Standalone server failed to become ready."
  cat "$SERVER_LOG"
  exit 1
fi

echo "Running serial browser smoke against ${BASE_URL}..."
BASE_URL="$BASE_URL" PORT="$PORT" npx playwright test \
  tests/website.spec.ts \
  tests/dashboardAgents.spec.ts \
  tests/dashboardOpenClaw.spec.ts \
  tests/dashboardRouteMatrix.spec.ts \
  tests/login.spec.ts \
  tests/registration.spec.ts \
  --project=chromium \
  --workers=1

echo "Running desktop cockpit smoke against ${BASE_URL}..."
node scripts/desktop-cockpit-smoke.mjs --base-url="$BASE_URL"
