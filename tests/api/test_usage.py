"""Tests for usage event API"""
import uuid

import pytest


@pytest.mark.asyncio
async def test_create_usage_event(client, test_user):
    """Test creating a usage event."""
    response = await client.post(
        "/v1/usage/events",
        json={
            "event_type": "api_call",
            "resource_id": "agent-123",
            "metadata": {"model": "gpt-4.1-mini", "tokens": 150},
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["event_type"] == "api_call"
    assert payload["resource_id"] == "agent-123"
    assert payload["user_id"] == str(test_user.id)


@pytest.mark.asyncio
async def test_list_usage_events(client, test_user, db_session):
    """Test listing usage events."""
    from src.api.models.models import UsageEvent
    from datetime import datetime, timezone

    # Create test events
    event1 = UsageEvent(
        event_type="api_call",
        user_id=test_user.id,
        resource_id="agent-1",
        created_at=datetime.now(timezone.utc),
    )
    event2 = UsageEvent(
        event_type="deployment",
        user_id=test_user.id,
        resource_id="agent-2",
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(event1)
    db_session.add(event2)
    await db_session.commit()

    response = await client.get("/v1/usage/events")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 2
    assert len(payload["items"]) == 2


@pytest.mark.asyncio
async def test_list_usage_events_filter_by_type(client, test_user, db_session):
    """Test filtering usage events by event_type."""
    from src.api.models.models import UsageEvent
    from datetime import datetime, timezone

    event1 = UsageEvent(
        event_type="api_call",
        user_id=test_user.id,
        resource_id="agent-1",
        created_at=datetime.now(timezone.utc),
    )
    event2 = UsageEvent(
        event_type="deployment",
        user_id=test_user.id,
        resource_id="agent-2",
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(event1)
    db_session.add(event2)
    await db_session.commit()

    response = await client.get("/v1/usage/events?event_type=api_call")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["event_type"] == "api_call"


@pytest.mark.asyncio
async def test_get_usage_event(client, test_user, db_session):
    """Test getting a specific usage event."""
    from src.api.models.models import UsageEvent
    from datetime import datetime, timezone

    event = UsageEvent(
        event_type="api_call",
        user_id=test_user.id,
        resource_id="agent-1",
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(event)
    await db_session.commit()
    await db_session.refresh(event)

    response = await client.get(f"/v1/usage/events/{event.id}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == str(event.id)
    assert payload["event_type"] == "api_call"


@pytest.mark.asyncio
async def test_get_usage_event_not_found(client, test_user):
    """Test 404 for non-existent usage event."""
    fake_id = uuid.uuid4()
    response = await client.get(f"/v1/usage/events/{fake_id}")

    assert response.status_code == 404
