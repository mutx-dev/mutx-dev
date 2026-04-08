"""Unit tests for the Anthropic runtime adapter."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace

from src.runtime.adapters import anthropic as anthropic_module


class _ConcreteAnthropicAdapter(anthropic_module.AnthropicAdapter):
    async def shutdown(self) -> None:
        return None


class _FakeMessages:
    def __init__(self, responses):
        self._responses = list(responses)
        self.calls = 0

    async def create(self, **kwargs):
        response = self._responses[self.calls]
        self.calls += 1
        return response


class _FakeClient:
    def __init__(self, responses):
        self.messages = _FakeMessages(responses)


def _tool_use_block(call_id: str) -> SimpleNamespace:
    return SimpleNamespace(
        type="tool_use",
        id=call_id,
        name="lookup",
        input={"q": "value"},
        text="",
    )


def test_execute_respects_max_tool_roundtrips_limit(monkeypatch):
    fake_client = _FakeClient([])
    monkeypatch.setattr(anthropic_module, "AsyncAnthropic", lambda **_: fake_client)

    config = anthropic_module.AnthropicConfig(model="claude-test", max_tool_roundtrips=1)
    adapter = _ConcreteAnthropicAdapter(config)

    responses = [
        SimpleNamespace(content=[_tool_use_block("call-1")]),
        SimpleNamespace(content=[_tool_use_block("call-2")]),
    ]
    adapter._client = _FakeClient(responses)

    call_count = 0

    async def lookup_handler(args):
        nonlocal call_count
        call_count += 1
        return {"ok": True, "args": args}

    result = asyncio.run(
        adapter.execute(
            [{"role": "user", "content": "test"}],
            tool_handlers={"lookup": lookup_handler},
            max_tool_roundtrips=1,
        )
    )

    assert call_count == 1
    assert result["tool_calls"]
    assert result["tool_calls"][0]["id"] == "call-2"
