from collections.abc import Callable, Sequence
from types import SimpleNamespace
from typing import Any
from unittest.mock import MagicMock

import pytest
from langchain.agents import create_agent
from langchain_core.language_models.fake_chat_models import FakeMessagesListChatModel
from langchain_core.messages import AIMessage
from langchain_core.tools import BaseTool

from src.api.integrations.langchain_agent import (
    AgentConfig,
    LangChainAgent,
    LLMProvider,
    LLMWrapper,
    ToolDefinition,
    ToolFactory,
)
from mutx.adapters.langchain import MutxAgentKit


class ToolCallingFakeModel(FakeMessagesListChatModel):
    """LangChain test model that accepts the tools bound by create_agent."""

    def bind_tools(
        self,
        tools: Sequence[dict[str, Any] | type | Callable[..., Any] | BaseTool],
        *,
        tool_choice: str | None = None,
        **kwargs: Any,
    ) -> "ToolCallingFakeModel":
        return self


@pytest.mark.parametrize(
    ("message", "expected"),
    [
        (
            SimpleNamespace(text=lambda: "legacy callable response", content="fallback"),
            "legacy callable response",
        ),
        (
            SimpleNamespace(
                content=[
                    {"type": "text", "text": "structured "},
                    "response",
                    {"type": "image", "url": "https://example.com/image.png"},
                ]
            ),
            "structured response",
        ),
    ],
)
def test_langchain_agent_extracts_callable_text_and_content_fallback(
    message: Any,
    expected: str,
) -> None:
    assert LangChainAgent._message_text(message) == expected


@pytest.mark.parametrize(
    ("message", "expected"),
    [
        (
            SimpleNamespace(text=lambda: "legacy SDK response", content="fallback"),
            "legacy SDK response",
        ),
        (
            {
                "content": [
                    {"type": "text", "text": "structured "},
                    "SDK response",
                    {"type": "image", "url": "https://example.com/image.png"},
                ]
            },
            "structured SDK response",
        ),
    ],
)
def test_sdk_agent_kit_extracts_callable_text_and_content_fallback(
    message: Any,
    expected: str,
) -> None:
    assert MutxAgentKit._extract_output({"messages": [message]}) == expected


@pytest.mark.asyncio
async def test_langchain_v1_agent_runs_sync_and_async_with_message_state(monkeypatch) -> None:
    model = ToolCallingFakeModel(
        responses=[AIMessage(content="sync response"), AIMessage(content="async response")]
    )
    wrapper = SimpleNamespace(client=model, invoke=model.invoke, ainvoke=model.ainvoke)
    monkeypatch.setattr(LLMWrapper, "create", staticmethod(lambda *_args, **_kwargs: wrapper))

    agent = LangChainAgent(
        AgentConfig(
            name="v1-contract",
            provider=LLMProvider.OPENAI,
            model="fake-model",
            verbose=False,
        )
    )
    agent.initialize()

    sync_result = agent.run("hello")
    async_result = await agent.arun("hello again")

    assert sync_result["success"] is True
    assert sync_result["output"] == "sync response"
    assert async_result["success"] is True
    assert async_result["output"] == "async response"
    assert [message.text for message in agent.memory_manager.get_messages()] == [
        "hello",
        "sync response",
        "hello again",
        "async response",
    ]


def test_langchain_v1_builtin_tool_schemas_accept_model_arguments(monkeypatch) -> None:
    model = ToolCallingFakeModel(responses=[AIMessage(content="unused")])
    wrapper = SimpleNamespace(client=model, invoke=model.invoke, ainvoke=model.ainvoke)
    monkeypatch.setattr(LLMWrapper, "create", staticmethod(lambda *_args, **_kwargs: wrapper))

    agent = LangChainAgent(
        AgentConfig(name="tool-contract", provider=LLMProvider.OPENAI, model="fake-model")
    )
    tools = {tool.name: tool for tool in agent.tools}

    assert tools["calculator"].invoke({"expression": "2 + 3"}) == "5"
    assert tools["get_time"].invoke({}).endswith("+00:00")


def test_langchain_v1_custom_no_arg_tool_keeps_an_explicit_empty_schema() -> None:
    received: list[dict[str, Any]] = []
    tool = ToolFactory.create_tools(
        [
            ToolDefinition(
                name="no_args",
                description="Run without arguments.",
                function=lambda arguments: received.append(arguments) or "done",
            )
        ]
    )[0]

    assert tool.args_schema == {"type": "object", "properties": {}}
    assert tool.args == {}
    assert tool.tool_call_schema["properties"] == {}
    assert tool.invoke({}) == "done"
    assert received == [{}]


def test_sdk_agent_kit_invokes_a_langchain_v1_graph_and_emits_finish_audit() -> None:
    model = ToolCallingFakeModel(responses=[AIMessage(content="sdk response")])
    graph = create_agent(model=model, tools=[])
    kit = MutxAgentKit(
        mutx_api_url="https://api.mutx.dev",
        agent_name="sdk-v1-contract",
        api_key="test-key",
    )
    kit.set_agent_executor(graph)
    kit._callback_handler._http.post = MagicMock()

    try:
        assert kit.arun("hello from the SDK") == "sdk response"
        events = [call.kwargs["json"] for call in kit._callback_handler._http.post.call_args_list]
        assert events == [
            {
                "event_type": "agent_finish",
                "agent_name": "sdk-v1-contract",
                "output": "sdk response",
                "return_values": {"output": "sdk response"},
                "timestamp": events[0]["timestamp"],
                "run_id": None,
                "parent_run_id": None,
            }
        ]
    finally:
        kit._callback_handler._http.close()


def test_sdk_agent_kit_emits_v1_tool_action_and_finish_audit_events() -> None:
    model = ToolCallingFakeModel(
        responses=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "echo",
                        "args": {"value": "audited"},
                        "id": "sdk-audit-call",
                        "type": "tool_call",
                    }
                ],
            ),
            AIMessage(content="audit complete"),
        ]
    )
    echo = ToolFactory.create_tools(
        [
            ToolDefinition(
                name="echo",
                description="Echo a value.",
                function=lambda arguments: arguments["value"],
                parameters={
                    "type": "object",
                    "properties": {"value": {"type": "string"}},
                    "required": ["value"],
                },
            )
        ]
    )[0]
    kit = MutxAgentKit(
        mutx_api_url="https://api.mutx.dev",
        agent_name="sdk-v1-audit-contract",
        api_key="test-key",
    )
    kit.set_agent_executor(create_agent(model=model, tools=[echo]))
    kit._callback_handler._http.post = MagicMock()

    try:
        assert kit.arun("echo audited") == "audit complete"
        events = [call.kwargs["json"] for call in kit._callback_handler._http.post.call_args_list]
        assert [event["event_type"] for event in events] == ["agent_action", "agent_finish"]
        assert events[0]["tool"] == "echo"
        assert events[0]["tool_input"] == {"value": "audited"}
        assert events[0]["run_id"] == "sdk-audit-call"
        assert events[1]["output"] == "audit complete"
    finally:
        kit._callback_handler._http.close()


@pytest.mark.asyncio
async def test_sdk_agent_kit_async_v1_graph_emits_finish_audit() -> None:
    model = ToolCallingFakeModel(responses=[AIMessage(content="async sdk response")])
    kit = MutxAgentKit(
        mutx_api_url="https://api.mutx.dev",
        agent_name="sdk-v1-async-contract",
        api_key="test-key",
    )
    kit.set_agent_executor(create_agent(model=model, tools=[]))
    kit._callback_handler._http.post = MagicMock()

    try:
        assert await kit.arun_async("hello async") == "async sdk response"
        events = [call.kwargs["json"] for call in kit._callback_handler._http.post.call_args_list]
        assert [event["event_type"] for event in events] == ["agent_finish"]
        assert events[0]["output"] == "async sdk response"
    finally:
        kit._callback_handler._http.close()


def test_langchain_v1_graph_routes_tool_calls_through_governance_executor(monkeypatch) -> None:
    model = ToolCallingFakeModel(
        responses=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "calculator",
                        "args": {"expression": "2 + 3"},
                        "id": "governed-call",
                        "type": "tool_call",
                    }
                ],
            ),
            AIMessage(content="The governed result is 5."),
        ]
    )
    wrapper = SimpleNamespace(client=model, invoke=model.invoke, ainvoke=model.ainvoke)
    monkeypatch.setattr(LLMWrapper, "create", staticmethod(lambda *_args, **_kwargs: wrapper))
    captured: dict[str, Any] = {}

    def governed_executor(
        agent_id: str,
        tool_name: str,
        parameters: dict[str, Any],
        handler: Callable[[dict[str, Any]], Any],
    ) -> Any:
        captured.update(
            agent_id=agent_id,
            tool_name=tool_name,
            parameters=parameters,
        )
        return handler(parameters)

    agent = LangChainAgent(
        AgentConfig(
            name="governed-v1-contract",
            provider=LLMProvider.OPENAI,
            model="fake-model",
            tool_executor=governed_executor,
        )
    )
    agent.initialize()

    result = agent.run("calculate two plus three")

    assert result["success"] is True
    assert result["output"] == "The governed result is 5."
    assert captured == {
        "agent_id": agent.agent_id,
        "tool_name": "calculator",
        "parameters": {"expression": "2 + 3"},
    }
