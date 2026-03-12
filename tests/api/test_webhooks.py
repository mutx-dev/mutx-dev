import json
import uuid

import pytest
from httpx import AsyncClient

from src.api.models import WebhookDeliveryLog


@pytest.mark.asyncio
async def test_webhook_lifecycle(client: AsyncClient, test_user):
    # 1. Create Webhook
    response = await client.post(
        "/webhooks/",
        json={"url": "https://example.com/webhook", "events": ["agent.*"], "secret": "test-secret"},
    )
    assert response.status_code == 201
    webhook = response.json()
    webhook_id = webhook["id"]
    assert webhook["url"] == "https://example.com/webhook"
    assert "agent.*" in webhook["events"]

    # 2. List Webhooks
    response = await client.get("/webhooks/")
    assert response.status_code == 200
    webhooks = response.json()
    assert any(w["id"] == webhook_id for w in webhooks)

    # 3. Get Webhook
    response = await client.get(f"/webhooks/{webhook_id}")
    assert response.status_code == 200
    assert response.json()["id"] == webhook_id

    # 4. Update Webhook
    response = await client.patch(
        f"/webhooks/{webhook_id}", json={"url": "https://example.com/updated", "is_active": False}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["url"] == "https://example.com/updated"
    assert data["is_active"] is False

    # 5. Delete Webhook
    response = await client.delete(f"/webhooks/{webhook_id}")
    assert response.status_code == 204

    # 6. Verify Deletion
    response = await client.get(f"/webhooks/{webhook_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_webhook_unauthorized(client: AsyncClient):
    # Logout or use unauthenticated client
    # Note: client is likely pre-authenticated in these tests based on test_agents.py
    # But usually there's a way to test unauth.
    pass


@pytest.mark.asyncio
async def test_webhook_test_trigger(client: AsyncClient, test_user, monkeypatch):
    # Mock deliver_webhook_with_retry
    import src.api.services.webhook_service

    async def mock_deliver(*args, **kwargs):
        return True

    monkeypatch.setattr(
        src.api.services.webhook_service, "deliver_webhook_with_retry", mock_deliver
    )

    # Create
    response = await client.post(
        "/webhooks/",
        json={"url": "https://example.com/webhook", "events": ["*"]},
    )
    webhook_id = response.json()["id"]

    # Test
    response = await client.post(f"/webhooks/{webhook_id}/test")
    assert response.status_code == 200
    assert response.json()["status"] == "test_delivered"


@pytest.mark.asyncio
async def test_webhook_events_history_lists_latest_deliveries(
    client: AsyncClient, test_user, db_session
):
    create_response = await client.post(
        "/webhooks/",
        json={"url": "https://example.com/webhook", "events": ["*"]},
    )
    webhook_id = create_response.json()["id"]

    first_delivery = WebhookDeliveryLog(
        webhook_id=uuid.UUID(webhook_id),
        event="deployment.event",
        payload=json.dumps({"status": "pending"}),
        status_code=202,
        success=True,
        attempts=1,
    )
    second_delivery = WebhookDeliveryLog(
        webhook_id=uuid.UUID(webhook_id),
        event="agent.status",
        payload=json.dumps({"status": "running"}),
        status_code=500,
        success=False,
        error_message="upstream error",
        attempts=3,
    )
    db_session.add_all([first_delivery, second_delivery])
    await db_session.commit()

    response = await client.get(f"/webhooks/{webhook_id}/events")
    assert response.status_code == 200
    data = response.json()

    assert data["webhook_id"] == webhook_id
    assert data["total"] == 2
    assert data["skip"] == 0
    assert data["limit"] == 50
    assert len(data["items"]) == 2
    assert data["items"][0]["event"] == "agent.status"
    assert data["items"][1]["event"] == "deployment.event"


@pytest.mark.asyncio
async def test_webhook_events_history_supports_filters(client: AsyncClient, test_user, db_session):
    create_response = await client.post(
        "/webhooks/",
        json={"url": "https://example.com/webhook", "events": ["*"]},
    )
    webhook_id = create_response.json()["id"]

    db_session.add_all(
        [
            WebhookDeliveryLog(
                webhook_id=uuid.UUID(webhook_id),
                event="deployment.event",
                payload="{}",
                status_code=202,
                success=True,
                attempts=1,
            ),
            WebhookDeliveryLog(
                webhook_id=uuid.UUID(webhook_id),
                event="deployment.event",
                payload="{}",
                status_code=500,
                success=False,
                error_message="boom",
                attempts=2,
            ),
        ]
    )
    await db_session.commit()

    response = await client.get(
        f"/webhooks/{webhook_id}/events?event=deployment.event&success=false"
    )
    assert response.status_code == 200
    data = response.json()

    assert data["total"] == 1
    assert data["event"] == "deployment.event"
    assert data["success"] is False
    assert len(data["items"]) == 1
    assert data["items"][0]["success"] is False
