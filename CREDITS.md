# MUTX Credits and Attributions

MUTX is built on the shoulders of giants. This document acknowledges all open-source projects that MUTX incorporates, ports, or rebrand.

---

## Direct Feature Port Ledger

For direct code, schema, prompt, documentation, or UI reuse from external projects, MUTX keeps a per-port ledger in `docs/legal/oss-attribution-ledger.md`.

Current tracked upstreams for this process:

- Mission Control (`MIT`) - one direct dashboard-pattern reuse entry is recorded in the ledger
- LACP (`MIT`) - no direct reuse entry is recorded yet
- Guild AI (`Apache-2.0`) - no direct reuse entry is recorded yet

---

## Core Dependencies

### agent-run (Rebranded as MUTX Observability Schema)

**Repository:** https://github.com/builderz-labs/agent-run

**License:** MIT

**Contribution:** Open standard for agent observability - MUTX Observability Schema is based on agent-run with renamed types:

| agent-run Schema | MUTX Rename |
|-----------------|-------------|
| `AgentRun` | `MutxRun` |
| `Step` | `MutxStep` |
| `Cost` | `MutxCost` |
| `Provenance` | `MutxProvenance` |
| `EvalResult` | `MutxEval` |

The MUTX Observability layer (`src/api/models/observability.py`, `src/api/routes/observability.py`, `sdk/mutx/observability.py`) is derived from the agent-run specification.

**MIT License Text:**
```
MIT License

Copyright (c) 2024 builderz-labs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### AARM - Autonomous Action Runtime Management

**Repository:** https://github.com/aarm-dev/docs

**License:** MIT

**Contribution:** Runtime security specification - MUTX Security Layer implements AARM components:

| AARM Component | MUTX Location | Description |
|---------------|--------------|-------------|
| Action Mediation Layer | `src/security/mediator.py` | Intercepts and normalizes tool invocations |
| Context Accumulator | `src/security/context.py` | Tracks session state and intent |
| Policy Engine | `src/security/policy.py` | Evaluates actions against policy |
| Approval Service | `src/security/approvals.py` | Human-in-the-loop workflows |
| Receipt Generator | `src/security/receipts.py` | Tamper-evident audit receipts |
| Telemetry Exporter | `src/security/telemetry.py` | SIEM/SOAR integration |
| Compliance Checker | `src/security/compliance.py` | AARM R1-R9 conformance verification |

AARM defines what a runtime security system must do - MUTX implements it as the MUTX Security Layer.

**MIT License Text:**
```
MIT License

Copyright (c) 2024 aarm-dev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Documentation"), to
deal in the Documentation without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Documentation, and to permit persons to whom the
Documentation is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Documentation.

THE DOCUMENTATION IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE DOCUMENTATION OR THE USE OR OTHER DEALINGS IN
THE DOCUMENTATION.
```

---

### Faramesh

**Repository:** https://github.com/faramesh/faramesh-core

**License:** MIT

**Contribution:** Pre-execution governance engine - MUTX uses Faramesh as the AARM-compliant policy enforcement backend:

- Deterministic FPL (Faramesh Policy Language) evaluation
- Pre-execution blocking of tool calls
- Human approval (DEFER) workflows
- Credential broker for API key management
- Cryptographic decision audit trail

MUTX integration points:
- `cli/faramesh_runtime.py` - Faramesh daemon management
- `cli/commands/governance.py` - CLI governance commands
- `cli/policies/*.fpl` - FPL policy files (starter, payment-bot, infra-bot, customer-support)
- `src/runtime/gateways/faramesh.py` - Faramesh as AARM backend

**MIT License Text:**
```
MIT License

Copyright (c) 2024 faramesh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### Mission Control (Inspiration and Direct Reuse)

**Repository:** https://github.com/builderz-labs/mission-control

**License:** MIT

**Contribution:** Dashboard patterns and agent fleet management concepts, including tracked direct dashboard-pattern reuse.

MUTX's operator surface and agent management patterns are inspired by Mission Control's approach to agent orchestration dashboards. Repo history also contains direct Mission Control pattern ports tracked in `docs/legal/oss-attribution-ledger.md`.

**MIT License Text:**
```
MIT License

Copyright (c) 2024 builderz-labs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Full License Texts

The incorporated projects listed above currently use the MIT License. See their repositories for full license texts:

- agent-run: https://github.com/builderz-labs/agent-run/blob/main/LICENSE
- AARM: https://github.com/aarm-dev/docs/blob/main/LICENSE.txt
- Faramesh: https://github.com/faramesh/faramesh-core/blob/main/LICENSE
- Mission Control: https://github.com/builderz-labs/mission-control/blob/main/LICENSE

---

## Trademark Attribution

MUTX, agent-run, AARM, Faramesh, and Mission Control are separate projects.
MUTX is not affiliated with, endorsed by, or connected to any of these projects
beyond the open-source license grants described above.
