# Obol Stack infrastructure assessment for MUTX

## Executive summary

Obol Stack is not just “OpenClaw with some crypto extras.” It is a small single-node Kubernetes distribution that bootstraps a whole local agent platform around OpenClaw, with:

- a local cluster backend (`k3d` on Docker by default, `k3s` on Linux bare metal) (`internal/stack/stack.go`, `internal/stack/backend_k3d.go`, `internal/stack/backend_k3s.go`)
- a default infrastructure helmfile that installs routing, monitoring, eRPC, LiteLLM, the Obol frontend, and dormant Cloudflare tunnel support (`internal/embed/infrastructure/helmfile.yaml`)
- per-agent OpenClaw deployments plus a colocated Ethereum remote signer (`internal/openclaw/openclaw.go`)
- an agent monetization model built around Kubernetes-native `ServiceOffer` CRs, x402 gating, and optional ERC-8004 registration (`internal/embed/infrastructure/base/templates/serviceoffer-crd.yaml`, `cmd/obol/sell.go`)

For MUTX, the right framing is: **Obol Stack is best treated as an optional infrastructure provider/runtime profile, not as something MUTX should absorb wholesale into its default local dev path.**

Why:

- It assumes strong control of the host: Docker or sudo/root, `/etc/hosts` changes, local DNS, local persistent volumes, wallet material, and sometimes Cloudflare tunnel state.
- It is opinionated toward a single-node local cluster, not toward a generic remote multi-tenant control plane.
- It couples agent execution, model routing, blockchain RPC, signing, public exposure, and commerce into one stack. Useful, but heavier than MUTX’s likely default needs.

My recommendation: **support Obol-backed infrastructure as a MUTX runtime/provider integration**, with selective reuse of its ideas (wallet, signer, x402/registry workflows, service publication), rather than embedding the entire stack as a core MUTX dependency.

---

## What the stack actually installs and runs

### 1) Cluster lifecycle and backends

The stack is initialized with `obol stack init`, which:

- creates a stack config dir
- chooses a backend (`k3d` default, `k3s` optional)
- templates backend config
- copies embedded default Helm manifests into a `defaults/` directory
- resolves host Ollama connectivity placeholders like `{{OLLAMA_HOST_IP}}`
- persists a generated stack id (`.stack-id`) and backend choice

References:

- `internal/stack/stack.go:Init`
- `internal/stack/backend_k3d.go`
- `internal/stack/backend_k3s.go`

`obol stack up` then:

1. starts the cluster backend
2. writes kubeconfig
3. `helmfile sync`s the embedded infrastructure
4. starts/configures local wildcard DNS for `*.obol.stack`
5. auto-configures LiteLLM providers if possible
6. deploys the default OpenClaw instance
7. patches in “agent capabilities” (RBAC + heartbeat)
8. optionally starts a persistent Cloudflare tunnel if previously provisioned

Reference: `internal/stack/stack.go:Up`, `syncDefaults`

### 2) Default cluster infrastructure

The embedded infra helmfile installs the following by default (`internal/embed/infrastructure/helmfile.yaml`):

- `base`: raw manifests including storage/system resources
- `monitoring`: `kube-prometheus-stack`
- `traefik`: ingress/gateway controller using Gateway API, `LoadBalancer` service
- `cloudflared`: tunnel chart, dormant until configured
- `reloader`: auto-restart workloads on ConfigMap/Secret changes
- `erpc`: Ethereum RPC proxy/aggregator
- `obol-frontend`: the web UI at `obol.stack`
- RBAC so the frontend can discover OpenClaw instances and manipulate `ServiceOffer` CRs

Notable details:

- Routing is Gateway API-first, not legacy Ingress.
- Hostname defaults to `obol.stack` and subdomains under it.
- TLS is intentionally disabled in local dev Traefik config.
- Monitoring is lean: Prometheus on, Grafana and Alertmanager off by default.

References:

- `internal/embed/infrastructure/helmfile.yaml`
- `internal/embed/infrastructure/values/monitoring.yaml.gotmpl`
- `internal/embed/infrastructure/values/obol-frontend.yaml.gotmpl`

### 3) LLM path

The stack does **not** run Ollama in-cluster. Instead it creates:

- a ClusterIP service `ollama.llm.svc.cluster.local`
- a matching Endpoints object pointing back to the host machine
- a `litellm` deployment that becomes the canonical OpenAI-compatible gateway for OpenClaw
- an `x402-buyer` sidecar/container for paid upstream consumption

Reference: `internal/embed/infrastructure/base/templates/llm.yaml`

Important consequence: local host networking is part of the design. In k3d mode, host reachability depends on Docker Desktop or Docker bridge networking. In k3s mode, it points at `127.0.0.1` on the host.

### 4) eRPC path

eRPC is exposed in-cluster and externally via Gateway API at `/rpc` on `obol.stack`, with Traefik middleware enforcing x402 on that path (`erpc-x402-middleware`).

Reference: `internal/embed/infrastructure/helmfile.yaml`, `internal/embed/infrastructure/values/erpc.yaml.gotmpl`

eRPC ships preconfigured with upstreams for:

- Ethereum mainnet
- Hoodi
- Base
- Base Sepolia

The config includes a checked-in basic auth credential to an Obol-hosted eRPC gateway. That may be acceptable for alpha/local convenience, but it is not a pattern MUTX should inherit into production.

---

## OpenClaw deployment model inside Obol Stack

### Per-instance deployment shape

`obol openclaw onboard` scaffolds a deployment directory and then optionally syncs it. Each instance gets:

- `values-obol.yaml`: Obol-specific OpenClaw overlay
- `values-remote-signer.yaml`: signer config
- `wallet.json`: wallet metadata
- `helmfile.yaml`: deploys `obol/openclaw` and `obol/remote-signer`
- optional secrets metadata file for provider/channel credentials
- a staged `skills/` directory with embedded Obol skills

Reference: `internal/openclaw/openclaw.go:Onboard`, `generateHelmfile`

Generated helmfile releases:

- `openclaw` chart version `0.1.7`
- `remote-signer` chart version `0.3.0`

Reference: `internal/openclaw/openclaw.go:generateHelmfile`

### OpenClaw overlay behavior

The overlay generated for each instance does a few important things (`generateOverlayValues`):

- enables Gateway API `HTTPRoute`
- creates/uses a service account with automounted API token
- enables read-only OpenClaw chart RBAC
- forces all model traffic through LiteLLM using the `openai` provider slot
- points eRPC at `http://erpc.erpc.svc.cluster.local/rpc`
- injects `REMOTE_SIGNER_URL=http://remote-signer:9000`
- optionally injects `AGENT_BASE_URL` when a tunnel exists
- disables chart-managed skills and initJob because Obol injects directly via PVC
- can load extra credentials from a dedicated Kubernetes Secret

Reference: `internal/openclaw/openclaw.go:generateOverlayValues`

### Skills model

Obol does **not** primarily install skills through chart values or ConfigMaps. It stages skill directories on disk, then copies them directly into the host-side PVC path backing `/data/.openclaw/skills/` inside the container.

Key functions:

- `stageDefaultSkills`
- `injectSkillsToVolume`
- `SkillsSync`

Reference: `internal/openclaw/openclaw.go`

This means the runtime contract is “persistent volume contains live skills and OpenClaw’s file watcher reloads them.” That is convenient locally, but awkward for immutable, remote, or multi-tenant infrastructure.

### Workspace model

Similarly, imported workspace files are copied directly into the host-side PVC path for `/data/.openclaw/workspace/`.

Reference: `copyWorkspaceToVolume` in `internal/openclaw/openclaw.go`

For MUTX, this is a major design signal: Obol assumes **filesystem injection into a node-local persistent volume**, not a remote git/workspace sync abstraction.

### CLI execution model

Operational commands against deployed OpenClaw instances are split between:

- local CLI + `kubectl port-forward` for remote-capable commands (`gateway`, `acp`, `browser`, `logs`)
- `kubectl exec` into the pod for other commands and skill management

Reference: `internal/openclaw/openclaw.go:CLI`, `SkillAdd`, `SkillRemove`, `SkillList`

This is a good fit for a local operator-owned cluster, less so for a remote productized runtime unless MUTX wraps the API surface itself.

---

## Kubernetes / Helm / control-plane model

### Control model

Obol Stack is Kubernetes-native but still very local-first.

Core patterns:

- infra: embedded helmfile under stack config dir
- apps/agents: per-instance helmfile directories
- routing: Traefik Gateway API
- config mutation: direct file generation + `helmfile sync` + occasional post-render patching
- secrets: generated or imported, then applied with `kubectl apply`
- runtime mutable state: direct writes into host-backed PVCs

References:

- `internal/stack/stack.go:syncDefaults`
- `internal/openclaw/openclaw.go:doSync`

There is also a revealing patch step: after `helmfile sync`, Obol patches the rendered OpenClaw ConfigMap because heartbeat settings are not fully supported by the upstream chart template. That means some desired runtime behavior currently sits outside pure declarative Helm.

Reference: `internal/openclaw/openclaw.go:doSync` comments around `patchHeartbeatConfig`

### Agent capability / monetization model

The default OpenClaw instance `obol-agent` gets cluster privileges for monetization:

- read `ServiceOffer`, pods, services, deployments, nodes, logs
- mutate `ServiceOffer`, Traefik middlewares, HTTPRoutes, ConfigMaps, Services, Endpoints, Deployments, PodMonitors/ServiceMonitors
- read LiteLLM secret in `llm`
- patch x402 pricing config in `x402`

Reference: `internal/embed/infrastructure/base/templates/obol-agent-monetize-rbac.yaml`

This is a meaningful privilege set. It is reasonable for a self-hosted single-user machine; it is materially riskier in a shared cluster.

### Service publication model

The publication abstraction is `ServiceOffer` (`serviceoffers.obol.org`). It declares:

- service type (`inference`, `fine-tuning`, `http`)
- upstream K8s service/namespace/port
- payment settings (network, wallet, price)
- routing path
- optional registration metadata for ERC-8004
- status conditions like `ModelReady`, `UpstreamHealthy`, `PaymentGateReady`, `RoutePublished`, `Registered`, `Ready`

Reference: `internal/embed/infrastructure/base/templates/serviceoffer-crd.yaml`

This is arguably the most reusable Obol concept for MUTX: a Kubernetes-native “sellable service” resource that spans internal service discovery, auth/payment policy, public routing, and registry publication.

---

## Local vs remote topology

## Local-first topology Obol expects

Typical local topology looks like:

- host machine
  - Docker Desktop / Docker Engine (`k3d`) or native Linux + sudo (`k3s`)
  - local filesystem for config + data dirs
  - local Ollama on port 11434
  - local DNS or `/etc/hosts` edits for `obol.stack`
- single-node cluster
  - Traefik gateway
  - Prometheus
  - LiteLLM + x402 buyer
  - eRPC
  - OpenClaw + remote-signer per namespace
  - optional Cloudflare tunnel
- public internet
  - via cloudflared quick tunnel or persistent DNS tunnel

References:

- `internal/stack/backend_k3d.go`
- `internal/stack/backend_k3s.go`
- `internal/embed/infrastructure/base/templates/llm.yaml`
- `internal/embed/infrastructure/cloudflared/values.yaml`

## Remote/multi-node fit

The current stack can likely be forced into a remote Kubernetes environment, but it is not designed around that.

Friction points:

1. **Host Ollama dependency**
   - It expects a host-accessible Ollama endpoint, not a proper in-cluster LLM service.
   - In remote clusters, `host.docker.internal`/`127.0.0.1` assumptions break.

2. **Direct PVC mutation from the host filesystem**
   - Skills and workspace are copied into a known local-path-provisioner host path.
   - That breaks when storage is networked, opaque, or provisioned by a cloud CSI driver.

3. **Local DNS and `/etc/hosts` assumptions**
   - `dns.EnsureRunning`, system resolver config, and host entry manipulation are developer-machine patterns, not product runtime patterns.

4. **Single-node trust boundary**
   - The agent has broad cluster mutation rights and access to signer endpoints/secrets.
   - In multi-tenant or shared environments, that needs stronger isolation.

5. **Tunnel lifecycle tied to local operator UX**
   - Quick tunnels and browser-driven login flow make sense locally; they do not map cleanly to headless remote infra automation.

So for MUTX remote infra, I would treat Obol’s present implementation as a **reference architecture**, not a directly reusable control plane.

---

## Operational prerequisites

### Hard prerequisites from code

For `k3d`:

- Docker running
- bundled `k3d` binary installed

For `k3s`:

- Linux only
- `sudo`/root access
- bundled `k3s` binary installed

General:

- `kubectl`, `helm`, `helmfile`
- writable config/data directories
- host filesystem persistence
- enough privilege to edit `/etc/hosts` and/or local resolver configuration

References:

- `internal/stack/backend_k3d.go:Prerequisites`
- `internal/stack/backend_k3s.go:Prerequisites`
- `internal/stack/stack.go`

### Soft prerequisites / practical prerequisites

- local Ollama if you want the out-of-box local inference path
- cloud API keys if you want Anthropic/OpenAI via LiteLLM
- Cloudflare auth if you want stable public URLs
- a secure wallet backup workflow if using the remote signer
- comfort running alpha infra on a developer laptop

---

## Observability and ops implications

### What exists today

- Prometheus is enabled via `kube-prometheus-stack`
- node exporter and kube-state-metrics are enabled
- Grafana is disabled
- Alertmanager is disabled
- eRPC exposes metrics
- x402 buyer gets a `PodMonitor`
- x402 stack appears to include monitoring resources

References:

- `internal/embed/infrastructure/values/monitoring.yaml.gotmpl`
- `internal/embed/infrastructure/helmfile.yaml`
- `internal/x402/setup_test.go` mentions ServiceMonitor expectations

### Gaps for serious prod use

For MUTX or productionized Obol usage, I would consider the current observability posture insufficient:

- no default Grafana or dashboards exposed
- no default alert routing
- no centralized structured log pipeline
- limited story for tracing request path across Traefik → x402 → LiteLLM/OpenClaw → upstream services
- little explicit SLO/availability instrumentation in the repo surface reviewed

### What MUTX should require

If MUTX integrates with Obol as a provider/runtime, require:

- metrics export for all major control-plane actions
- health endpoints and readiness contracts for published services
- explicit logs/metrics around tunnel state, signer errors, heartbeat failures, and registration state
- audit trail for `ServiceOffer` lifecycle and RBAC-sensitive actions
- optional OpenTelemetry or at least request correlation IDs through gateway layers

---

## Security and risk assessment

## High-risk areas

### 1) Wallet and signer coupling

Each OpenClaw instance gets an Ethereum wallet and colocated remote signer, exposed through `REMOTE_SIGNER_URL`.

Reference: `internal/openclaw/openclaw.go:Onboard`, `generateOverlayValues`

Risks:

- agent compromise can translate to signing capability misuse
- backups and restore become operationally critical
- local single-user storage assumptions are fragile in shared environments

### 2) Broad agent RBAC

The monetization-capable default agent can mutate routes, middlewares, deployments, services, ConfigMaps, and monitoring objects cluster-wide.

Reference: `internal/embed/infrastructure/base/templates/obol-agent-monetize-rbac.yaml`

That is fine for a personal local stack; not fine as-is for a multi-tenant MUTX control plane.

### 3) Host mutation and trust

Obol modifies host DNS/hosts configuration and depends on local-path PVC semantics. This enlarges the operational blast radius versus a pure userland app.

### 4) Alpha posture and hardcoded convenience credentials

The repo README explicitly says alpha. eRPC config includes a checked-in auth credential for Obol-hosted RPC convenience. MUTX should not normalize those patterns in prod.

Reference: `README.md`, `internal/embed/infrastructure/values/erpc.yaml.gotmpl`

### 5) Insecure local web assumptions

The generated OpenClaw config enables:

- insecure auth allowance for the control UI
- dangerous device auth disable
- host header origin fallback

These are commented as acceptable for local Traefik/dev constraints.

Reference: `internal/openclaw/openclaw.go:generateOverlayValues`

That is a local-dev concession, not something MUTX should permit for remote or shared deployments.

## Medium-risk areas

- post-sync imperative patching of config (`patchHeartbeatConfig`) increases configuration drift risk
- direct skill/workspace sync into PVC makes provenance and policy enforcement harder
- Cloudflare tunnel and public publishing paths create accidental exposure risk if defaults are not clear

---

## Dev / test / prod posture

## Dev

Obol Stack is strongest here.

Why it works well:

- fast bootstrap of a complete local playground
- good fit for a single operator laptop
- easy iteration on skills and workspace via direct PVC injection
- local host Ollama support is ergonomic
- tunnel/dns flows are optimized for local UX

MUTX dev recommendation:

- support an “Obol local runtime” mode for developers who explicitly opt in
- keep MUTX’s default local mode lighter-weight and not Kubernetes-bound

## Test / staging

Possible, but should be constrained.

Recommended changes before using in CI/staging:

- replace host Ollama dependency with in-cluster model serving or a managed endpoint
- replace host-path skill/workspace injection with artifact/image/git sync
- use real TLS and a non-`obol.stack` domain
- tighten RBAC per namespace or per offer
- enable Grafana/Alertmanager or equivalent observability

## Prod

Not ready as-is for a MUTX-managed production substrate.

Needs before serious prod adoption:

- multi-node / remote-cluster story
- stronger secrets/signer isolation
- hardened network boundaries and TLS
- proper ingress/public-domain management
- immutable deployment and auditability for skills/workspaces
- reduced-privilege reconciler/controller model
- HA story for gateways and critical services
- externalized state and backup/restore plans

---

## Networking and tunnel implications

### Internal routing

Obol uses Traefik with Gateway API, not Ingress. HTTPRoutes attach to the shared `traefik-gateway`.

This is a nice modern abstraction and is reusable in MUTX if MUTX already wants Gateway API support.

Reference: `internal/embed/infrastructure/helmfile.yaml`

### Local naming

Default user-facing naming is:

- `obol.stack`
- `openclaw-<id>.obol.stack`

It relies on local resolver setup and/or `/etc/hosts` mutation.

References:

- `internal/stack/stack.go`
- `internal/openclaw/openclaw.go:collectAllHostnames`

### Public exposure

Public exposure is mediated through Cloudflare tunnel support:

- dormant by default
- can use quick tunnel mode to expose Traefik
- can use persistent DNS tunnel after login/provisioning
- tunnel state can feed `AGENT_BASE_URL`

References:

- `internal/embed/infrastructure/cloudflared/values.yaml`
- `internal/stack/stack.go:syncDefaults`
- `internal/openclaw/openclaw.go:Onboard`

For MUTX, the tunnel model matters because it is both a convenience and a coupling point:

- great for instant public dev URLs
- weak fit for managed, auditable, repeatable production networking
- likely incompatible with organizations that require first-party ingress, WAF, or private networking controls

My take: MUTX should treat Cloudflare tunnel support as an optional adapter, not the primary networking story.

---

## What it would take to make this play nicely with MUTX

## Best integration shape

### Recommended approach: Obol as a provider/runtime adapter

MUTX should expose something like:

- `runtime: obol-local`
- maybe later `runtime: obol-cluster`

Where MUTX delegates to Obol for:

- cluster bootstrap (optional)
- OpenClaw deployment and lifecycle
- wallet/signer provisioning
- eRPC access
- service publication via `ServiceOffer`
- x402 and ERC-8004 workflows

But MUTX should keep ownership of:

- workspace abstraction
- higher-level agent/session UX
- environment policy
- provider registry and runtime selection
- production-grade deployment opinionation

### Things MUTX should reuse conceptually

1. **ServiceOffer-like abstraction**
   - Excellent primitive for “this agent exposes a paid/public capability.”

2. **Per-agent signer + wallet workflow**
   - Useful where agent commerce is core.

3. **eRPC + chain-aware routing**
   - Good optional dependency for onchain agents.

4. **LiteLLM as the model gateway shim**
   - Fine as one integration path, though MUTX should avoid making it mandatory.

### Things MUTX should not inherit directly

1. host filesystem PVC injection for skills/workspaces
2. mandatory local K8s for normal usage
3. insecure local auth defaults in remote settings
4. broad cluster RBAC for agent pods
5. browser/manual tunnel flows as the only publication path

## Concrete compatibility work

### Phase 1: low-risk integration

- Add an Obol provider/runtime in MUTX that shells out or API-calls into Obol Stack for local developer usage.
- Treat Obol-managed OpenClaw as an external runtime target.
- Map MUTX workspace/env metadata into Obol’s existing deployment scaffolding.
- Do **not** attempt to rewrite Obol’s cluster model yet.

### Phase 2: harden contracts

- Replace skill/workspace PVC injection with a MUTX artifact sync contract:
  - git checkout
  - tarball sync
  - OCI artifact
  - init container / sidecar sync
- Move from host Ollama assumptions to explicit model endpoint declarations.
- Introduce a MUTX wrapper around `ServiceOffer` creation/status.
- Make tunnel/public URL management pluggable.

### Phase 3: productionize

- run on remote Kubernetes, not just k3d/k3s local single-node
- swap local-path assumptions for CSI-backed persistent storage
- isolate signer service better, ideally per-tenant/per-agent namespace boundaries plus network policies
- tighten RBAC to controller/service-specific permissions
- require TLS, audit logs, and observability defaults
- formalize secret management via external secret stores

---

## Likely implementation steps for MUTX

1. **Prototype as external runtime**
   - MUTX can detect/use an existing Obol installation and target its default or named OpenClaw instance.

2. **Add a runtime descriptor**
   - Capture instance id, namespace, gateway URL, token retrieval path, signer availability, and eRPC URL.

3. **Build workspace/skill sync adapters**
   - First support Obol’s current PVC sync behavior for local mode.
   - Then define a cleaner transport abstraction that does not depend on local-path PVs.

4. **Model service publication in MUTX**
   - Create MUTX UX around `ServiceOffer` plus status/registration lifecycle.

5. **Separate dev vs prod behaviors**
   - Local dev: permit Obol defaults.
   - Remote/prod: disable host networking assumptions, insecure auth flags, and broad wildcard DNS hacks.

6. **Introduce policy guards**
   - explicit approval for wallet creation
   - explicit approval for tunnel/public exposure
   - explicit approval for onchain registration and priced services

7. **Add observability integration**
   - surface Prometheus health, service status, tunnel status, signer health, and offer lifecycle into MUTX dashboards/logging.

---

## Bottom-line recommendation

### Should MUTX embed/support Obol Stack directly?

**Support, yes. Embed as a core dependency, no.**

Use it as an optional infrastructure backend for users who want:

- OpenClaw on Kubernetes
- Ethereum-aware agent capabilities
- remote signer / wallet lifecycle
- x402-gated/public agent services
- ERC-8004 registration flows

### Should MUTX expose Obol-backed infrastructure as a provider/runtime?

**Yes. This is the strongest recommendation.**

That aligns with the actual architecture and avoids forcing MUTX to inherit Obol’s current local-cluster assumptions everywhere.

### Should MUTX add agent workflows around wallets, ERC-8004, x402, and agent commerce?

**Yes, but behind capability flags and policy gates.**

These are the differentiating features Obol brings. They are more portable than the exact k3d/k3s implementation.

---

## Key repo references

- Brief / requirements: `reports/obol/BRIEF.md`
- Stack lifecycle: `vendor/obol/obol-stack/internal/stack/stack.go`
- k3d backend: `vendor/obol/obol-stack/internal/stack/backend_k3d.go`
- k3s backend: `vendor/obol/obol-stack/internal/stack/backend_k3s.go`
- Default infra helmfile: `vendor/obol/obol-stack/internal/embed/infrastructure/helmfile.yaml`
- Monitoring config: `vendor/obol/obol-stack/internal/embed/infrastructure/values/monitoring.yaml.gotmpl`
- LLM foundation: `vendor/obol/obol-stack/internal/embed/infrastructure/base/templates/llm.yaml`
- eRPC config: `vendor/obol/obol-stack/internal/embed/infrastructure/values/erpc.yaml.gotmpl`
- OpenClaw lifecycle: `vendor/obol/obol-stack/internal/openclaw/openclaw.go`
- OpenClaw CLI command surface: `vendor/obol/obol-stack/cmd/obol/openclaw.go`
- Agent capability patching: `vendor/obol/obol-stack/internal/agent/agent.go`
- ServiceOffer CRD: `vendor/obol/obol-stack/internal/embed/infrastructure/base/templates/serviceoffer-crd.yaml`
- Monetize RBAC: `vendor/obol/obol-stack/internal/embed/infrastructure/base/templates/obol-agent-monetize-rbac.yaml`
- Sell/x402/registry flows: `vendor/obol/obol-stack/cmd/obol/sell.go`
- Repo overview: `vendor/obol/obol-stack/README.md`
