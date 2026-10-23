# Governed runtime specification

Version 1. Implementation: `src/security`, installable as `packages/governed-runtime`
(`mutx-governed-runtime`). Tests: `tests/unit/python/test_audit_chain_tamper_evidence.py` and
`tests/unit/python/test_security_receipts.py`. Measured behaviour:
[benchmarks/governed-runtime](../benchmarks/governed-runtime/README.md).

The governed runtime sits between an agent and its tools. Every tool call is turned into a
normalized action, decided by a policy, recorded in a signed receipt, and the receipts of a
session are linked into a chain that a third party can verify offline.

## Alignment claim

The design is informed by the AARM specification. MUTX claims partial alignment, not
conformance. See [legal/aarm-alignment.md](legal/aarm-alignment.md) for the requirement-by-requirement
evidence and the gaps (for example, no least-privilege credential issuance).

## Components

| Component | Role |
|---|---|
| `ActionMediator`, `NormalizedAction` | Normalizes a tool call: tool name, arguments, agent, session, action hash |
| `PolicyEngine` | Returns `allow`, `deny`, `modify` or `defer` for an action |
| `ApprovalService` | Holds deferred actions until a human decides |
| `ContextAccumulator` | Tracks session intent signals used by policy |
| `ReceiptGenerator` | Builds an `ActionReceipt` and signs it with Ed25519 |
| `AuditChain` | Links signed receipts into a tamper-evident sequence |
| `verify_chain_export`, `python -m mutx_governed_runtime verify` | Offline verifier |

## Policy decisions

A `PolicySet` is a list of `PolicyRule`s and a default decision. Rules are sorted by `priority`,
lowest first, and the first rule whose `tool_pattern` matches the tool name decides. Patterns
are exact names or a single `*` at the start, the end or both. When no rule matches, the set's
default decision applies. Tool arguments are only inspected by a built-in check for dangerous
shell commands; rule `condition` fields are not evaluated.

`defer` means the call must not run until `ApprovalService` records a human decision.

## Receipt

An `ActionReceipt` records the action (id, hash, tool, truncated arguments, agent, session),
the decision (verdict, rule id and name, reason), the outcome, a timestamp, and `metadata`.
The receipt is signed over its canonical JSON with Ed25519. The signature carries a key id.

## Audit chain

A chain is one session. Entry `i` is:

```json
{
  "index": 0,
  "prev_hash": "<64 hex characters>",
  "entry_hash": "<64 hex characters>",
  "receipt": { "...": "signed receipt" }
}
```

- `GENESIS_HASH` is 64 zeros and is the `prev_hash` of entry 0.
- `entry_hash = SHA-256(canonical_json({"index", "prev_hash", "receipt"}))`, where canonical JSON
  uses sorted keys, separators `","` and `":"`, and UTF-8.
- Before signing, `receipt.metadata["chain"] = {"session_id", "index", "prev_hash"}` is set. The
  signature therefore covers the receipt's position, so a validly signed receipt cannot be moved
  to another index, another session or behind another predecessor.
- The chain head is the `entry_hash` of the last entry, or `GENESIS_HASH` when empty.

Export format:

```json
{ "version": 1, "session_id": "...", "head": "<hash>", "entries": [ "..." ] }
```

## Verification

`verify_chain_export(exported, trusted_public_keys, expected_head=None, expected_length=None)`
returns `ChainVerification(valid, length, head, errors)`. It reports every error it finds, not
only the first. A chain is valid only if all of these hold:

1. `version` is 1 and `entries` is a list.
2. For every entry `i`: `index == i`; `prev_hash` equals the previous `entry_hash` (genesis for
   `i = 0`); `entry_hash` recomputes from `{index, prev_hash, receipt}`.
3. The receipt's `session_id` equals the export's `session_id`, and
   `receipt.metadata["chain"]` equals `{session_id, index, prev_hash}`.
4. The receipt carries a signature, its key id is in `trusted_public_keys`, and the Ed25519
   signature verifies over the receipt.
5. The export's `head` equals the last `entry_hash`.
6. If given, `expected_head` equals the head and `expected_length` equals the number of entries.

`AuditChain.load` runs the same verification and refuses to load a chain that fails it.

CLI: `python -m mutx_governed_runtime verify chain.json --keys keys.json [--head H] [--length N]`.
Exit code 0 is valid, 1 invalid, 2 unreadable input. `keys.json` maps key ids to hex public keys.

## Threat model

Assumed attacker: someone who can read and rewrite the stored chain after the fact (a
compromised log store, an insider with database access) but does not hold a trusted signing key.

Detected, each covered by a test in the tamper-evidence suite:

- Editing any receipt field, including decision, outcome, tool arguments and timestamp.
- Editing or recomputing `entry_hash`, `prev_hash` or `index`.
- Deleting, inserting, duplicating, reordering or splicing entries, including splicing in entries
  from another session.
- Replacing a receipt with one signed by an untrusted key, or stripping the signature.
- Rewriting the whole chain with recomputed hashes: the signatures no longer verify.
- Changing the export's `head`, `session_id` or `version`.

Not detected:

- **Truncating the newest entries.** The remaining prefix is a valid chain. Detecting it needs an
  anchor the attacker cannot rewrite: record the head or the length somewhere separate (a
  write-once store, a transparency log, a periodic signed checkpoint) and pass it as
  `expected_head` or `expected_length`. Without an anchor, truncation is not detectable.
- **A compromised signing key.** The holder can sign a fresh, consistent chain. Key custody and
  rotation are outside this specification.
- **Wrong entries recorded in the first place.** The chain proves the log was not altered after
  signing, not that the runtime saw every action. Actions that bypass the mediator leave no
  receipt.
- **Receipt truncation.** Tool arguments are shortened before signing, so the receipt proves the
  shortened form.
