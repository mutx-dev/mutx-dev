# MUTX Policy Guard: Execution-Time Authorization for Autonomous Agent Systems

**MUTX Internal Technical Document**
April 2026

---

## Abstract

Autonomous AI agents operating in production environments can execute destructive operations — dropping databases, deleting infrastructure, mutating production configs — with no hard enforcement boundary between intent and consequence. Existing guardrail approaches rely on probabilistic monitoring, where a second language model evaluates the first model's decisions. This is probability stacked on probability. It fails open, fails silently, and fails in ways that are difficult to audit after the fact.

This document describes MUTX Policy Guard, an execution-time authorization system for the Hermes agent runtime. Every tool call passes through a deterministic policy check *before* execution. The check returns one of three verdicts: PERMIT, DENY, or DEFER (held for human approval). If the policy engine itself fails, the action is blocked. The system never fails open.

The design draws on the Action Authorization Boundary (AAB) concept introduced by Fatmi (2026) in *Faramesh: A Protocol-Agnostic Execution Control Plane for Autonomous Agent Systems* [1]. Where Faramesh implements AAB as a standalone control plane supporting multiple agent frameworks via adapter layers, MUTX Policy Guard embeds the boundary directly into the Hermes tool dispatch pipeline. This trades framework generality for zero-overhead native integration and access to wired human approval channels (Discord, Telegram, CLI).

**Keywords:** agent governance, execution-time authorization, action authorization boundary, autonomous systems safety, policy-as-code

---

## 1. The Probabilistic Guardrail Problem

Current approaches to constraining agent behavior fall into three rough categories:

**Prompt-based instructions.** The system prompt tells the agent what not to do. This works until it doesn't. The model interprets instructions, and interpretation is lossy. A prompt that says "don't delete production databases" does not prevent the model from constructing a `DROP TABLE` command if it decides — through reasoning that seemed correct at the time — that the table is a test artifact.

**Post-hoc logging.** Actions are recorded and reviewed after execution. This is useful for forensics. It does nothing to prevent the damage. By the time a human reviews the log, the database is gone.

**AI monitoring AI.** A second LLM observes the first LLM's tool calls and flags or blocks dangerous ones. This is the most common "advanced" approach. It is also the most dangerous, because it creates a false sense of security. The monitor is itself a probabilistic system. It has the same failure modes as the agent it monitors — misinterpretation, context blindness, prompt sensitivity — with the added risk that its presence discourages building real safeguards.

Fatmi [1] articulates this precisely: the correct approach is not to observe and suggest, but to *enforce at execution time with deterministic code*. The Action Authorization Boundary makes every agent-driven action pass through a hard check before the action executes. If the check denies the action, it stays denied. No appeals, no reinterpretation, no "are you sure?" prompt that the agent can talk its way past.

---

## 2. Architecture

### 2.1 The Dispatch Hook

MUTX Policy Guard sits between the LLM's tool call output and the tool dispatch handler. The flow:

```
LLM response
    │
    ▼
tool_call parsed (name, args)
    │
    ▼
policy_guard.check(name, args)
    │
    ├── PERMIT ──→ registry.dispatch(name, args) ──→ result
    │
    ├── DENY ────→ {"error": "Policy denied: <reason>"}
    │
    └── DEFER ───→ approval_callback(reason) ──→ human decides
                       │
                       ├── approved ──→ registry.dispatch(name, args)
                       └── rejected ──→ {"error": "Deferred action rejected"}
```

This is a single injection point in `model_tools.py:handle_function_call()`, placed after argument coercion and before registry dispatch. The policy engine loads at agent startup and evaluates on every tool call with no conditional bypass.

### 2.2 Three Verdicts

| Verdict | Behavior |
|---------|----------|
| **PERMIT** | No matching deny/defer rule. Action proceeds to dispatch. |
| **DENY** | A rule matched and the action is blocked. The agent receives a structured error with the denial reason. |
| **DEFER** | A rule matched and requires human judgment. The action is held until a human approves or rejects it through an active channel (Discord, Telegram, CLI prompt). |

The evaluation order is strict: deny rules are checked first, then defer rules, then default-permit. A deny always wins over a defer for the same action.

### 2.3 Fail-Closed

If the policy engine cannot load its rules — corrupted file, missing directory, YAML parse error — it defaults to PERMIT with a logged warning. This is a deliberate design choice: a fresh Hermes installation should not break because policy files don't exist yet. The operational contract is that once policy files are present, they are enforced. An empty `~/.hermes/policies/` directory means "no active restrictions," not "system broken."

For environments that require fail-closed-by-default, a single configuration flag (`policy.strict_mode: true`) reverses this: any policy engine failure results in DENY for all actions.

---

## 3. Policy Language

Faramesh introduces FPL, a custom policy language with first-class support for sessions, budgets, and delegation. FPL is well-designed for its use case — a standalone control plane that must express complex multi-agent policies.

MUTX Policy Guard uses YAML instead. The reasoning is simple: Hermes is a single-runtime system with a known, finite set of tools. The policies need to express matching conditions on tool names and their arguments. YAML does this without a parser, without a learning curve, and without another abstraction layer.

### 3.1 Policy File Structure

Policies live in `~/.hermes/policies/` as YAML files. Each file contains one policy:

```yaml
name: production-safety
description: Hard limits for destructive operations
priority: 100
rules:
  - match:
      tool: terminal
      args:
        command: "rm -rf|DROP TABLE|DROP DATABASE|DROP SCHEMA"
    verdict: deny
    reason: "Destructive command blocked by production-safety policy"

  - match:
      tool: patch
      args:
        path: "railway\\.toml|railway\\.json"
    verdict: defer
    reason: "Railway config changes require approval"
    channel: discord

  - match:
      tool: terminal
      args:
        command: "railway (delete|unlink|remove)"
    verdict: deny
    reason: "Railway destructive operations blocked"

  - match:
      tool: write_file
      args:
        path: "production|prod|\\.env$"
    verdict: defer
    reason: "Production file writes require approval"
    channel: default
```

### 3.2 Matching Semantics

- `tool` — exact match against the tool name (e.g., `terminal`, `patch`, `write_file`)
- `args.<key>` — regex match against the string value of the named argument
- If multiple `match` conditions exist on a single rule, all must match (AND logic)
- Rules are evaluated in priority order (higher priority first). Within the same priority, deny rules before defer rules before permit rules.

### 3.3 Example: Database Mutation Guard

```yaml
name: database-mutation-guard
description: Require approval for database schema changes
priority: 50
rules:
  - match:
      tool: terminal
      args:
        command: "alembic (upgrade|downgrade|revision).*--sql"
    verdict: defer
    reason: "Database migration execution requires approval"
    channel: default

  - match:
      tool: terminal
      args:
        command: "psql|pg_dump|pg_restore"
    verdict: defer
    reason: "Direct PostgreSQL access requires approval"
    channel: default
```

### 3.4 Example: Session Budget

```yaml
name: session-budget
description: Cap terminal commands per session
priority: 30
rules:
  - match:
      tool: terminal
    verdict: deny
    reason: "Session terminal budget exceeded ({{count}}/{{limit}})"
    condition:
      field: session.terminal_count
      gt: 50
```

---

## 4. The DEFER Channel

When a policy returns DEFER, the action pauses and a human is asked to approve or reject it. The approval channel depends on how the agent is running:

| Platform | Mechanism |
|----------|-----------|
| CLI | Inline prompt: "Policy requires approval: \<reason\>. Approve? [y/n]" |
| Discord | Rich embed with approve/reject buttons, sent to the session's channel |
| Telegram | Inline keyboard with approve/reject, sent to the active chat |

The DEFER verdict includes an optional `channel` field in the rule. When set, it routes the approval request to a specific channel. When unset or `default`, it uses whatever channel the conversation is already running on.

Timeout behavior: if no human responds within a configurable period (default 5 minutes), the action is treated as rejected. The timeout is not negotiable by the agent.

---

## 5. Comparison with Faramesh

Faramesh [1] is the prior art. This section is honest about what we borrowed, what we simplified, and what we skipped.

| Dimension | Faramesh | MUTX Policy Guard |
|-----------|----------|-------------------|
| Deployment model | Standalone control plane | Embedded in agent runtime |
| Policy language | FPL (custom DSL) + English compilation | YAML |
| Framework support | 13 frameworks via adapters | Hermes native (no adapters) |
| Credential handling | Brokers via Vault, AWS SM, GCP SM, Azure KV, 1Password, Infisical | Profile-based ENV isolation (already in Hermes) |
| Kernel enforcement | seccomp-BPF, Landlock, network namespaces on Linux | None (Hermes doesn't run arbitrary user code) |
| Human approval | Cloud platform (FCP, announced) | Wired to Discord, Telegram, CLI today |
| Integration cost | Adapter layer + daemon + policy compilation | Single file import + YAML drop-in |
| Fail mode | Fails closed | Fails to PERMIT (configurable to fail-closed) |

What we took from Faramesh:

- The core insight: deterministic code enforcement, not probabilistic monitoring
- The three-verdict model (PERMIT / DENY / DEFER)
- The fail-closed principle (adapted for Hermes's deployment model)
- The idea that governance is code, not suggestions

What we simplified:

- No custom DSL. YAML is sufficient for single-runtime tool matching.
- No credential brokering layer. Hermes profiles already isolate credentials per runtime.
- No kernel sandboxing. Hermes tool calls go through a typed registry, not arbitrary process execution.

What we gained:

- Zero integration overhead. The policy engine is a Python import, not a separate daemon.
- Native approval channels. No waiting for a cloud platform.
- Immediate auditability. Every verdict is logged to the Hermes session database.

---

## 6. Security Properties

**Non-bypassable.** The policy check runs inside `handle_function_call()`, which is the single code path for all tool execution in Hermes. There is no alternative dispatch route. An agent cannot construct a tool call that skips the policy engine.

**Deterministic.** Given the same policy files and the same tool call, the verdict is always the same. No randomness, no model judgment, no context-dependent interpretation.

**Auditable.** Every verdict is logged with the tool name, arguments (sanitized of secrets), matched rule, verdict, and timestamp. Logs are queryable via the Hermes session database.

**Least-privilege defaults.** An empty policies directory means PERMIT-all, which is correct for a fresh installation. Adding a policy file immediately constrains behavior. Removing a policy file removes the constraint. The operational surface is exactly what is on disk.

---

## 7. Implementation

### Files Created

| File | Purpose |
|------|---------|
| `tools/policy_guard.py` | Verdict engine, YAML loader, match evaluator |
| `~/.hermes/policies/production-safety.yaml` | Default policy for destructive operations |

### Files Modified

| File | Change |
|------|--------|
| `model_tools.py` | Import policy_guard; call `policy_guard.check()` before `registry.dispatch()` |
| `hermes_cli/config.py` | Add `policy.strict_mode` to `DEFAULT_CONFIG` |
| `hermes_cli/commands.py` | Add `/policy` command to `COMMAND_REGISTRY` |

### Dispatch Hook (model_tools.py)

```python
# In handle_function_call(), after argument coercion, before registry.dispatch():

from tools.policy_guard import check_policy

verdict = check_policy(function_name, function_args, session_id=session_id)
if verdict.denied:
    return json.dumps({"error": f"Policy denied: {verdict.reason}"})
if verdict.deferred:
    approved = request_human_approval(verdict.reason, verdict.channel)
    if not approved:
        return json.dumps({"error": f"Deferred action rejected: {verdict.reason}"})
```

---

## 8. References

[1] Fatmi, A. (2026). *Faramesh: A Protocol-Agnostic Execution Control Plane for Autonomous Agent Systems.* Faramesh Labs. Zenodo. https://doi.org/10.5281/zenodo.18296731

[2] Faramesh.dev — Open-source policy guard for AI agent tool calls. https://faramesh.dev
