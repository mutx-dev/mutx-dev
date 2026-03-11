import os
import asyncio
import logging
import uuid
from typing import Optional, List, Dict, Any, AsyncIterator, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
from contextlib import asynccontextmanager

from ..integrations.langchain_agent import (
    LangChainAgent,
    AgentConfig,
    AgentRegistry,
    AgentState,
    LLMProvider,
    ToolDefinition,
)
from ..integrations.vector_store import (
    VectorStoreConfig,
    VectorStoreRegistry,
    EmbeddingProvider,
)

logger = logging.getLogger(__name__)


class RuntimeStatus(str, Enum):
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    ERROR = "error"
    STOPPING = "stopping"


@dataclass
class RuntimeConfig:
    max_concurrent_agents: int = 10
    default_timeout: int = 300
    enable_streaming: bool = True
    max_retries: int = 3
    retry_delay: float = 1.0
    vector_store_enabled: bool = True
    database_url: Optional[str] = None


@dataclass
class ExecutionContext:
    execution_id: str
    agent_id: str
    input_text: str
    started_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    status: str = "running"
    output: Optional[str] = None
    error: Optional[str] = None
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class RuntimeState:
    runtime_id: str
    status: RuntimeStatus
    active_agents: int = 0
    total_executions: int = 0
    failed_executions: int = 0
    started_at: Optional[datetime] = None
    last_error: Optional[str] = None


class ToolExecutionHandler:
    def __init__(self):
        self._handlers: Dict[str, Callable] = {}

    def register_handler(self, tool_name: str, handler: Callable):
        self._handlers[tool_name] = handler
        logger.info(f"Registered handler for tool: {tool_name}")

    def get_handler(self, tool_name: str) -> Optional[Callable]:
        return self._handlers.get(tool_name)

    async def execute_tool(self, tool_name: str, parameters: Dict[str, Any]) -> Any:
        handler = self.get_handler(tool_name)
        if not handler:
            logger.warning(f"No handler registered for tool: {tool_name}")
            return {"error": f"Tool {tool_name} not found"}

        try:
            if asyncio.iscoroutinefunction(handler):
                return await handler(parameters)
            return handler(parameters)
        except Exception as e:
            logger.error(f"Tool execution error for {tool_name}: {str(e)}")
            return {"error": str(e)}


class AgentRuntime:
    def __init__(self, config: RuntimeConfig):
        self.config = config
        self.runtime_id = str(uuid.uuid4())
        self.state = RuntimeState(
            runtime_id=self.runtime_id,
            status=RuntimeStatus.STOPPED,
        )
        self.tool_handler = ToolExecutionHandler()
        self._execution_callbacks: Dict[str, Callable] = {}
        self._running_tasks: Dict[str, asyncio.Task] = {}

    async def start(self):
        if self.state.status == RuntimeStatus.RUNNING:
            logger.warning(f"Runtime {self.runtime_id} already running")
            return

        self.state.status = RuntimeStatus.STARTING
        self.state.started_at = datetime.utcnow()

        if self.config.vector_store_enabled and self.config.database_url:
            self._initialize_vector_store()

        self._register_default_tool_handlers()
        self.state.status = RuntimeStatus.RUNNING
        logger.info(f"Runtime {self.runtime_id} started")

    async def stop(self):
        self.state.status = RuntimeStatus.STOPPING

        for task_id, task in self._running_tasks.items():
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    logger.info(f"Task {task_id} cancelled")

        self._running_tasks.clear()
        self.state.status = RuntimeStatus.STOPPED
        logger.info(f"Runtime {self.runtime_id} stopped")

    def _initialize_vector_store(self):
        try:
            vector_config = VectorStoreConfig(
                database_url=self.config.database_url
                or os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/mutx"),
                embedding_provider=EmbeddingProvider.OPENAI,
                embedding_model="text-embedding-ada-002",
                collection_name="default",
            )
            VectorStoreRegistry.create_store("default", vector_config)
            logger.info("Default vector store initialized")
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {str(e)}")

    def _register_default_tool_handlers(self):
        self.tool_handler.register_handler("search_documents", self._handle_search_documents)
        self.tool_handler.register_handler("get_time", self._handle_get_time)
        self.tool_handler.register_handler("calculator", self._handle_calculator)

    async def _handle_search_documents(self, params: Dict[str, Any]) -> str:
        store_name = params.get("store_name", "default")
        query = params.get("query", "")
        k = params.get("k", 4)

        store = VectorStoreRegistry.get_store(store_name)
        if not store:
            return f"Vector store '{store_name}' not found"

        docs = store.similarity_search(query, k=k)
        if not docs:
            return "No relevant documents found"

        results = []
        for i, doc in enumerate(docs, 1):
            results.append(f"{i}. {doc.page_content[:200]}...")
        return "\n".join(results)

    async def _handle_get_time(self, params: Dict[str, Any]) -> str:
        return datetime.utcnow().isoformat()

    async def _handle_calculator(self, params: Dict[str, Any]) -> str:
        _expression = params.get("expression", "0")
        # Safety cleanup: removed dangerous eval()
        # In a real system, use a safe math parser like simpleeval or numexpr
        return "Calculator tool disabled for safety in this version. Use repo-native Python tools."

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
        logger.info(f"Created agent {agent.agent_id} in runtime {self.runtime_id}")
        return agent

    async def execute_agent(
        self,
        agent_id: str,
        input_text: str,
        timeout: Optional[int] = None,
    ) -> ExecutionContext:
        execution_id = str(uuid.uuid4())
        context = ExecutionContext(
            execution_id=execution_id,
            agent_id=agent_id,
            input_text=input_text,
        )

        agent = AgentRegistry.get_agent(agent_id)
        if not agent:
            context.status = "error"
            context.error = f"Agent {agent_id} not found"
            context.completed_at = datetime.utcnow()
            self.state.failed_executions += 1
            return context

        timeout = timeout or self.config.default_timeout

        try:
            result = await asyncio.wait_for(
                agent.arun(input_text),
                timeout=timeout,
            )

            context.output = result.get("output")
            context.status = "completed" if result.get("success") else "error"
            context.error = result.get("error")
            context.completed_at = datetime.utcnow()
            self.state.total_executions += 1

            if not result.get("success"):
                self.state.failed_executions += 1

        except asyncio.TimeoutError:
            context.status = "timeout"
            context.error = f"Execution timed out after {timeout} seconds"
            context.completed_at = datetime.utcnow()
            self.state.failed_executions += 1
            logger.error(f"Execution {execution_id} timed out")

        except Exception as e:
            context.status = "error"
            context.error = str(e)
            context.completed_at = datetime.utcnow()
            self.state.failed_executions += 1
            logger.error(f"Execution {execution_id} error: {str(e)}")

        if self._execution_callbacks.get(execution_id):
            callback = self._execution_callbacks.pop(execution_id)
            callback(context)

        return context

    async def execute_agent_stream(
        self,
        agent_id: str,
        input_text: str,
    ) -> AsyncIterator[str]:
        agent = AgentRegistry.get_agent(agent_id)
        if not agent:
            yield f"Error: Agent {agent_id} not found"
            return

        try:
            for chunk in agent.stream_run(input_text):
                if isinstance(chunk, str):
                    yield chunk
                else:
                    yield str(chunk)
        except Exception as e:
            logger.error(f"Stream execution error: {str(e)}")
            yield f"Error: {str(e)}"

    def execute_agent_sync(self, agent_id: str, input_text: str) -> Dict[str, Any]:
        agent = AgentRegistry.get_agent(agent_id)
        if not agent:
            return {"success": False, "error": f"Agent {agent_id} not found"}

        return agent.run(input_text)

    def get_agent(self, agent_id: str) -> Optional[LangChainAgent]:
        return AgentRegistry.get_agent(agent_id)

    def delete_agent(self, agent_id: str) -> bool:
        success = AgentRegistry.delete_agent(agent_id)
        if success:
            self.state.active_agents = max(0, self.state.active_agents - 1)
        return success

    def list_agents(self) -> List[AgentState]:
        return AgentRegistry.list_agents()

    def get_state(self) -> RuntimeState:
        return self.state

    def get_stats(self) -> Dict[str, Any]:
        return {
            "runtime_id": self.runtime_id,
            "status": self.state.status.value,
            "active_agents": self.state.active_agents,
            "total_executions": self.state.total_executions,
            "failed_executions": self.state.failed_executions,
            "success_rate": (
                (self.state.total_executions - self.state.failed_executions)
                / self.state.total_executions
                if self.state.total_executions > 0
                else 0.0
            ),
            "started_at": self.state.started_at.isoformat() if self.state.started_at else None,
            "last_error": self.state.last_error,
        }

    def on_execution_complete(self, execution_id: str, callback: Callable):
        self._execution_callbacks[execution_id] = callback


class RuntimeManager:
    _runtimes: Dict[str, AgentRuntime] = {}
    _default_runtime: Optional[AgentRuntime] = None

    @classmethod
    def create_runtime(cls, config: Optional[RuntimeConfig] = None) -> AgentRuntime:
        runtime = AgentRuntime(config or RuntimeConfig())
        cls._runtimes[runtime.runtime_id] = runtime
        logger.info(f"Created runtime {runtime.runtime_id}")
        return runtime

    @classmethod
    async def start_runtime(cls, runtime_id: str) -> bool:
        runtime = cls._runtimes.get(runtime_id)
        if not runtime:
            return False
        await runtime.start()
        return True

    @classmethod
    async def stop_runtime(cls, runtime_id: str) -> bool:
        runtime = cls._runtimes.get(runtime_id)
        if not runtime:
            return False
        await runtime.stop()
        return True

    @classmethod
    def get_runtime(cls, runtime_id: str) -> Optional[AgentRuntime]:
        return cls._runtimes.get(runtime_id)

    @classmethod
    def get_or_create_default(cls, config: Optional[RuntimeConfig] = None) -> AgentRuntime:
        if cls._default_runtime is None:
            cls._default_runtime = cls.create_runtime(config)
        return cls._default_runtime

    @classmethod
    def delete_runtime(cls, runtime_id: str) -> bool:
        if runtime_id in cls._runtimes:
            del cls._runtimes[runtime_id]
            return True
        return False

    @classmethod
    def list_runtimes(cls) -> List[RuntimeState]:
        return [runtime.get_state() for runtime in cls._runtimes.values()]


@asynccontextmanager
async def runtime_context(config: Optional[RuntimeConfig] = None):
    runtime = RuntimeManager.get_or_create_default(config)
    await runtime.start()
    try:
        yield runtime
    finally:
        await runtime.stop()
