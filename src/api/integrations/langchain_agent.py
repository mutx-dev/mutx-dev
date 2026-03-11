import logging
import uuid
from typing import Optional, List, Dict, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod
from datetime import datetime

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_core.tools import BaseTool
from langchain.agents import AgentExecutor, create_openai_functions_agent, create_structured_chat_agent
from langchain.memory import ConversationBufferMemory, ChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from .vector_store import VectorStoreRegistry

logger = logging.getLogger(__name__)


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
    verbose: bool = True


@dataclass
class AgentState:
    agent_id: str
    name: str
    status: str
    config: AgentConfig
    created_at: datetime = field(default_factory=datetime.utcnow)
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
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs
        )

    def invoke(self, messages: List[BaseMessage]) -> AIMessage:
        return self.client.invoke(messages)

    async def ainvoke(self, messages: List[BaseMessage]) -> AIMessage:
        return await self.client.ainvoke(messages)


class AnthropicLLM(BaseLLM):
    def __init__(self, model: str, temperature: float = 0.7, max_tokens: int = 2048, **kwargs):
        self.client = ChatAnthropic(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs
        )

    def invoke(self, messages: List[BaseMessage]) -> AIMessage:
        return self.client.invoke(messages)

    async def ainvoke(self, messages: List[BaseMessage]) -> AIMessage:
        return await self.client.ainvoke(messages)


class OllamaLLM(BaseLLM):
    def __init__(self, model: str, temperature: float = 0.7, **kwargs):
        self.client = ChatOllama(
            model=model,
            temperature=temperature,
            **kwargs
        )

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
                **kwargs
            )
        elif config.provider == LLMProvider.ANTHROPIC:
            return AnthropicLLM(
                model=config.model,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                **kwargs
            )
        elif config.provider == LLMProvider.OLLAMA:
            return OllamaLLM(
                model=config.model,
                temperature=config.temperature,
                **kwargs
            )
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

        @tool(name=tool_def.name, args_schema=tool_def.parameters)
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
        return datetime.utcnow().isoformat()

    @staticmethod
    def calculate(expression: str) -> str:
        try:
            result = eval(expression, {"__builtins__": {}}, {})
            return str(result)
        except Exception as e:
            return f"Error: {str(e)}"


class ConversationMemoryManager:
    def __init__(self, memory_type: str = "buffer"):
        self.memory_type = memory_type
        self.chat_history = ChatMessageHistory()
        self.memory = ConversationBufferMemory(
            chat_memory=self.chat_history,
            return_messages=True,
            output_key="output",
            input_key="input",
        )

    def add_user_message(self, content: str):
        self.chat_history.add_user_message(content)

    def add_ai_message(self, content: str):
        self.chat_history.add_ai_message(content)

    def get_messages(self) -> List[BaseMessage]:
        return self.chat_history.messages

    def clear(self):
        self.chat_history.clear()
        self.memory.clear()

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
        tool_definitions = list(self.config.tools)
        vector_store_name = self.config.vector_store_name

        if vector_store_name:
            tool_definitions.append(
                ToolDefinition(
                    name="search_documents",
                    description="Search through documents using semantic similarity. Use this to find relevant information from uploaded documents.",
                    function=lambda kwargs, vector_store_name=vector_store_name: BuiltInTools.search_documents(
                        vector_store_name,
                        kwargs.get("query", ""),
                        kwargs.get("k", 4)
                    ),
                )
            )

        tool_definitions.extend([
            ToolDefinition(
                name="get_time",
                description="Get the current timestamp",
                function=lambda _: BuiltInTools.get_timestamp(),
            ),
            ToolDefinition(
                name="calculator",
                description="Perform mathematical calculations",
                function=lambda kwargs: BuiltInTools.calculate(kwargs.get("expression", "0")),
            ),
        ])

        return ToolFactory.create_tools(tool_definitions)

    def _build_prompt(self) -> ChatPromptTemplate:
        system_message = self.config.system_prompt or (
            "You are a helpful AI assistant. Use the available tools to answer questions. "
            "If you need to search for information, use the search_documents tool."
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_message),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        return prompt

    def initialize(self):
        if not self.tools:
            self.state.status = "ready"
            return

        prompt = self._build_prompt()

        if self.config.provider == LLMProvider.OPENAI:
            agent = create_openai_functions_agent(
                llm=self._get_llm_adapter(),
                tools=self.tools,
                prompt=prompt,
            )
        else:
            agent = create_structured_chat_agent(
                llm=self._get_llm_adapter(),
                tools=self.tools,
                prompt=prompt,
            )

        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            memory=self.memory_manager.memory,
            max_iterations=self.config.max_iterations,
            verbose=self.config.verbose,
            handle_parsing_errors=True,
        )
        self.state.status = "initialized"
        logger.info(f"Agent {self.agent_id} initialized with {len(self.tools)} tools")

    def _get_llm_adapter(self):
        if isinstance(self.llm, OpenAILLM):
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model=self.config.model,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens,
            )
        elif isinstance(self.llm, AnthropicLLM):
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(
                model=self.config.model,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens,
            )
        else:
            from langchain_community.chat_models import ChatOllama
            return ChatOllama(
                model=self.config.model,
                temperature=self.config.temperature,
            )

    def run(self, input_text: str) -> Dict[str, Any]:
        self.state.status = "running"
        self.memory_manager.add_user_message(input_text)

        try:
            if self.agent_executor:
                result = self.agent_executor.invoke({"input": input_text})
                output = result.get("output", "")
            else:
                messages = [
                    SystemMessage(content=self.config.system_prompt or "You are a helpful assistant."),
                    HumanMessage(content=input_text),
                ]
                response = self.llm.invoke(messages)
                output = response.content

            self.memory_manager.add_ai_message(output)
            self.state.last_run = datetime.utcnow()
            self.state.conversation_history.append({
                "timestamp": self.state.last_run.isoformat(),
                "input": input_text,
                "output": output,
            })
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
                result = await self.agent_executor.ainvoke({"input": input_text})
                output = result.get("output", "")
            else:
                messages = [
                    SystemMessage(content=self.config.system_prompt or "You are a helpful assistant."),
                    HumanMessage(content=input_text),
                ]
                response = await self.llm.ainvoke(messages)
                output = response.content

            self.memory_manager.add_ai_message(output)
            self.state.last_run = datetime.utcnow()
            self.state.conversation_history.append({
                "timestamp": self.state.last_run.isoformat(),
                "input": input_text,
                "output": output,
            })
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
                for chunk in self.agent_executor.stream({"input": input_text}):
                    if "output" in chunk:
                        yield chunk["output"]
                    elif "messages" in chunk:
                        for msg in chunk["messages"]:
                            if hasattr(msg, "content"):
                                yield msg.content
            else:
                messages = [
                    SystemMessage(content=self.config.system_prompt or "You are a helpful assistant."),
                    HumanMessage(content=input_text),
                ]
                response = self.llm.invoke(messages)
                yield response.content

            self.state.last_run = datetime.utcnow()
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
