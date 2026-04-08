import pytest

from src.runtime.adapters.openai import OpenAIAdapter, OpenAIConfig


class _FakeCompletions:
    def __init__(self, responses):
        self._responses = list(responses)

    async def create(self, **kwargs):
        result = self._responses.pop(0)
        if isinstance(result, Exception):
            raise result
        return result


class _FakeClient:
    def __init__(self, responses):
        self.chat = type("_Chat", (), {"completions": _FakeCompletions(responses)})()

    async def close(self):
        return None


@pytest.mark.asyncio
async def test_create_completion_records_success_after_retry():
    adapter = OpenAIAdapter(
        OpenAIConfig(model="gpt-4o"),
        client=_FakeClient([RuntimeError("temporary"), object()]),
    )

    response = await adapter._create_completion(
        messages=[{"role": "user", "content": "hello"}],
        tools=[],
        stream=False,
    )

    assert response is not None
    assert adapter._circuit_breaker.failures == 0
    assert adapter._circuit_breaker.state == "closed"
