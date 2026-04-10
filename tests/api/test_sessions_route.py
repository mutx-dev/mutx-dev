import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_sessions_route_is_mounted_and_returns_valid_state(client: AsyncClient):
    response = await client.get("/v1/sessions")

    assert response.status_code == 200
    data = response.json()
    assert "sessions" in data
    assert isinstance(data["sessions"], list)
    # Each session, if present, should have required fields
    for session in data["sessions"]:
        assert "id" in session
        assert "source" in session
