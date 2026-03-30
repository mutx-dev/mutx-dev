# Obol Integration Brief

## Goal
Figure out how to integrate Obol Stack + ObolClaw + Obol SDK into the MUTX / OpenClaw workspace and product direction.

## Source material
- Blog: `https://blog.obol.org/introducing-obolclaw/`
- Release: `https://github.com/ObolNetwork/obol-stack/releases/tag/v0.7.0-rc1`
- SDK: `vendor/obol/obol-sdk`
- Stack: `vendor/obol/obol-stack`

## What Obol is claiming
- Obol Stack adds native support for OpenClaw agents (ObolClaw)
- Agents get Ethereum RPC, local wallet infra, public service exposure, and onchain agent registration
- `v0.7.0-rc1` adds agent registry, x402 payment-gated inference, ERC-8004 agent identity, wallet backup/restore, and heartbeat efficiency improvements
- Stack is Kubernetes/Helm based and can deploy OpenClaw instances, networks, apps, and skills
- SDK is a Typescript client for distributed validators / Obol API with signer-aware writes and read-only fetch methods

## Desired deliverables
1. An executive summary of what this means for MUTX
2. A technical integration architecture for MUTX/OpenClaw + Obol
3. A security/risk assessment
4. A phased roadmap with quick wins vs deep integration
5. A concrete recommendation on whether we should:
   - embed/support ObolStack from MUTX
   - expose Obol-backed infrastructure as a MUTX provider/runtime
   - add agent workflows around wallets, ERC-8004 registration, x402, and agent commerce

## Output format
Each role writes its findings to `reports/obol/<role>.md`.
Be concrete. Prefer repo/file references when possible.
