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

For the full license text, see the [LICENSE](https://github.com/mutx-dev/mutx-dev/blob/main/LICENSE) file at the repository root.

## Python SDK — Apache-2.0

The MUTX Python SDK (`sdk/mutx/`) is licensed under Apache-2.0. This license permits broad use including commercial applications, subject to the standard Apache-2.0 terms.

See [sdk/LICENSE](https://github.com/mutx-dev/mutx-dev/blob/main/sdk/LICENSE) for the full license text.

## Common Questions

See [LICENSE-FAQ](https://github.com/mutx-dev/mutx-dev/blob/main/LICENSE-FAQ.md) for a practical FAQ covering:
- What you can and cannot do with MUTX
- Self-hosting and internal use
- Building integrations and plugins
- Managed and hosted offerings
- Commercial licensing contact

## Third-Party Code

MUTX incorporates MIT-licensed components:

- **agent-run** (builderz-labs) — Observability schema
- **AARM** (aarm-dev) — Security layer specification
- **Faramesh** (Faramesh Technologies) — Governance engine
- **Mission Control** (builderz-labs) — Dashboard inspiration

All third-party code remains under its original MIT license. See [CREDITS.md](/CREDITS.md) for full attribution and license texts.

## Trademark Policy

MUTX and the MUTX logo are registered trademarks. The code license does not grant trademark rights. See [TRADEMARKS.md](/TRADEMARKS.md) for the full policy.

## Contact

For commercial licensing: hello@mutx.dev
