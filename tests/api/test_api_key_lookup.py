import uuid

import pytest

from src.api.middleware.auth import get_current_agent
from src.api.models.models import APIKey, Agent, AgentStatus, User
from src.api.services.user_service import (
    UserService,
    extract_api_key_prefix,
    generate_agent_api_key,
    generate_api_key,
    hash_api_key,
)


@pytest.mark.asyncio
async def test_authenticate_api_key_uses_prefixed_lookup(db_session):
    user = User(
        id=uuid.uuid4(),
        email="prefixed@mutx.dev",
        name="Prefixed User",
        is_active=True,
        is_email_verified=True,
    )
    db_session.add(user)
    await db_session.flush()

    plain_key, key_prefix = generate_api_key()
    managed_key = APIKey(
        id=uuid.uuid4(),
        user_id=user.id,
        key_hash=hash_api_key(plain_key),
        key_prefix=key_prefix,
        name="prefixed-key",
        is_active=True,
    )
    db_session.add(managed_key)
    await db_session.commit()

    auth_context = await UserService(db_session).authenticate_api_key(plain_key)

    assert auth_context == (user, managed_key.id)


@pytest.mark.asyncio
async def test_authenticate_api_key_keeps_legacy_null_prefix_compatibility(db_session):
    user = User(
        id=uuid.uuid4(),
        email="legacy@mutx.dev",
        name="Legacy User",
        is_active=True,
        is_email_verified=True,
    )
    db_session.add(user)
    await db_session.flush()

    plain_key = "mutx_live_legacy_example"
    managed_key = APIKey(
        id=uuid.uuid4(),
        user_id=user.id,
        key_hash=hash_api_key(plain_key),
        key_prefix=None,
        name="legacy-key",
        is_active=True,
    )
    db_session.add(managed_key)
    await db_session.commit()

    auth_context = await UserService(db_session).authenticate_api_key(plain_key)

    assert auth_context == (user, managed_key.id)


@pytest.mark.asyncio
async def test_get_current_agent_authenticates_prefixed_runtime_key(db_session):
    user = User(
        id=uuid.uuid4(),
        email="agent-owner@mutx.dev",
        name="Agent Owner",
        is_active=True,
        is_email_verified=True,
    )
    db_session.add(user)
    await db_session.flush()

    agent = Agent(
        id=uuid.uuid4(),
        user_id=user.id,
        name="prefixed-agent",
        description="",
        status=AgentStatus.RUNNING,
    )
    plain_key, api_key_prefix = generate_agent_api_key(agent.id)
    agent.api_key = hash_api_key(plain_key)
    agent.api_key_prefix = api_key_prefix
    db_session.add(agent)
    await db_session.commit()

    authenticated_agent = await get_current_agent(
        authorization=f"Bearer {plain_key}",
        session=db_session,
    )

    assert authenticated_agent.id == agent.id


def test_generate_api_key_embeds_indexable_prefix():
    plain_key, key_prefix = generate_api_key()

    assert plain_key.startswith("mutx_live_")
    assert extract_api_key_prefix(plain_key) == key_prefix
