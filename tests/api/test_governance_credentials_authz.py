import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_credential_backends_internal_user(client: AsyncClient):
    response = await client.get("/v1/governance/credentials/backends")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_list_credential_backends_non_internal_forbidden(other_user_client: AsyncClient):
    response = await other_user_client.get("/v1/governance/credentials/backends")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_credential_non_internal_forbidden(other_user_client: AsyncClient):
    response = await other_user_client.get("/v1/governance/credentials/get/vault:/secret/test")
    assert response.status_code == 403
