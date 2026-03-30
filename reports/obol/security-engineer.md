# Security Review: Obol Stack / ObolClaw Integration for MUTX

## Executive take
Obol Stack / ObolClaw is powerful, but from a security perspective it is **not just "agent hosting"**. It materially expands MUTX's blast radius into:
- local wallet custody and transaction signing,
- public internet exposure via tunnels,
- Kubernetes write access from an agent runtime,
- paid API flows with onchain settlement assumptions,
- backup/restore handling for signing material.

My recommendation: **treat Obol as a high-trust, opt-in runtime tier, not a default MUTX capability**. Support it behind explicit security modes and separate read-only Ethereum workflows from signing / commerce workflows.

## Scope reviewed
- `reports/obol/BRIEF.md`
- Obol blog: "Obol Stack + OpenClaw = ObolClaw"
- Obol Stack release `v0.7.0-rc1`
- `vendor/obol/obol-stack`
- `vendor/obol/obol-sdk`

## What the repos show
### 1) Wallet custody is local and hot
Obol Stack generates a secp256k1 wallet locally and provisions it to a host-side keystore volume for a remote signer:
- `vendor/obol/obol-stack/internal/openclaw/wallet.go`
- `vendor/obol/obol-stack/internal/openclaw/openclaw.go`

Notable details:
- Private key is generated locally with `secp256k1.GeneratePrivateKey()`.
- Key is encrypted into a Web3 V3 keystore with scrypt + AES-128-CTR.
- A random keystore password is generated and written to `values-remote-signer.yaml`.
- OpenClaw is given `REMOTE_SIGNER_URL=http://remote-signer:9000`.

Security meaning: the signing key is not in plain text by default, but the system still operates as a **hot wallet with locally recoverable key material**, because the keystore and the decryption password both exist on the same machine/deployment path.

### 2) Backup/restore includes both keystore and keystore password
`vendor/obol/obol-stack/internal/openclaw/wallet_backup.go` backs up:
- keystore JSON,
- keystore password,
- wallet metadata.

Even when encrypted backup mode is used, restore writes the keystore back and rewrites `values-remote-signer.yaml` with the password. If backup is not encrypted, the file explicitly contains the keystore password in plaintext.

Security meaning: backup files are effectively **portable wallet possession artifacts**.

### 3) Agent-mode monetization assumes elevated K8s permissions
The architecture proposal grants the singleton `obol-agent` write access for:
- `serviceoffers`
- Traefik `middlewares`
- Gateway API `httproutes`
- cross-namespace reads of services/pods/endpoints/logs

Reference:
- `vendor/obol/obol-stack/docs/monetisation-architecture-proposal.md`

The doc also notes an existing `admin` RoleBinding should be replaced because it is too broad.

Security meaning: once MUTX trusts this runtime, prompt injection or agent compromise can become **cluster reconfiguration**, not just bad chat output.

### 4) Public exposure is a core feature, not an edge case
Obol explicitly routes services to the public web through Cloudflare tunnels / public URLs:
- blog post claims public service exposure,
- release notes say payment-gated inference works through Cloudflare tunnel,
- guide uses `https://<id>.trycloudflare.com`.

Reference:
- `vendor/obol/obol-stack/docs/guides/monetize-inference.md`

Security meaning: the default path is from local workload -> gateway -> public internet. That sharply changes the threat model versus a local-only agent.

### 5) OpenClaw control UI auth is intentionally relaxed behind Traefik
`vendor/obol/obol-stack/internal/openclaw/openclaw.go` sets:
- `allowInsecureAuth: true`
- `dangerouslyDisableDeviceAuth: true`
- `dangerouslyAllowHostHeaderOriginFallback: true`

This is justified in comments for local dev / Traefik proxying.

Security meaning: these settings deserve extreme caution if MUTX exposes Obol-backed OpenClaw instances outside a tightly controlled local/trusted path.

### 6) x402 buyer flow reduces signer exposure, but not spending risk
The release notes and code describe a buy-side design using a pool of **pre-signed ERC-3009 authorizations**:
- `vendor/obol/obol-stack/internal/x402/buyer/config.go`
- `vendor/obol/obol-stack/internal/x402/buyer/signer.go`

This is good design in one respect: the sidecar has **zero live signer access** and consumes bounded pre-signed auths from a finite pool.

Security meaning: this reduces key-exfiltration risk, but does **not** eliminate financial risk. The bound becomes: `pool size × authorized price`, plus whatever replay/misconfiguration/exhaustion risk exists around facilitator and route config.

### 7) x402 verifier trusts configurable facilitator and route config
`vendor/obol/obol-stack/internal/x402/setup.go` writes pricing config with:
- wallet,
- chain,
- facilitator URL,
- `verifyOnly` flag,
- routes.

Default facilitator is `https://facilitator.x402.rs`.

Security meaning: this introduces an external trust dependency and a configuration integrity problem. If facilitator URL or pricing routes are changed maliciously, payments can be redirected, disabled, or abused.

### 8) Obol SDK clearly distinguishes read-only vs signer-required operations
`vendor/obol/obol-sdk/src/index.ts` and `src/eoa/eoa.ts` are reasonably explicit:
- reads can be done without signer,
- writes require signer,
- some actions only sign typed data offchain,
- others send irreversible onchain transactions.

This is a good boundary to preserve in MUTX.

## Trust boundaries MUTX must model
1. **User / operator -> MUTX agent**
   - natural-language instructions can trigger wallet, K8s, and public exposure actions.
2. **MUTX agent -> Obol/OpenClaw runtime**
   - agent can become a control-plane actor, not just an assistant.
3. **OpenClaw -> remote signer**
   - signing service is internal, but any caller with permission to invoke it can produce signatures.
4. **OpenClaw/obol-agent -> Kubernetes API**
   - elevated SA token is a high-value target.
5. **Cluster -> public internet via tunnel**
   - service is reachable by anyone with the URL unless further restricted.
6. **Seller/buyer -> x402 facilitator**
   - payment flow depends on external facilitator correctness and availability.
7. **MUTX / app code -> Obol SDK signer/provider**
   - app-level bugs can cross into irreversible chain actions.
8. **Host filesystem -> backup artifacts**
   - backup files and deployment YAML become secret-bearing assets.

## Ranked risks

### Critical
#### 1. Hot-wallet compromise through combined keystore + password exposure
**Why:** Obol stores encrypted keystore and separately stores the decryption password in deployment files (`values-remote-signer.yaml`), and backup can include both in one artifact.

**Impact:** Full wallet compromise; unauthorized onchain actions; permanent fund loss; malicious ERC-8004 registration; payment redirection.

**Evidence:**
- `vendor/obol/obol-stack/internal/openclaw/wallet.go`
- `vendor/obol/obol-stack/internal/openclaw/wallet_backup.go`

**Mitigations:**
- Do not let MUTX auto-create or import funded wallets by default.
- Separate **read-only wallet mode** from **signing-enabled mode**.
- Require explicit user approval for any signer enablement.
- Store keystore password outside deployment YAML if possible (OS keychain / external secret store / hardware-backed secret store).
- Treat backup files as secrets equivalent to private keys; require encryption and safe destination checks.
- Prefer low-balance, purpose-scoped wallets per agent/workload.

#### 2. Agent-to-cluster privilege escalation via elevated ServiceAccount
**Why:** The obol-agent design grants cluster-affecting write access to routing/auth resources. The proposal itself warns against an overly broad `admin` binding.

**Impact:** Public exposure of unintended services, auth bypass via route manipulation, lateral movement within cluster, persistence via configuration changes.

**Evidence:**
- `vendor/obol/obol-stack/docs/monetisation-architecture-proposal.md`

**Mitigations:**
- Never give MUTX agent runtimes `admin` or broad secret/RBAC permissions.
- Keep monetization agent isolated from general-purpose agent sessions.
- Enforce admission policies exactly as proposed, or stricter.
- Scope permissions to namespaces/resources created for one tenant only.
- Add human approval before creating/updating `HTTPRoute` or `Middleware`.
- Audit all K8s writes with immutable logs.

#### 3. Unsafe public exposure path via tunnel + relaxed UI auth settings
**Why:** Obol's model assumes internet exposure through Cloudflare tunnels, while OpenClaw overlay enables `dangerouslyDisableDeviceAuth` and related insecure auth allowances.

**Impact:** Remote control-plane exposure, unauthorized access to agent UI/API, hostile request injection, service discovery by untrusted parties.

**Evidence:**
- `vendor/obol/obol-stack/internal/openclaw/openclaw.go`
- `vendor/obol/obol-stack/docs/guides/monetize-inference.md`

**Mitigations:**
- MUTX should not inherit these settings as defaults.
- Default to local-only / private ingress.
- If public exposure is enabled, require strong auth, origin restrictions, per-route authz, and rate limiting.
- Separate public inference endpoints from admin/control endpoints.
- Prefer named/provisioned tunnels with managed policy over ad hoc quick tunnels.

### High
#### 4. Irreversible onchain writes triggered from natural-language workflows
**Why:** Obol Stack and SDK support registration, deposits, withdrawals, split deployments, incentive claims, and other writes.

**Impact:** Fund loss, incorrect registry records, wrong recipients, irreversible contract deployment, operational/legal issues.

**Evidence:**
- release notes: onchain registration + commerce
- `vendor/obol/obol-sdk/src/index.ts`
- `vendor/obol/obol-sdk/src/eoa/eoa.ts`
- `vendor/obol/obol-stack/cmd/obol/sell.go`

**Mitigations:**
- Enforce a transaction policy engine: allowed methods/chains/contracts/limits.
- Require simulation + human confirmation for every write above de minimis thresholds.
- Separate typed-data signing from transaction submission in UX and permissions.
- Pin supported chains/contracts explicitly in MUTX, not by free-form prompt.

#### 5. Backup/restore workflow can silently reintroduce compromised or stale signer state
**Why:** Restore writes back both keystore and password, then restarts remote-signer. There is no integrity attestation beyond file format + decryption.

**Impact:** Recovery from an attacker-planted backup, rollback to stale credentials, unexpected signer identity drift.

**Evidence:**
- `vendor/obol/obol-stack/internal/openclaw/wallet_backup.go`

**Mitigations:**
- Add signed backup manifests and checksum verification.
- Record wallet fingerprint/address in separate inventory before restore.
- Require operator confirmation of restored address and intended environment.
- Treat restore as a privileged break-glass workflow, not an agent self-service action.

#### 6. x402 config tampering or facilitator trust failure
**Why:** Pricing routes and facilitator URL are config-driven. A compromised agent or cluster role can alter payment behavior.

**Impact:** payment redirection, under/over-charging, denial of monetization, silent trust in external settlement path.

**Evidence:**
- `vendor/obol/obol-stack/internal/x402/setup.go`
- release notes / guide

**Mitigations:**
- Pin facilitator allowlist in MUTX.
- Protect pricing config with RBAC separation and config-drift alerts.
- Treat route creation and pricing changes as approval-gated.
- Add monitoring for route, payTo, price, network, and facilitator mutations.

### Medium
#### 7. Pre-signed x402 auth pool still creates bounded but real loss window
**Why:** Buyer sidecar has no signer, which is good, but any stolen/abused auth pool can still spend up to the pool limit.

**Impact:** bounded USDC loss, balance exhaustion, service disruption.

**Evidence:**
- `vendor/obol/obol-stack/internal/x402/buyer/config.go`
- `vendor/obol/obol-stack/internal/x402/buyer/signer.go`

**Mitigations:**
- Keep auth pools small and short-lived.
- Separate budget per upstream/provider.
- Auto-rotate / expire pools aggressively.
- Monitor spent/remaining counts and anomalous consumption.

#### 8. Secret sprawl across local files, ConfigMaps, and cluster overlays
**Why:** Obol uses deployment files, cluster config, and local staging directories for sensitive material and settings.

**Impact:** accidental inclusion in backups, logs, support bundles, or source control.

**Evidence:**
- `values-remote-signer.yaml`
- `openclaw-user-secrets`
- x402 pricing / auth config patterns

**Mitigations:**
- Centralize secrets in a dedicated secret backend.
- Block secret-bearing files from sync/export/report tooling.
- Add secret scanning to MUTX integration CI.
- Minimize plaintext secret residency time.

#### 9. External RPC / facilitator / tunnel dependencies widen trust and availability risk
**Why:** ObolClaw assumes RPC access, tunnel provider, and facilitator components.

**Impact:** degraded integrity/availability, vendor dependency, traffic metadata leakage.

**Mitigations:**
- Expose dependency status clearly to operators.
- Permit self-hosted facilitator / private ingress / trusted RPC options.
- Fail closed for signing/payment actions when dependencies are degraded.

## Design guidance for MUTX
### Safe integration boundary
The safest initial integration is:
1. **Read-only Obol support first**
   - cluster lock validation,
   - cluster definition fetches,
   - registry/discovery reads,
   - RPC-backed analysis.
2. **Explicitly gated signing second**
   - separate permission surface,
   - per-action approvals,
   - low-balance wallet only.
3. **Commerce/public exposure last**
   - only after route guardrails, audit logs, and auth are proven.

### Recommended MUTX permission model
Create distinct capability tiers:
- `obol.read` — fetch cluster definitions/locks, validate lock, inspect registry
- `obol.operator` — create/update non-financial local config only
- `obol.publish` — create public routes/tunnels
- `obol.sign.typed` — sign EIP-712 only
- `obol.sign.tx` — submit transactions
- `obol.wallet.backup_restore` — import/export signer material

Do not bundle these together.

### Red lines / do-not-defaults
- No automatic import of existing OpenClaw/Obol wallet into MUTX.
- No automatic public tunnel creation for agent endpoints.
- No agent authority to restore wallets from backup without human confirmation.
- No broad K8s RBAC for general chat agents.
- No production-funded wallet in the same trust domain as experimental prompts/skills.

## Bottom-line recommendation
**Support Obol, but as a constrained high-trust runtime/provider, not as a transparent default backend for MUTX.**

Green-light only this near-term scope:
- read-only SDK features,
- lock/definition validation,
- optional low-risk wallet inspection,
- clearly separated experimental testnet signing.

Hold back until later:
- automatic ERC-8004 registration,
- default x402 commerce flows,
- auto-public tunnel exposure,
- backup/restore automation,
- agent-driven K8s writes in shared or production clusters.

## References
- `vendor/obol/obol-stack/internal/openclaw/wallet.go`
- `vendor/obol/obol-stack/internal/openclaw/wallet_backup.go`
- `vendor/obol/obol-stack/internal/openclaw/openclaw.go`
- `vendor/obol/obol-stack/internal/x402/setup.go`
- `vendor/obol/obol-stack/internal/x402/buyer/config.go`
- `vendor/obol/obol-stack/internal/x402/buyer/signer.go`
- `vendor/obol/obol-stack/cmd/obol/sell.go`
- `vendor/obol/obol-stack/docs/monetisation-architecture-proposal.md`
- `vendor/obol/obol-stack/docs/guides/monetize-inference.md`
- `vendor/obol/obol-sdk/src/index.ts`
- `vendor/obol/obol-sdk/src/eoa/eoa.ts`
- `vendor/obol/obol-sdk/src/services.ts`
