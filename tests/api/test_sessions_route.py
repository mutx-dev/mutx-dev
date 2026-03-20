import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_sessions_route_is_mounted_and_returns_empty_state(client: AsyncClient):
    response = await client.get("/v1/sessions")

    assert response.status_code == 200
    assert response.json() == {"sessions": []}
