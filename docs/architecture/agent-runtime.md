---
description: Runtime heartbeats, stale-agent monitoring, and internal execution modules.
icon: microchip
---

# Agent Runtime

This document distinguishes connected-agent heartbeat monitoring from internal execution modules.

## Control-plane lifecycle authority

`src/api/domain/lifecycle.py` contains pure transition policy. The database-backed
owner in `src/api/services/deployment_lifecycle.py` records intent, advances
monotonic Agent and deployment revisions, accepts matching runtime observations,
and derives the Agent state from current target evidence. API routes keep their
authentication and ownership checks and translate the existing wire shapes.

Agent and deployment `status` fields keep the supported vocabulary. The additive
`desired_action`, `desired_state`, `observed_state`, `target_revision`,
`observed_revision`, and `observed_at` fields distinguish a request from a
runtime observation. Registration and deployment creation leave observed state
empty. A create, start, restart, scale, stop, terminate, or rollback request does
not invent a running state or `started_at` time.

An authenticated heartbeat always refreshes Agent `last_heartbeat`. It updates a
deployment only when its `deployment_id` and `target_revision` match the current
target. An Agent-scoped revision can report the Agent itself, but it never
completes a deployment. A heartbeat with `component: "command_listener"` is
liveness only. User-authenticated ingest preserves submitted statuses, node IDs,
errors, logs, and metrics as reported data; it does not set machine-observed
state.

Agent-wide stop increments and fences every active, pending, or ready target.
Target-level actions leave that fence in place. It is confirmed only after each
fenced target reports stopped at its current revision. A later explicit
deployment create/deploy intent clears the fence; older observations remain
bound to their prior deployment IDs and revisions.

## Runtime heartbeat and monitoring

The API emits `agent.heartbeat` for authenticated runtime heartbeats and emits
`agent.status` only when the persisted Agent status changes. Deployment events
are emitted only for a qualified target observation. The heartbeat `timestamp`
is retained for compatibility; freshness uses the server receipt time.

The monitor checks each current target’s qualified `observed_at` independently
from Agent `last_heartbeat`. It locks and rechecks the target revision and
observation time before recording stale evidence. Listener heartbeats therefore
cannot mask stale deployment work, and a concurrent newer heartbeat makes an
earlier stale scan a no-op. A current, target-bound runtime report can reconcile
that target after monitor failure and resolve its alert; unbound or old-revision
reports cannot. The monitor does not provision or restart work from elapsed
time.

***

## Overview

The internal modules below provide embedding APIs for agent execution and tool routing. The API heartbeat path and background monitor do not launch this runtime manager.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Agent Runtime Architecture                            │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         RuntimeManager                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                     AgentRuntime                                    │  │  │
│  │  │                                                                     │  │  │
│  │  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐  │  │ │
│  │  │  │  RuntimeConfig │  │  RuntimeState │  │   ToolExecutionHandler │  │  │ │
│  │  │  │  - timeout    │  │  - status     │  │   - register_handler   │  │  │ │
│  │  │  │  - max_agents │  │  - metrics    │  │   - execute_tool       │  │  │ │
│  │  │  │  - retries    │  │  - active    │  │                        │  │  │ │
│  │  │  └────────────────┘  └────────────────┘  └────────────────────────┘  │  │ │
│  │  │                                                                     │  │  │
│  │  │  ┌─────────────────────────────────────────────────────────────────┐ │  │ │
│  │  │  │                    Agent Registry                               │ │  │ │
│  │  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │ │  │ │
│  │  │  │  │ Agent 1 │ │ Agent 2 │ │ Agent 3 │ │ Agent N │              │ │  │ │
│  │  │  │  │(LangChain│ │(OpenClaw│ │  (n8n)  │ │         │              │ │  │ │
│  │  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │ │  │ │
│  │  │  └─────────────────────────────────────────────────────────────────┘ │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

***

## Agent Lifecycle

### Lifecycle States

```
        ┌─────────┐
        │ CREATED │
        └────┬────┘
             │ initialize()
             ▼
      ┌──────────────┐
      │ INITIALIZING │──── Exception ───▶ ┌─────────┐
      └──────┬───────┘                    │  ERROR  │
             │                            └────┬────┘
             │ success                           │
             ▼                                   │ reset()
      ┌──────────────┐                           │
      │    READY     │◀──────────────────────────┘
      └──────┬───────┘
             │ execute()
             ▼
      ┌──────────────┐
      │   RUNNING    │──── Complete ───▶ ┌─────────┐
      └──────┬───────┘                   │  READY  │
             │                            └────────┘
             │ Error/Timeout
             ▼
       ┌───────────┐
       │  ERROR    │
       └───────────┘
```

### Creating an Agent

```python
# From agent_runtime.py:189
def create_agent(
    self,
    name: str,
    provider: str,
    model: str,
    system_prompt: Optional[str] = None,
    tools: Optional[List[ToolDefinition]] = None,
    vector_store_name: Optional[str] = None,
    **kwargs,
) -> LangChainAgent:
    provider_enum = LLMProvider(provider.lower())
    config = AgentConfig(
        name=name,
        provider=provider_enum,
        model=model,
        system_prompt=system_prompt,
        tools=tools or [],
        vector_store_name=vector_store_name,
        **kwargs,
    )
    agent = AgentRegistry.create_agent(config)
    self.state.active_agents += 1
    return agent
```

### Execution Modes

| Mode          | Method                   | Use Case                      |
| ------------- | ------------------------ | ----------------------------- |
| **Async**     | `execute_agent()`        | Non-blocking, high throughput |
| **Sync**      | `execute_agent_sync()`   | Simple scripts, CLI tools     |
| **Streaming** | `execute_agent_stream()` | Real-time output, chat UIs    |

***

## Agent Types

### 1. LangChain Agent

From `src/api/integrations/langchain_agent.py`:

```python
class LangChainAgent:
    def __init__(self, config: AgentConfig):
        self.llm = LLMWrapper.create(config)
        self.memory_manager = ConversationMemoryManager(config.memory_type)
        self.tools = self._initialize_tools()
        self.agent_executor = None
```

**Features:**

* Multiple LLM providers (OpenAI, Anthropic, Ollama)
* Tool-augmented execution
* Conversation memory
* Streaming support

### 2. OpenClaw Agent

Multi-agent orchestration framework for complex workflows.

### 3. n8n Agent

Workflow automation with visual builder integration.

***

## Tool Execution

Every LangChain tool registered through `AgentRuntime` is mediated before its
handler can run. The runtime normalizes the call with `ActionMediator`, evaluates
the active `PolicyEngine` policy, and then applies the decision:

* `ALLOW` and `MODIFY` execute the original handler (with modified arguments when supplied).
* `DENY` blocks the handler and emits an action receipt.
* `DEFER` blocks the handler. Because arbitrary handler continuations are not
  durably serializable yet, the runtime returns `resumable: false` and does not
  create a ghost approval.

The default runtime policy allows the low-risk built-ins (`get_time`,
`calculator`, and `search_documents`) and denies custom tools until a policy is
configured. Security REST routes expose the separate canonical durable approval
workflow. A caller that needs resumability must bind that workflow to its own
durable, idempotent job continuation.

Each decision also appends a RunEvent v1-compatible audit record with the run,
actor, policy decision, approval, cost/redaction metadata, and a SHA-256 link to
the prior event in that run. Administrators can retrieve and verify a chain with
`GET /v1/audit/export?run_id=<run-id>` (or export all run chains in a session via
`session_id`).

### Tool Handler Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         Tool Execution Flow                                      │
│                                                                                  │
│  ┌──────────┐     ┌─────────────────┐     ┌────────────────────────────────┐  │
│  │  Agent   │────▶│ ToolExecution   │────▶│  Tool Registry                 │  │
│  │ Request  │     │    Handler       │     │                                │  │
│  └──────────┘     └────────┬────────┘     │  ┌──────────────────────────┐ │  │
│                            │               │  │ search_documents (RAG)    │ │  │
│                            │               │  │ get_time                  │ │  │
│                            ▼               │  │ calculator                │ │  │
│                     ┌─────────────────┐   │  │ [custom tools...]         │ │  │
│                     │  Validate Input  │   │  └──────────────────────────┘ │  │
│                     └────────┬────────┘   └────────────────────────────────┘  │
│                              │                                                 │
│                              ▼                                                 │
│                     ┌─────────────────┐     ┌────────────────────────────────┐  │
│                     │  Execute Tool   │────▶│  Return/Stream Result         │  │
│                     │  (Async/Sync)   │     │                                │  │
│                     └─────────────────┘     └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Built-in Tools

| Tool               | Description                      | Example                        |
| ------------------ | -------------------------------- | ------------------------------ |
| `search_documents` | Semantic search via vector store | `query="deployment guide"`     |
| `get_time`         | Current timestamp                | `get_time()`                   |
| `calculator`       | Safe math evaluation             | `calculator(expression="2+2")` |

### Custom Tool Registration

```python
from src.api.services.agent_runtime import AgentRuntime

runtime = AgentRuntime(config)
runtime.tool_handler.register_handler(
    "my_tool",
    async def my_tool_handler(params):
        # Custom logic
        return {"result": "..."}
)
```

***

## Monitoring

`src/api/services/monitor.py` owns the background task, its database transaction,
and the monitor-worker health file. Each cycle calls `monitor_agent_health` in
`src/api/services/monitoring.py`.

When qualified work evidence goes stale, the current deployment observation is
marked failed and an attributable event, error log, and `AGENT_DOWN` alert are
recorded. Agent liveness without a tracked deployment is monitored separately.
Webhook errors are logged without rolling back the state transition. A later
current-revision runtime report may reconcile the matching target and alert; the
monitor itself does not recover or relaunch it.

***

## Configuration

### Runtime Configuration

```python
@dataclass
class RuntimeConfig:
    max_concurrent_agents: int = 10        # Max agents per runtime
    default_timeout: int = 300             # Execution timeout (seconds)
    enable_streaming: bool = True          # Enable streaming responses
    max_retries: int = 3                   # Retry attempts on failure
    retry_delay: float = 1.0               # Delay between retries
    vector_store_enabled: bool = True      # Enable RAG
    database_url: Optional[str] = None     # Database connection
```

### Example Usage

```python
from src.api.services.agent_runtime import (
    AgentRuntime,
    RuntimeConfig,
    RuntimeManager
)

# Create runtime
config = RuntimeConfig(
    max_concurrent_agents=5,
    default_timeout=600,
)
runtime = RuntimeManager.create_runtime(config)

# Start runtime
await runtime.start()

# Create and execute agent
agent = runtime.create_agent(
    name="my-agent",
    provider="openai",
    model="gpt-4",
    system_prompt="You are a helpful assistant."
)

result = await runtime.execute_agent(
    agent_id=agent.agent_id,
    input_text="Hello, world!"
)

# Get stats
stats = runtime.get_stats()
# {
#   "runtime_id": "...",
#   "status": "running",
#   "active_agents": 1,
#   "total_executions": 1,
#   "failed_executions": 0,
#   "success_rate": 1.0
# }

# Stop runtime
await runtime.stop()
```

***

## Next Steps

* [Security](security.md)
