#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="${ROOT_DIR}/terraform"
OUT_FILE="${ROOT_DIR}/ansible/inventory.generated.ini"

command -v terraform >/dev/null 2>&1 || { echo "❌ terraform not found"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "❌ jq not found"; exit 1; }

if [[ ! -d "${TF_DIR}" ]]; then
  echo "❌ Terraform directory not found: ${TF_DIR}"
  exit 1
fi

cd "${TF_DIR}"

if [[ ! -d .terraform ]]; then
  echo "⚠️ Terraform not initialized. Run: terraform init"
fi

echo "🔎 Reading terraform outputs..."
DROPLET_PUBLIC_JSON="$(terraform output -json droplet_public_ips 2>/dev/null || echo '{}')"
DROPLET_PRIVATE_JSON="$(terraform output -json droplet_ips 2>/dev/null || echo '{}')"

if [[ "${DROPLET_PUBLIC_JSON}" == "{}" ]]; then
  echo "❌ No droplet_public_ips output found. Apply Terraform first."
  exit 1
fi

echo "📝 Writing ${OUT_FILE}"
{
  echo "# Generated from terraform outputs on $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "[agents]"
  echo "${DROPLET_PUBLIC_JSON}" | jq -r 'to_entries[] | "\(.key) ansible_host=\(.value) ansible_user=root"'
  echo
  echo "[all:vars]"
  echo "ansible_python_interpreter=/usr/bin/python3"
  echo "ansible_ssh_common_args='-o StrictHostKeyChecking=accept-new'"
  echo
  echo "# Private network IPs (reference)"
  echo "[agents_private]"
  echo "${DROPLET_PRIVATE_JSON}" | jq -r 'to_entries[] | "\(.key) private_ip=\(.value)"'
} > "${OUT_FILE}"

echo "✅ Generated inventory: ${OUT_FILE}"
