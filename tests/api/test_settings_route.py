from __future__ import annotations

import pytest
from sqlalchemy import select

from src.api.models import UserSetting
from src.api.routes import settings as settings_routes


@pytest.mark.asyncio
async def test_get_settings_returns_subscription_interface_mode_and_org_name(
    client,
    db_session,
    test_user,
):
    test_user.plan = "PRO"
    await db_session.commit()

    response = await client.get("/v1/settings")

    assert response.status_code == 200
    payload = response.json()
    assert payload["org_name"] == test_user.name
    assert payload["interface_mode"] == "full"
    assert payload["subscription"] == "pro"


@pytest.mark.asyncio
async def test_patch_settings_persists_interface_mode_in_user_settings(
    client,
    db_session,
    test_user,
):
    response = await client.patch(
        "/v1/settings",
        json={"interface_mode": "essential"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["interface_mode"] == "essential"
    assert payload["org_name"] == test_user.name

    result = await db_session.execute(
        select(UserSetting).where(
            UserSetting.user_id == test_user.id,
            UserSetting.key == settings_routes.INTERFACE_MODE_SETTING_KEY,
        )
    )
    setting = result.scalar_one_or_none()
    assert setting is not None
    assert setting.value == {"interface_mode": "essential"}

    follow_up = await client.get("/v1/settings")
    assert follow_up.status_code == 200
    assert follow_up.json()["interface_mode"] == "essential"


@pytest.mark.asyncio
async def test_get_settings_reads_existing_interface_mode_dict(client, db_session, test_user):
    db_session.add(
        UserSetting(
            user_id=test_user.id,
            key=settings_routes.INTERFACE_MODE_SETTING_KEY,
            value={"interface_mode": "essential"},
        )
    )
    await db_session.commit()

    response = await client.get("/v1/settings")

    assert response.status_code == 200
    assert response.json()["interface_mode"] == "essential"

@pytest.mark.asyncio
async def test_settings_requires_authentication(client_no_auth):
    response = await client_no_auth.get("/v1/settings")

    assert response.status_code == 401
