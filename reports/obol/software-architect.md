# Software Architect Report: MUTX/OpenClaw × Obol Stack / Obol SDK

## Executive Summary

Obol is shipping two distinct things:
- **Obol Stack**: a Kubernetes-based runtime substrate for OpenClaw agents, local blockchain/network workloads, in-cluster LLM routing, remote signing, public service exposure, and x402 payment-gated services.
- **Obol SDK**: a TypeScript client for the Obol API / distributed-validator lifecycle, plus lock validation, exits, splits, deposits, and withdrawals.

For MUTX, the key architectural conclusion is:

> Treat **Obol Stack as an optional runtime/provider**, and treat **Obol SDK as a separate DVT domain adapter**.

Do **not** make Obol’s K8s CRDs or runtime internals the center of MUTX.

## What the repos show

### Obol Stack = execution substrate
The stack runtime provides:
- OpenClaw deployment into a local K8s cluster (`vendor/obol/obol-stack/README.md`)
- in-cluster **eRPC** endpoints with internal/external URLs (`vendor/obol/obol-stack/internal/embed/infrastructure/values/erpc-metadata.yaml.gotmpl`)
- a **remote-signer** API for message / typed-data / tx signing (`vendor/obol/obol-stack/internal/embed/skills/ethereum-local-wallet/references/remote-signer-api.md`)
- public service exposure with **HTTPRoute + Traefik ForwardAuth + x402-verifier** (`vendor/obol/obol-stack/internal/embed/skills/sell/SKILL.md`, `vendor/obol/obol-stack/internal/embed/skills/sell/scripts/monetize.py`)
- ERC-8004 registration patterns and registration JSON generation (`vendor/obol/obol-stack/internal/embed/skills/discovery/references/erc8004-registry.md`, `.../sell/scripts/monetize.py`)
- buyer-side x402 support via pre-signed voucher pools and the `x402-buyer` sidecar (`vendor/obol/obol-stack/internal/embed/skills/buy-inference/SKILL.md`)

### Obol SDK = DVT / validator domain client
The SDK exposes:
- `createClusterDefinition`
- `acceptClusterDefinition`
- `getClusterDefinition`
- `getClusterLock`
- `validateClusterLock`
- exit verification / recombination
- splits / OVM / EOA flows

References:
- `vendor/obol/obol-sdk/README.md`
- `vendor/obol/obol-sdk/src/index.ts`
- `vendor/obol/obol-sdk/src/services.ts`
- `vendor/obol/obol-sdk/src/exits/exit.ts`

## Recommended bounded contexts

1. **MUTX Core Control Plane**
   - agent lifecycle
   - policy/governance
   - provider selection
   - workflow orchestration

2. **Runtime Provider Context**
   - local OpenClaw runtime
   - Obol Stack runtime provider
   - future cloud/VPS providers

3. **Wallet & Payments Context**
   - signer abstraction
   - spend policy
   - x402 buy/sell support

4. **Identity & Discovery Context**
   - ERC-8004 registration docs
   - service endpoint declarations
   - domain verification

5. **DVT / Validator Operations Context**
   - Obol API / SDK integration
   - cluster definition / lock ingestion
   - exits / splits / operator workflows

## Control-plane boundaries

### MUTX should remain system-of-record for intent
MUTX should decide:
- which runtime/provider an agent uses
- which capabilities are enabled
- which endpoints are publishable
- what payment and identity policy applies

### Obol Stack should remain an execution plane
Obol Stack should own:
- K8s resources and service wiring
- network sync workloads
- remote-signer implementation
- x402 verifier / buyer sidecars
- HTTPRoute / Middleware / tunnel exposure

Evidence:
- eRPC metadata: `vendor/obol/obol-stack/internal/embed/infrastructure/values/erpc-metadata.yaml.gotmpl`
- frontend/agent service wiring: `vendor/obol/obol-stack/internal/embed/infrastructure/values/obol-frontend.yaml.gotmpl`
- agent RBAC over `serviceoffers`, `middlewares`, `httproutes`: `vendor/obol/obol-stack/internal/embed/networks/ethereum/templates/agent-rbac.yaml`

### Obol SDK should sit behind a DVT adapter
The SDK’s primitives are clearly domain-specific, especially around:
- `config_hash`
- cluster definitions
- cluster locks
- exits
- reward/withdrawal splits

This should be an **Obol DVT module**, not generic runtime plumbing.

## Concrete integration architecture

```text
MUTX Control Plane
  ├── Runtime Provider API
  │     ├── Local/OpenClaw provider
  │     └── Obol Stack provider
  ├── Wallet/Payments API
  │     ├── generic signer abstraction
  │     └── x402 capability abstraction
  ├── Identity/Registry API
  │     └── ERC-8004 adapter
  └── DVT Domain API
        └── Obol SDK adapter
```

## Cluster / runtime model

Obol Stack appears to be a **single-cluster substrate** with namespaced workloads:
- OpenClaw agents
- network deployments (Ethereum, Aztec)
- shared infra (LiteLLM, eRPC, x402, frontend, tunnels)

### MUTX should model this as a runtime class
Suggested capability model:

```text
RuntimeClass: obol-stack
  capabilities:
    - ethereum-rpc
    - local-wallet-signer
    - public-http-exposure
    - x402-sell
    - x402-buy
    - erc8004-registration
    - k8s-service-catalog
    - dvt-ops (optional addon)
```

This gives MUTX a provider-neutral vocabulary while preserving Obol-specific capability checks.

## Wallet / RPC / service exposure

### RPC
Obol exposes eRPC:
- internal: `http://erpc.erpc.svc.cluster.local/rpc/{{network}}`
- external: `http://obol.stack/rpc/{{network}}`

Reference: `vendor/obol/obol-stack/internal/embed/infrastructure/values/erpc-metadata.yaml.gotmpl`

Recommendation: MUTX should store these as discovered provider metadata, not hardcode URL shapes.

### Wallet / signer
Obol’s wallet model is **remote signing, not key export**.

Remote-signer endpoints:
- `GET /api/v1/keys`
- `POST /api/v1/sign/{address}/transaction`
- `POST /api/v1/sign/{address}/message`
- `POST /api/v1/sign/{address}/typed-data`
- `POST /api/v1/sign/{address}/hash`

Reference: `vendor/obol/obol-stack/internal/embed/skills/ethereum-local-wallet/references/remote-signer-api.md`

Recommendation: MUTX should implement an `ObolRemoteSignerWalletCapability` behind a generic wallet interface.

### Service exposure
Obol’s sell flow uses:
- `ServiceOffer` CRs
- health checks
- Traefik ForwardAuth -> `x402-verifier`
- Gateway API `HTTPRoute`
- optional ERC-8004 registration

References:
- `vendor/obol/obol-stack/internal/embed/skills/sell/SKILL.md`
- `vendor/obol/obol-stack/internal/embed/skills/sell/scripts/monetize.py`

Recommendation: MUTX should expose a provider-neutral `publishService(...)` contract, with Obol implementing it through ServiceOffers and associated K8s resources.

Do **not** adopt `ServiceOffer` as MUTX’s global service model.

## Provider abstraction

MUTX should abstract:
- signer access
- RPC endpoint discovery
- service publication
- x402 payment-gating support
- identity registration
- runtime health/status

MUTX should leave provider-specific:
- ConfigMap-backed x402 auth pools
- Traefik/Gateway API resource naming
- Cloudflare tunnel topology
- Obol cluster `config_hash` / `lock_hash`

## Identity / registry / x402 hooks

### ERC-8004
Obol already has the right semantic pieces:
- registration JSON schema
- `x402Support`
- `registrations[]`
- `services[]`
- domain verification file format

Reference:
- `vendor/obol/obol-stack/internal/embed/skills/discovery/references/erc8004-registry.md`

Recommendation:
1. provider returns verified endpoints
2. MUTX assembles canonical agent registration JSON
3. identity adapter publishes off-chain JSON
4. on-chain registration remains optional / policy-gated

### x402 sell-side
Obol’s verifier supports:
- global and per-route `payTo`
- per-route `network`
- `upstreamAuth` injection
- route-based pricing config

Reference:
- `vendor/obol/obol-stack/internal/x402/config.go`

Recommendation: model x402 in MUTX as a **generic payable HTTP capability**, not just “paid LLM inference”.

### x402 buy-side
The buyer flow is:
1. probe endpoint -> 402 pricing
2. pre-sign N ERC-3009 auths via remote-signer
3. store auths/config in ConfigMaps
4. route through `x402-buyer` sidecar
5. expose via static `paid/<remote-model>` namespace in LiteLLM

Reference:
- `vendor/obol/obol-stack/internal/embed/skills/buy-inference/SKILL.md`

Recommendation: expose this in MUTX as a **budgeted paid-service consumption** capability.

## Where MUTX should integrate first

### First wedge: Obol Stack provider for signer + RPC + paid/public service exposure
This is the highest-leverage path.

Suggested order:
1. **Obol runtime/provider integration**
2. **remote-signer wallet backend**
3. **eRPC provider integration**
4. **service publication / x402 seller flow**
5. **ERC-8004 registration sync**
6. **x402 buyer flow**
7. **Obol SDK read-only DVT integration**
8. **Obol SDK write workflows only later**

## Obol SDK recommendation

Use the SDK **read-first**:
- fetch cluster definitions
- fetch cluster locks
- validate cluster locks
- inspect exits / operator topology

Only later consider signer-aware writes:
- create/join clusters
- deploy splits
- request withdrawals / deposits
- orchestrate exits

Reason: the write surface is materially more sensitive and belongs behind explicit governance.

## Security / risk assessment

### 1. Runtime coupling risk — medium/high
Risk: leaking Obol K8s/CRD assumptions into MUTX core.
Mitigation: provider boundary.

### 2. Signer risk — medium
Risk: cluster compromise becomes signing risk.
Mitigation: policy gate, audit logging, least privilege, separate spend authority.

### 3. x402 buyer voucher risk — medium
Risk: pre-signed auth theft or misuse.
Mitigation: treat auth pools as sensitive, tighten RBAC, set explicit spend ceilings.

### 4. Public exposure risk — medium
Risk: accidental publication of internal surfaces.
Mitigation: explicit publish intent, route classification, default deny.

### 5. DVT write risk — high if enabled early
Risk: operationally and financially sensitive workflows.
Mitigation: start read-only; require human approval for writes.

## Phased roadmap

### Phase 0 — compatibility spike
- detect Obol runtime
- discover signer/rpc/x402/identity capabilities

### Phase 1 — runtime provider
- implement `ObolRuntimeProvider`
- surface runtime health, networks, signer addresses

### Phase 2 — wallet + identity
- remote-signer wallet adapter
- ERC-8004 registration JSON generation and sync

### Phase 3 — commerce
- publish paid service abstraction
- Obol x402 seller integration
- later buyer integration

### Phase 4 — DVT read model
- Obol SDK adapter for cluster definitions/locks/exits
- validation and monitoring workflows

### Phase 5 — governed write workflows
- create/join clusters
- splits / exits / withdrawals
- only with strong approval controls

## Final recommendation

### Yes: expose Obol-backed infrastructure as a MUTX provider/runtime
That is the cleanest and most strategic first move.

### Yes: add workflows around wallets, ERC-8004 registration, and x402
These are the most product-relevant capabilities Obol adds to OpenClaw.

### Yes, later: integrate Obol SDK for DVT operations as a dedicated domain module
Start read-only.

### No, not initially: deeply embed Obol Stack control-plane internals into MUTX core
That would create unnecessary coupling.

## Bottom line

If MUTX wants one clear first integration point, it should be:

> **MUTX → Obol provider for remote signing, chain RPC, and paid/public service publication, with ERC-8004 identity sync layered above it.**

That captures Obol’s strongest differentiators while keeping the architecture reversible and maintainable.
