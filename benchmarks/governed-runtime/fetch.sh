#!/bin/sh
# Fetch the AgentDojo recorded run logs (MIT) at a pinned commit into $1, sparse and partial.
set -eu

DEST="${1:?usage: fetch.sh <destination-dir>}"
REPO=https://github.com/ethz-spylab/agentdojo.git
SHA=089ed468cf3ed0322acc66b0211f26d9d90dbf60

git clone --quiet --filter=blob:none --no-checkout "$REPO" "$DEST"
git -C "$DEST" sparse-checkout init --no-cone
git -C "$DEST" sparse-checkout set \
  '/LICENSE' \
  '/runs/gpt-4o-2024-05-13/*/*/none/' \
  '/runs/gpt-4o-2024-05-13/*/*/important_instructions/' \
  '/runs/claude-3-5-sonnet-20241022/*/*/none/' \
  '/runs/claude-3-5-sonnet-20241022/*/*/important_instructions/' \
  '/runs/claude-3-7-sonnet-20250219/*/*/none/' \
  '/runs/claude-3-7-sonnet-20250219/*/*/important_instructions/' \
  '/runs/gemini-1.5-pro-002/*/*/none/' \
  '/runs/gemini-1.5-pro-002/*/*/important_instructions/'
git -C "$DEST" checkout --quiet "$SHA"
echo "fetched $(git -C "$DEST" rev-parse HEAD)"
