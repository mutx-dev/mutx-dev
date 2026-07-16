import logging
import uuid
from typing import Optional, List, Dict, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod
import ast
import operator
from datetime import datetime, timezone

from langchain.agents import create_agent
from langchain_anthropic import ChatAnthropic
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.tools import BaseTool
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI

from .tool_names import RUNTIME_BUILTIN_TOOL_NAMES
from .vector_store import VectorStoreRegistry

logger = logging.getLogger(__name__)


_SAFE_BINARY_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}
_SAFE_UNARY_OPERATORS = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}
_SAFE_CALCULATE_FUNCTIONS = {
    "abs": abs,
    "round": round,
    "min": min,
    "max": max,
    "sum": sum,
}
_MAX_CALCULATE_COLLECTION_ITEMS = 32
_MAX_CALCULATE_POWER_EXPONENT = 1000
_MAX_CALCULATE_MAGNITUDE = 10**12
_MAX_CALCULATE_RESULT_MAGNITUDE = 10**18


def _validate_safe_number(value: int | float) -> int | float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("Only numeric values are allowed")
    if abs(value) > _MAX_CALCULATE_MAGNITUDE:
        raise ValueError("Numeric value is too large")
    return value


def _validate_safe_result(value: int | float) -> int | float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("Only numeric results are allowed")
    if abs(value) > _MAX_CALCULATE_RESULT_MAGNITUDE:
        raise ValueError("Result is too large")
    return value


def _safe_calculate_eval(
    node: ast.AST,
) -> int | float | list[int | float] | tuple[int | float, ...]:
    if isinstance(node, ast.Expression):
        return _safe_calculate_eval(node.body)

    if isinstance(node, ast.Constant):
        if isinstance(node.value, bool) or not isinstance(node.value, (int, float)):
            raise ValueError("Only numeric constants are allowed")
        return _validate_safe_number(node.value)

    if isinstance(node, ast.List):
        if len(node.elts) > _MAX_CALCULATE_COLLECTION_ITEMS:
            raise ValueError("Too many items in expression")
        return [_safe_calculate_eval(element) for element in node.elts]

    if isinstance(node, ast.Tuple):
        if len(node.elts) > _MAX_CALCULATE_COLLECTION_ITEMS:
            raise ValueError("Too many items in expression")
        return tuple(_safe_calculate_eval(element) for element in node.elts)

    if isinstance(node, ast.UnaryOp) and type(node.op) in _SAFE_UNARY_OPERATORS:
        return _validate_safe_result(
            _SAFE_UNARY_OPERATORS[type(node.op)](_safe_calculate_eval(node.operand))
        )

    if isinstance(node, ast.BinOp) and type(node.op) in _SAFE_BINARY_OPERATORS:
        left = _safe_calculate_eval(node.left)
        right = _safe_calculate_eval(node.right)
        if type(node.op) is ast.Pow:
            if not isinstance(left, (int, float)) or not isinstance(right, (int, float)):
                raise ValueError("Power operands must be numeric")
            if isinstance(right, float) and not right.is_integer():
                raise ValueError("Power exponent must be an integer")
            if abs(int(right)) > _MAX_CALCULATE_POWER_EXPONENT:
                raise ValueError("Power exponent is too large")
        return _validate_safe_result(_SAFE_BINARY_OPERATORS[type(node.op)](left, right))

    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
        function_name = node.func.id
        safe_function = _SAFE_CALCULATE_FUNCTIONS.get(function_name)
        if safe_function is None:
            raise ValueError(f"Function '{function_name}' is not allowed")
        if node.keywords:
            raise ValueError("Keyword arguments are not allowed")
        if len(node.args) > _MAX_CALCULATE_COLLECTION_ITEMS:
            raise ValueError("Too many function arguments")
        result = safe_function(*[_safe_calculate_eval(argument) for argument in node.args])
        return _validate_safe_result(result)

    raise ValueError("Unsupported expression")


class LLMProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"


@dataclass
class ToolDefinition:
    name: str
    description: str
    function: Callable
    parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentConfig:
    name: str
    provider: LLMProvider
    model: str
    temperature: float = 0.7
    max_tokens: int = 2048
    system_prompt: Optional[str] = None
    tools: List[ToolDefinition] = field(default_factory=list)
    vector_store_name: Optional[str] = None
    memory_type: str = "buffer"
    max_iterations: int = 10
    verbose: bool = False
    tool_executor: Optional[Callable[[str, str, Dict[str, Any], Callable], Any]] = None


@dataclass
class AgentState:
    agent_id: str
    name: str
    status: str
    config: AgentConfig
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_run: Optional[datetime] = None
    conversation_history: List[Dict[str, Any]] = field(default_factory=list)


class BaseLLM(ABC):
    @abstractmethod
    def invoke(self, messages: List[BaseMessage]) -> AIMessage:
        pass

    @abstractmethod
    async def ainvoke(self, messages: List[BaseMessage]) -> AIMessage:
        pass


class OpenAILLM(BaseLLM):
    def __init__(self, model: str, temperature: float = 0.7, max_tokens: int = 2048, **kwargs):
        self.client = ChatOpenAI(
            model=model, temperature=temperature, max_tokens=max_tokens, **kwargs
        )

    def invoke(self, messages: List[BaseMessage]) -> AIMessage:
        return self.client.invoke(messages)

    async def ainvoke(self, messages: List[BaseMessage]) -> AIMessage:
        return await self.client.ainvoke(messages)


class AnthropicLLM(BaseLLM):
    def __init__(self, model: str, temperature: float = 0.7, max_tokens: int = 2048, **kwargs):
        self.client = ChatAnthropic(
            model=model, temperature=temperature, max_tokens=max_tokens, **kwargs
        )

    def invoke(self, messages: List[BaseMessage]) -> AIMessage:
        return self.client.invoke(messages)

    async def ainvoke(self, messages: List[BaseMessage]) -> AIMessage:
        return await self.client.ainvoke(messages)


class OllamaLLM(BaseLLM):
    def __init__(self, model: str, temperature: float = 0.7, **kwargs):
        self.client = ChatOllama(model=model, temperature=temperature, **kwargs)

    def invoke(self, messages: List[BaseMessage]) -> AIMessage:
        return self.client.invoke(messages)

    async def ainvoke(self, messages: List[BaseMessage]) -> AIMessage:
        return await self.client.ainvoke(messages)


class LLMWrapper:
    @staticmethod
    def create(config: AgentConfig, **kwargs) -> BaseLLM:
        if config.provider == LLMProvider.OPENAI:
            return OpenAILLM(
                model=config.model,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                **kwargs,
            )
        elif config.provider == LLMProvider.ANTHROPIC:
            return AnthropicLLM(
                model=config.model,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                **kwargs,
            )
        elif config.provider == LLMProvider.OLLAMA:
            return OllamaLLM(model=config.model, temperature=config.temperature, **kwargs)
        else:
            raise ValueError(f"Unknown LLM provider: {config.provider}")


class ToolFactory:
    @staticmethod
    def create_tools(tool_definitions: List[ToolDefinition]) -> List[BaseTool]:
        tools = []
        for tool_def in tool_definitions:
            tool = ToolFactory._create_tool_from_definition(tool_def)
            tools.append(tool)
        return tools

    @staticmethod
    def _create_tool_from_definition(tool_def: ToolDefinition) -> BaseTool:
        from langchain_core.tools import tool

        args_schema = tool_def.parameters or {"type": "object", "properties": {}}

        @tool(
            tool_def.name,
            description=tool_def.description,
            args_schema=args_schema,
        )
        def wrapper_func(**kwargs):
            return tool_def.function(kwargs)

        return wrapper_func


class BuiltInTools:
    @staticmethod
    def search_documents(vector_store_name: str, query: str, k: int = 4) -> str:
        store = VectorStoreRegistry.get_store(vector_store_name)
        if not store:
            return f"Vector store '{vector_store_name}' not found"

        docs = store.similarity_search(query, k=k)
        if not docs:
            return "No relevant documents found"

        results = []
        for i, doc in enumerate(docs, 1):
            results.append(f"{i}. {doc.page_content[:200]}...")
        return "\n".join(results)

    @staticmethod
    def get_timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def calculate(expression: str) -> str:
        try:
            normalized_expression = str(expression or "").strip()
            if not normalized_expression:
                return "Error: Expression is empty"
            if len(normalized_expression) > 200:
                return "Error: Expression is too long"

            parsed = ast.parse(normalized_expression, mode="eval")
            result = _safe_calculate_eval(parsed)
            return str(result)
        except Exception as e:
            return f"Error: {str(e)}"


class ConversationMemoryManager:
    def __init__(self, memory_type: str = "buffer"):
        self.memory_type = memory_type
        self.chat_history = InMemoryChatMessageHistory()

    def add_user_message(self, content: str):
        self.chat_history.add_user_message(content)

    def add_ai_message(self, content: str):
        self.chat_history.add_ai_message(content)

    def get_messages(self) -> List[BaseMessage]:
        return self.chat_history.messages

    def clear(self):
        self.chat_history.clear()

    def get_context(self) -> str:
        messages = self.get_messages()
        context_parts = []
        for msg in messages[-10:]:
            if isinstance(msg, HumanMessage):
                context_parts.append(f"Human: {msg.content}")
            elif isinstance(msg, AIMessage):
                context_parts.append(f"AI: {msg.content}")
        return "\n".join(context_parts[-5:])


class LangChainAgent:
    def __init__(self, config: AgentConfig):
        self.config = config
        self.agent_id = str(uuid.uuid4())
        self.state = AgentState(
            agent_id=self.agent_id,
            name=config.name,
            status="created",
            config=config,
        )
        self.llm = LLMWrapper.create(config)
        self.memory_manager = ConversationMemoryManager(config.memory_type)
        self.tools = self._initialize_tools()
        self.agent_executor = None

    def _initialize_tools(self) -> List[BaseTool]:
        reserved_custom_names = sorted(
            {definition.name for definition in self.config.tools} & set(RUNTIME_BUILTIN_TOOL_NAMES)
        )
        if reserved_custom_names:
            names = ", ".join(reserved_custom_names)
            raise ValueError(f"Custom tool names are reserved by the runtime: {names}")

        tool_definitions = list(self.config.tools)
        vector_store_name = self.config.vector_store_name

        if vector_store_name:
            tool_definitions.append(
                ToolDefinition(
                    name="search_documents",
                    description="Search through documents using semantic similarity. Use this to find relevant information from uploaded documents.",
                    function=lambda kwargs, vector_store_name=vector_store_name: (
                        BuiltInTools.search_documents(
                            vector_store_name, kwargs.get("query", ""), kwargs.get("k", 4)
                        )
                    ),
                    parameters={
                        "type": "object",
                        "properties": {
                            "query": {"type": "string"},
                            "k": {"type": "integer", "minimum": 1, "default": 4},
                        },
                        "required": ["query"],
                    },
                )
            )

        tool_definitions.extend(
            [
                ToolDefinition(
                    name="get_time",
                    description="Get the current timestamp",
                    function=lambda _: BuiltInTools.get_timestamp(),
                    parameters={"type": "object", "properties": {}},
                ),
                ToolDefinition(
                    name="calculator",
                    description="Perform mathematical calculations",
                    function=lambda kwargs: BuiltInTools.calculate(kwargs.get("expression", "0")),
                    parameters={
                        "type": "object",
                        "properties": {"expression": {"type": "string"}},
                        "required": ["expression"],
                    },
                ),
            ]
        )

        if self.config.tool_executor:
            governed_definitions = []
            for definition in tool_definitions:
                original_handler = definition.function
                governed_definitions.append(
                    ToolDefinition(
                        name=definition.name,
                        description=definition.description,
                        parameters=definition.parameters,
                        function=lambda kwargs, name=definition.name, handler=original_handler: (
                            self.config.tool_executor(
                                self.agent_id,
                                name,
                                kwargs,
                                handler,
                            )
                        ),
                    )
                )
            tool_definitions = governed_definitions

        return ToolFactory.create_tools(tool_definitions)

    def _system_prompt(self) -> str:
        return self.config.system_prompt or (
            "You are a helpful AI assistant. Use the available tools to answer questions. "
            "If you need to search for information, use the search_documents tool."
        )

    def initialize(self):
        self.agent_executor = create_agent(
            model=self._get_llm_adapter(),
            tools=self.tools,
            system_prompt=self._system_prompt(),
            debug=self.config.verbose,
        )
        self.state.status = "initialized"
        logger.info(f"Agent {self.agent_id} initialized with {len(self.tools)} tools")

    def _get_llm_adapter(self):
        return self.llm.client

    def _agent_config(self) -> Dict[str, Any]:
        # Each tool iteration consumes a model node and a tool node. Preserve the
        # former max_iterations contract using LangGraph's recursion limit.
        return {"recursion_limit": max(2, (self.config.max_iterations * 2) + 1)}

    @staticmethod
    def _message_text(message: BaseMessage) -> str:
        text = getattr(message, "text", "")
        return str(text) if text else ""

    @classmethod
    def _extract_agent_output(cls, result: Dict[str, Any]) -> str:
        messages = result.get("messages") or []
        if not messages:
            return ""
        return cls._message_text(messages[-1])

    def run(self, input_text: str) -> Dict[str, Any]:
        self.state.status = "running"
        self.memory_manager.add_user_message(input_text)

        try:
            if self.agent_executor:
                result = self.agent_executor.invoke(
                    {"messages": self.memory_manager.get_messages()},
                    config=self._agent_config(),
                )
                output = self._extract_agent_output(result)
            else:
                messages = [
                    SystemMessage(
                        content=self.config.system_prompt or "You are a helpful assistant."
                    ),
                    HumanMessage(content=input_text),
                ]
                response = self.llm.invoke(messages)
                output = self._message_text(response)

            self.memory_manager.add_ai_message(output)
            self.state.last_run = datetime.now(timezone.utc)
            self.state.conversation_history.append(
                {
                    "timestamp": self.state.last_run.isoformat(),
                    "input": input_text,
                    "output": output,
                }
            )
            self.state.status = "ready"

            return {
                "success": True,
                "output": output,
                "agent_id": self.agent_id,
            }

        except Exception as e:
            self.state.status = "error"
            logger.error(f"Agent {self.agent_id} error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "agent_id": self.agent_id,
            }

    async def arun(self, input_text: str) -> Dict[str, Any]:
        self.state.status = "running"
        self.memory_manager.add_user_message(input_text)

        try:
            if self.agent_executor:
                result = await self.agent_executor.ainvoke(
                    {"messages": self.memory_manager.get_messages()},
                    config=self._agent_config(),
                )
                output = self._extract_agent_output(result)
            else:
                messages = [
                    SystemMessage(
                        content=self.config.system_prompt or "You are a helpful assistant."
                    ),
                    HumanMessage(content=input_text),
                ]
                response = await self.llm.ainvoke(messages)
                output = self._message_text(response)

            self.memory_manager.add_ai_message(output)
            self.state.last_run = datetime.now(timezone.utc)
            self.state.conversation_history.append(
                {
                    "timestamp": self.state.last_run.isoformat(),
                    "input": input_text,
                    "output": output,
                }
            )
            self.state.status = "ready"

            return {
                "success": True,
                "output": output,
                "agent_id": self.agent_id,
            }

        except Exception as e:
            self.state.status = "error"
            logger.error(f"Agent {self.agent_id} async error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "agent_id": self.agent_id,
            }

    def stream_run(self, input_text: str):
        self.state.status = "running"
        self.memory_manager.add_user_message(input_text)

        try:
            if self.agent_executor:
                message_count = len(self.memory_manager.get_messages())
                final_output = ""
                for chunk in self.agent_executor.stream(
                    {"messages": self.memory_manager.get_messages()},
                    config=self._agent_config(),
                    stream_mode="values",
                ):
                    messages = chunk.get("messages") or []
                    for message in messages[message_count:]:
                        if isinstance(message, AIMessage):
                            output = self._message_text(message)
                            if output:
                                final_output = output
                                yield output
                    message_count = len(messages)
                if final_output:
                    self.memory_manager.add_ai_message(final_output)
            else:
                messages = [
                    SystemMessage(
                        content=self.config.system_prompt or "You are a helpful assistant."
                    ),
                    HumanMessage(content=input_text),
                ]
                response = self.llm.invoke(messages)
                yield self._message_text(response)

            self.state.last_run = datetime.now(timezone.utc)
            self.state.status = "ready"

        except Exception as e:
            self.state.status = "error"
            logger.error(f"Agent {self.agent_id} stream error: {str(e)}")
            yield f"Error: {str(e)}"

    def get_state(self) -> AgentState:
        return self.state

    def get_conversation_history(self) -> List[Dict[str, Any]]:
        return self.state.conversation_history

    def clear_memory(self):
        self.memory_manager.clear()
        logger.info(f"Agent {self.agent_id} memory cleared")


class AgentRegistry:
    _agents: Dict[str, LangChainAgent] = {}

    @classmethod
    def create_agent(cls, config: AgentConfig) -> LangChainAgent:
        agent = LangChainAgent(config)
        agent.initialize()
        cls._agents[agent.agent_id] = agent
        logger.info(f"Created agent {agent.agent_id} of type langchain")
        return agent

    @classmethod
    def get_agent(cls, agent_id: str) -> Optional[LangChainAgent]:
        return cls._agents.get(agent_id)

    @classmethod
    def delete_agent(cls, agent_id: str) -> bool:
        if agent_id in cls._agents:
            del cls._agents[agent_id]
            logger.info(f"Deleted agent {agent_id}")
            return True
        return False

    @classmethod
    def list_agents(cls) -> List[AgentState]:
        return [agent.get_state() for agent in cls._agents.values()]

    @classmethod
    def get_agent_state(cls, agent_id: str) -> Optional[AgentState]:
        agent = cls._agents.get(agent_id)
        return agent.get_state() if agent else None
