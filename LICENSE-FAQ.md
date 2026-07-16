# License FAQ

## What license is MUTX under?

MUTX core is **source-available under the Business Source License (BUSL-1.1)**.

Selected ecosystem surfaces — the Python SDK — are licensed separately under **Apache-2.0**.

## What does "source-available" mean?

Source-available means you can inspect, read, and run the source code. It does not mean the software is free for all commercial use. See "What can I do with MUTX?" below.

## What can I do with MUTX?

**You may:**
- Use MUTX internally for your organization and its affiliates
- Evaluate, test, and research MUTX
- Build integrations, plugins, providers, and client libraries that do not embed or repackage the Licensed Work itself
- Deploy MUTX for consulting, implementation, or migration work for clients, provided you are not separately monetizing access to MUTX itself
- Modify MUTX for internal use

**You may not:**
- Offer MUTX or a substantially similar product to third parties as a hosted, managed, white-labeled, OEM, or embedded offering
- Give third parties access to a substantial portion of MUTX's control-plane, orchestration, governance, deployment, observability, administrative, or API functionality as a service

## Can I self-host MUTX internally?

Yes. Internal self-hosting is allowed under the Additional Use Grant.

## Can I modify MUTX for internal use?

Yes. You may modify the Licensed Work for your own internal business purposes.

## Can I build integrations or plugins?

Yes, provided your integration, plugin, provider, or adapter does not embed or repackage the Licensed Work itself. Client libraries that call MUTX's public API are permitted.

## Can I offer MUTX as a managed service?

No. Offering MUTX as a hosted, managed, white-labeled, OEM, or embedded service to third parties requires a separate commercial license. This includes any product that gives third parties access to a substantial portion of MUTX's control-plane, API, governance, or operator functionality.

## Can I embed MUTX in a commercial product?

Embedding MUTX in a commercial product in a way that provides third parties access to its core functionality requires a commercial license.

## Can consultants deploy MUTX for clients?

Yes, consulting and implementation services related to MUTX are permitted, provided you are not separately monetizing access to MUTX itself as a hosted or managed offering.

## Does the SDK have a different license?

Yes. The MUTX Python SDK (`sdk/mutx/`) is licensed under Apache-2.0. See `sdk/LICENSE`.

## What is the change date?

Each version of MUTX converts from BUSL-1.1 to Apache-2.0 **36 months after that version was first publicly released**. Older versions convert on their own schedule.

## Which parts are Apache-2.0 today?

The Python SDK (`sdk/`) is Apache-2.0. All other parts are BUSL-1.1 until their individual change date passes.

## Do I get trademark rights?

No. The license does not grant trademark rights. See `TRADEMARKS.md`.

## What about the third-party code in the repo?

MUTX includes or adapts work under multiple third-party licenses. agent-run,
the AARM documentation, Mission Control, Orchestra Research AI-Research-SKILLs,
and predict-rlm use MIT licenses at the audited refs. Faramesh Core current main,
FPL current main, and Guild AI use Apache-2.0; the pinned Faramesh Core `v0.2.0`
release and historical `v1.2.9` tag carry MPL-2.0. Those projects remain
governed by the license at the exact distributed ref; see `CREDITS.md` for refs,
copyright notices, and license evidence.

Direct adaptations are recorded in `docs/legal/oss-attribution-ledger.md` and
the machine-readable `docs/legal/oss-attribution-evidence.json`. “LACP” remains
an unresolved project identity, so MUTX records no reuse and makes no license
claim for it.

## Who do I contact for commercial licensing?

Email hello@mutx.dev.
