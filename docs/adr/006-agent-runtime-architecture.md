# ADR 006: Agent Runtime with EvalView Guardrails

## Status
Accepted

## Date
2024-04-01

## Context
Mutx deploys autonomous agents that execute actions in customer environments. We need robust safety guardrails.

## Decision
Implement a layered agent runtime:
1. **Agent Runtime Service**: Manages agent lifecycle, tools, and execution
2. **EvalView Guardrail**: Hypervisor-level security layer with local LLM judge
3. **Self-Healing Service**: Monitors and recovers failed agent runs

## Consequences

### Positive
- **Safety**: Local LLM judge evaluates actions before execution
- **Observability**: Full audit trail of agent decisions
- **Resilience**: Automatic recovery from failures
- **Extensible**: Support for multiple agent frameworks (LangChain, OpenClaw, n8n)

### Negative
- **Latency**: Guardrail checking adds execution overhead
- **Complexity**: Multiple services to manage and debug

## Alternatives Considered
- **No guardrails**: Rejected - unacceptable security risk
- **External audit only**: Rejected - too slow for autonomous agents
- **Rule-based filtering**: Rejected - insufficient for complex agent actions

## References
- [Agent Runtime Documentation](../architecture/agent-runtime.md)
- [Security Architecture](../architecture/security.md)
