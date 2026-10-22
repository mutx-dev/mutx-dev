# mutx-governed-runtime

The governed runtime from MUTX as a standalone package: action mediation, a policy engine
(allow, deny, modify, defer), approvals, Ed25519-signed receipts and a hash-linked audit chain
that anyone holding the public keys can verify offline.

The code lives in `src/security` of this repository. `mutx_governed_runtime` is a symlink to it,
so the API and the package cannot drift.

```
pip install ./packages/governed-runtime
python -m mutx_governed_runtime verify chain.json --keys keys.json [--head HASH] [--length N]
```

Exit code 0 means valid, 1 invalid, 2 unreadable input. `keys.json` maps key IDs to hex public keys.

Pass `--head` or `--length`, taken from somewhere the log writer cannot edit, to detect removal of
the newest entries. Without an anchor a truncated chain is still valid.

Specification: [docs/governed-runtime-spec.md](../../docs/governed-runtime-spec.md).
Benchmark: [benchmarks/governed-runtime](../../benchmarks/governed-runtime/README.md).

Licensed under BUSL-1.1, see `LICENSE`.
