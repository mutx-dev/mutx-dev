import pytest

from src.api.services import gateway_client


class _Decision:
    def __init__(self, outcome: str, effect: str, reason: str | None = None, reason_code: str | None = None):
        self.outcome = outcome
        self.effect = effect
        self.reason = reason
        self.reason_code = reason_code


@pytest.mark.asyncio
async def test_call_gateway_method_governed_blocks_deferred_decision(monkeypatch):
    from cli import faramesh_runtime

    monkeypatch.setattr(
        faramesh_runtime,
        'gate_decide',
        lambda **kwargs: _Decision(
            outcome='ABSTAIN',
            effect='DEFER',
            reason='approval required',
            reason_code='approval_pending',
        ),
    )

    async def _unexpected_call(*args, **kwargs):
        raise AssertionError('gateway call should not run for deferred governance decision')

    monkeypatch.setattr(gateway_client, 'call_gateway_method', _unexpected_call)

    with pytest.raises(gateway_client.GovernanceError) as excinfo:
        await gateway_client.call_gateway_method_governed(
            method='sensitive.action',
            params={'amount': 42},
            agent_id='agent-1',
            governance_enabled=True,
        )

    assert excinfo.value.reason == 'approval required'
    assert excinfo.value.reason_code == 'approval_pending'


@pytest.mark.asyncio
async def test_call_gateway_method_governed_allows_permit_decision(monkeypatch):
    from cli import faramesh_runtime

    monkeypatch.setattr(
        faramesh_runtime,
        'gate_decide',
        lambda **kwargs: _Decision(outcome='EXECUTE', effect='PERMIT'),
    )

    async def _mock_call_gateway_method(method, params, timeout_ms):
        return {'method': method, 'params': params, 'timeout_ms': timeout_ms}

    monkeypatch.setattr(gateway_client, 'call_gateway_method', _mock_call_gateway_method)

    result = await gateway_client.call_gateway_method_governed(
        method='safe.action',
        params={'ok': True},
        agent_id='agent-1',
        governance_enabled=True,
        timeout_ms=1234,
    )

    assert result == {'method': 'safe.action', 'params': {'ok': True}, 'timeout_ms': 1234}
