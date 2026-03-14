from datetime import datetime
import uuid

import pytest


@pytest.mark.asyncio
async def test_agent_status_requires_agent_auth(client, test_agent):
    response = await client.get(f'/api/agents/{test_agent.id}/status')

    assert response.status_code == 401
    assert response.json()['detail'] == 'Missing authorization header'


@pytest.mark.asyncio
async def test_agent_status_returns_authenticated_agent_status(client, db_session, test_agent):
    test_agent.api_key = 'mutx_agent_status_test_key'
    test_agent.status = 'running'
    test_agent.last_heartbeat = datetime.utcnow()
    await db_session.commit()

    response = await client.get(
        f'/api/agents/{test_agent.id}/status',
        headers={'Authorization': f'Bearer {test_agent.api_key}'},
    )

    assert response.status_code == 200

    payload = response.json()
    assert payload['agent_id'] == str(test_agent.id)
    assert payload['status'] == 'running'
    assert payload['last_heartbeat'] is not None
    assert payload['uptime_seconds'] >= 0


@pytest.mark.asyncio
async def test_agent_status_rejects_requests_for_other_agents(
    client, db_session, other_user, test_agent
):
    from src.api.models.models import Agent, AgentStatus

    other_agent = Agent(
        id=uuid.UUID('55555555-5555-4555-a555-555555555555'),
        name='other-agent',
        description='Another test agent',
        config='{"model": "gpt-4"}',
        user_id=other_user.id,
        status=AgentStatus.RUNNING,
        api_key='mutx_agent_other_status_key',
    )
    db_session.add(other_agent)
    await db_session.commit()

    response = await client.get(
        f'/api/agents/{test_agent.id}/status',
        headers={'Authorization': f'Bearer {other_agent.api_key}'},
    )

    assert response.status_code == 403
    assert response.json()['detail'] == 'Agent ID mismatch'


@pytest.mark.asyncio
async def test_runtime_registered_agent_round_trips_metadata_as_json(client):
    metadata = {
        'provider': 'openclaw',
        'model': 'gpt-4.1-mini',
        'flags': {'webhooks': True},
    }

    register_response = await client.post(
        '/api/agents/register',
        json={
            'name': 'runtime-json-agent',
            'description': 'runtime-created agent',
            'metadata': metadata,
            'capabilities': ['heartbeat'],
        },
    )

    assert register_response.status_code == 200
    agent_id = register_response.json()['agent_id']

    detail_response = await client.get(f'/api/agents/{agent_id}')

    assert detail_response.status_code == 200
    assert detail_response.json()['config'] == metadata


@pytest.mark.asyncio
async def test_runtime_registered_agent_api_key_authenticates_status_and_heartbeat(client):
    register_response = await client.post(
        '/api/agents/register',
        json={
            'name': 'runtime-auth-agent',
            'description': 'runtime-created agent',
            'metadata': {'provider': 'openclaw'},
            'capabilities': ['heartbeat'],
        },
    )

    assert register_response.status_code == 200
    payload = register_response.json()
    agent_id = payload['agent_id']
    api_key = payload['api_key']

    status_response = await client.get(
        f'/api/agents/{agent_id}/status',
        headers={'Authorization': f'Bearer {api_key}'},
    )

    assert status_response.status_code == 200
    assert status_response.json()['agent_id'] == agent_id

    heartbeat_response = await client.post(
        '/api/agents/heartbeat',
        headers={'Authorization': f'Bearer {api_key}'},
        json={
            'agent_id': agent_id,
            'status': 'running',
            'message': 'demo heartbeat',
            'timestamp': datetime.utcnow().isoformat(),
        },
    )

    assert heartbeat_response.status_code == 200
    assert heartbeat_response.json()['agent_id'] == agent_id
