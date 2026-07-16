---
description: Licensing, trademark, and attribution information for MUTX.
---

# Licensing

## License Structure

MUTX uses a split licensing model:

| Component | License | Change Date |
| --------- | ------- | ----------- |
| MUTX core (all code except `sdk/`) | BUSL-1.1 | 36 months after each version's release |
| Python SDK (`sdk/mutx/`) | Apache-2.0 | Never (perpetual) |

## MUTX Core — BUSL-1.1

MUTX core is **source-available** under the Business Source License (BUSL-1.1).

This means you can inspect, read, and run the source code. You may also modify it for internal use. However, you may not offer MUTX or a substantially similar product to third parties as a hosted, managed, white-labeled, OEM, or embedded service.

Each BUSL release converts to Apache-2.0 36 months after that version was first publicly released.

**Key points:**
- Internal use is allowed
- Plugins, integrations, and client libraries that do not embed the Licensed Work are permitted
- Competing commercial offerings (hosted, managed, white-labeled, OEM, embedded) require a commercial license
- The MUTX name and logo are trademarks — see Trademark Policy below

For the full license text, see the [LICENSE](https://raw.githubusercontent.com/mutx-dev/mutx-dev/main/LICENSE) file at the repository root.

## Python SDK — Apache-2.0

The MUTX Python SDK (`sdk/mutx/`) is licensed under Apache-2.0. This license permits broad use including commercial applications, subject to the standard Apache-2.0 terms.

See [sdk/LICENSE](https://raw.githubusercontent.com/mutx-dev/mutx-dev/main/sdk/LICENSE) for the full license text.

## Common Questions

See [LICENSE-FAQ](https://raw.githubusercontent.com/mutx-dev/mutx-dev/main/LICENSE-FAQ.md) for a practical FAQ covering:
- What you can and cannot do with MUTX
- Self-hosting and internal use
- Building integrations and plugins
- Managed and hosted offerings
- Commercial licensing contact

## Third-Party Code

MUTX includes integrations, specification alignment, and material adaptations
from projects under more than one license:

| Project | Audited license | Relationship |
| --- | --- | --- |
| agent-run | MIT | Observability schema adaptation; current upstream is quarantined for dependency/vendor use pending security review |
| AARM documentation | MIT (Copyright (c) 2023 Mintlify) | Runtime-security specification alignment; no Core or Extended conformance claim |
| Faramesh Core and FPL | Core main: Apache-2.0; pinned Core `v0.2.0` and historical `v1.2.9`: MPL-2.0; FPL main: Apache-2.0 | Governance daemon and policy-format integration; installer and license follow exact refs |
| Mission Control | MIT | Tracked dashboard briefing-pattern adaptation |
| Orchestra Research AI-Research-SKILLs | MIT | Pinned catalog, bundles, and sync integration |
| predict-rlm | MIT | Document-engine integration and workflow adaptation |
| Guild AI | Apache-2.0 | Candidate only; no direct reuse recorded |
| LACP | Unresolved | No canonical repository or license established; no reuse recorded |

All third-party work remains under its original license. See
[CREDITS.md](https://raw.githubusercontent.com/mutx-dev/mutx-dev/main/CREDITS.md)
for attribution and the
[machine-readable evidence](https://raw.githubusercontent.com/mutx-dev/mutx-dev/main/docs/legal/oss-attribution-evidence.json) for immutable refs,
license links, and validated local paths.

Direct adaptations are tracked in the
[OSS Attribution Ledger](oss-attribution-ledger.md). The current AARM
requirement mapping and the gaps that prevent a conformance claim are documented
in [AARM Alignment Status](aarm-alignment.md).

## Trademark Policy

MUTX and the MUTX logo are registered trademarks. The code license does not grant trademark rights. See [TRADEMARKS.md](https://raw.githubusercontent.com/mutx-dev/mutx-dev/main/TRADEMARKS.md) for the full policy.

## Contact

For commercial licensing: hello@mutx.dev
