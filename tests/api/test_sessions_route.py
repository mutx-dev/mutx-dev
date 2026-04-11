import pytest
from httpx import AsyncClient

import src.api.routes.sessions as sessions_mod


@pytest.mark.asyncio
async def test_sessions_route_requires_auth_for_list(client_no_auth: AsyncClient):
    response = await client_no_auth.get('/v1/sessions')

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_sessions_route_requires_auth_for_actions_and_delete(client_no_auth: AsyncClient):
    create_response = await client_no_auth.post(
        '/v1/sessions?action=set-thinking',
        json={'session_key': 'test-session', 'level': 'high'},
    )
    delete_response = await client_no_auth.request(
        'DELETE',
        '/v1/sessions',
        json={'session_key': 'test-session'},
    )

    assert create_response.status_code == 401
    assert delete_response.status_code == 401


@pytest.mark.asyncio
async def test_sessions_route_validates_verbose_level_before_gateway_call(
    client: AsyncClient,
    monkeypatch,
):
    called = False

    async def fake_call_gateway(*args, **kwargs):
        nonlocal called
        called = True
        return {'message': 'should not happen'}

    monkeypatch.setattr(sessions_mod, '_call_gateway', fake_call_gateway)

    response = await client.post(
        '/v1/sessions?action=set-verbose',
        json={'session_key': 'test-session', 'level': 'loud'},
    )

    assert response.status_code == 400
    assert 'Invalid verbose level' in response.json()['detail']
    assert called is False


@pytest.mark.asyncio
async def test_sessions_route_validates_reasoning_level_before_gateway_call(
    client: AsyncClient,
    monkeypatch,
):
    called = False

    async def fake_call_gateway(*args, **kwargs):
        nonlocal called
        called = True
        return {'message': 'should not happen'}

    monkeypatch.setattr(sessions_mod, '_call_gateway', fake_call_gateway)

    response = await client.post(
        '/v1/sessions?action=set-reasoning',
        json={'session_key': 'test-session', 'level': 'turbo'},
    )

    assert response.status_code == 400
    assert 'Invalid reasoning level' in response.json()['detail']
    assert called is False


@pytest.mark.asyncio
async def test_sessions_route_validates_label_length_before_gateway_call(
    client: AsyncClient,
    monkeypatch,
):
    called = False

    async def fake_call_gateway(*args, **kwargs):
        nonlocal called
        called = True
        return {'message': 'should not happen'}

    monkeypatch.setattr(sessions_mod, '_call_gateway', fake_call_gateway)

    response = await client.post(
        '/v1/sessions?action=set-label',
        json={'session_key': 'test-session', 'label': 'x' * 101},
    )

    assert response.status_code == 400
    assert response.json()['detail'] == 'Label must be a string up to 100 characters'
    assert called is False


@pytest.mark.asyncio
async def test_sessions_route_forwards_set_label_action_to_gateway(
    client: AsyncClient,
    monkeypatch,
):
    captured: dict[str, object] = {}

    async def fake_call_gateway(method: str, path: str, json=None, params=None):
        captured.update({'method': method, 'path': path, 'json': json, 'params': params})
        return {'detail': 'label updated'}

    monkeypatch.setattr(sessions_mod, '_call_gateway', fake_call_gateway)

    response = await client.post(
        '/v1/sessions?action=set-label',
        json={'session_key': 'test-session', 'label': 'Important run'},
    )

    assert response.status_code == 200
    assert captured == {
        'method': 'PATCH',
        'path': '/api/sessions/label',
        'json': {'session': 'test-session', 'label': 'Important run'},
        'params': None,
    }
    assert response.json() == {
        'session_key': 'test-session',
        'action': 'set-label',
        'applied': True,
        'detail': 'label updated',
    }
