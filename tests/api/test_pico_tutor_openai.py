import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select

from src.api.models import UserSetting
from src.api.services.pico_tutor_openai import (
    PICO_TUTOR_OPENAI_KEY,
    resolve_pico_tutor_api_key,
)


@pytest_asyncio.fixture(autouse=True)
async def starter_plan(db_session, test_user):
    test_user.plan = "STARTER"
    db_session.add(test_user)
    await db_session.commit()
    await db_session.refresh(test_user)
    yield


@pytest.mark.asyncio
async def test_pico_tutor_openai_connection_roundtrip(
    client: AsyncClient,
    db_session,
    test_user,
    monkeypatch: pytest.MonkeyPatch,
):
    async def fake_validate_openai_api_key(api_key: str) -> None:
        assert api_key.endswith("1234")

    monkeypatch.setattr(
        "src.api.services.pico_tutor_openai.validate_openai_api_key",
        fake_validate_openai_api_key,
    )

    status_response = await client.get("/v1/pico/tutor/openai")
    assert status_response.status_code == 200
    assert status_response.json()["status"] in {"disconnected", "platform"}

    connect_response = await client.put(
        "/v1/pico/tutor/openai",
        json={"apiKey": "sk-proj-test-openai-connection-1234"},
    )
    assert connect_response.status_code == 200
    connected = connect_response.json()
    assert connected["connected"] is True
    assert connected["source"] == "user"
    assert connected["maskedKey"].endswith("1234")

    result = await db_session.execute(
        select(UserSetting).where(
            UserSetting.user_id == test_user.id,
            UserSetting.key == PICO_TUTOR_OPENAI_KEY,
        )
    )
    setting = result.scalar_one()
    assert setting.value["api_key_encrypted"] != "sk-proj-test-openai-connection-1234"
    assert setting.value["api_key_encrypted"].startswith("enc:")

    disconnect_response = await client.delete("/v1/pico/tutor/openai")
    assert disconnect_response.status_code == 200
    assert disconnect_response.json()["connected"] is False


@pytest.mark.asyncio
async def test_pico_tutor_openai_connection_requires_authentication(client_no_auth: AsyncClient):
    response = await client_no_auth.get("/v1/pico/tutor/openai")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_pico_tutor_prefers_connected_user_key_over_platform_key(
    client: AsyncClient,
    db_session,
    test_user,
    monkeypatch: pytest.MonkeyPatch,
):
    async def fake_validate_openai_api_key(_api_key: str) -> None:
        return None

    monkeypatch.setattr(
        "src.api.services.pico_tutor_openai.validate_openai_api_key",
        fake_validate_openai_api_key,
    )
    monkeypatch.setenv("OPENAI_API_KEY", "platform-openai-key")

    connect_response = await client.put(
        "/v1/pico/tutor/openai",
        json={"apiKey": "sk-proj-user-owned-openai-key-9999"},
    )
    assert connect_response.status_code == 200

    api_key, source = await resolve_pico_tutor_api_key(db_session, user=test_user)
    assert api_key == "sk-proj-user-owned-openai-key-9999"
    assert source == "user"
