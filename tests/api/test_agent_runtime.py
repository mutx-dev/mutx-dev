import pytest


@pytest.mark.asyncio
async def test_get_agent_status_requires_auth(client_no_auth, test_agent):
    response = await client_no_auth.get(f"/agents/{test_agent.id}/status")
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing authorization header"


@pytest.mark.asyncio
async def test_get_agent_status_requires_ownership(other_user_client, test_agent):
    response = await other_user_client.get(f"/agents/{test_agent.id}/status")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_agent_status_happy_path(client, test_agent):
    response = await client.get(f"/agents/{test_agent.id}/status")
    assert response.status_code == 200
    payload = response.json()
    assert payload["agent_id"] == str(test_agent.id)
    assert payload["status"] == test_agent.status
