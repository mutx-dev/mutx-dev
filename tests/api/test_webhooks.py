import pytest
from httpx import AsyncClient
import uuid

from src.api.models.models import WebhookDeliveryLog


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
async def test_webhook_list_honors_skip_and_limit(client: AsyncClient):
    for idx in range(3):
        response = await client.post(
            "/webhooks/",
            json={
                "url": f"https://example.com/webhook-{idx}",
                "events": ["agent.*"]
            }
        )
        assert response.status_code == 201

    full_response = await client.get("/webhooks/")
    assert full_response.status_code == 200
    assert len(full_response.json()) == 3

    limited_response = await client.get("/webhooks/?limit=1")
    assert limited_response.status_code == 200
    assert len(limited_response.json()) == 1

    skipped_response = await client.get("/webhooks/?skip=1&limit=10")
    assert skipped_response.status_code == 200
    assert len(skipped_response.json()) == 2

@pytest.mark.asyncio
async def test_webhook_unauthorized(client_no_auth: AsyncClient):
    response = await client_no_auth.get("/webhooks/")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_webhook_other_user_forbidden(
    client: AsyncClient, other_user_client: AsyncClient, test_user
):
    response = await client.post(
        "/webhooks/",
        json={
            "url": "https://example.com/webhook",
            "events": ["agent.*"],
            "secret": "test-secret",
        },
    )
    assert response.status_code == 201
    webhook_id = response.json()["id"]

    get_response = await other_user_client.get(f"/webhooks/{webhook_id}")
    assert get_response.status_code == 403

    patch_response = await other_user_client.patch(
        f"/webhooks/{webhook_id}",
        json={"url": "https://example.com/hijacked"},
    )
    assert patch_response.status_code == 403

    delete_response = await other_user_client.delete(f"/webhooks/{webhook_id}")
    assert delete_response.status_code == 403

    test_response = await other_user_client.post(f"/webhooks/{webhook_id}/test")
    assert test_response.status_code == 403


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
        "/webhooks/", json={"url": "https://example.com/webhook", "events": ["*"]}
    )
    webhook_id = response.json()["id"]

    # Test
    response = await client.post(f"/webhooks/{webhook_id}/test")
    assert response.status_code == 200
    assert response.json()["status"] == "test_delivered"


@pytest.mark.asyncio
async def test_webhook_delivery_history_filters(client: AsyncClient, db_session, test_user):
    create_response = await client.post(
        "/webhooks/",
        json={"url": "https://example.com/webhook", "events": ["*"]},
    )
    assert create_response.status_code == 201
    webhook_id = uuid.UUID(create_response.json()["id"])

    db_session.add_all(
        [
            WebhookDeliveryLog(
                webhook_id=webhook_id,
                event="deployment.event",
                payload='{"status":"running"}',
                success=True,
                attempts=1,
            ),
            WebhookDeliveryLog(
                webhook_id=webhook_id,
                event="agent.status",
                payload='{"new_status":"failed"}',
                success=False,
                error_message="boom",
                attempts=2,
            ),
        ]
    )
    await db_session.commit()

    response = await client.get(
        f"/webhooks/{webhook_id}/deliveries?event=agent.status&success=false"
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["event"] == "agent.status"
    assert data[0]["success"] is False


@pytest.mark.asyncio
async def test_webhook_delivery_history_supports_legacy_user_api_key_auth(
    client: AsyncClient, client_no_auth: AsyncClient, db_session, test_user
):
    create_response = await client.post(
        "/webhooks/",
        json={"url": "https://example.com/webhook", "events": ["*"]},
    )
    assert create_response.status_code == 201
    webhook_id = uuid.UUID(create_response.json()["id"])

    test_user.api_key = "legacy-webhook-key"
    db_session.add(test_user)
    db_session.add(
        WebhookDeliveryLog(
            webhook_id=webhook_id,
            event="agent.heartbeat",
            payload='{"status":"running"}',
            success=True,
            attempts=1,
        )
    )
    await db_session.commit()

    response = await client_no_auth.get(
        f"/webhooks/{webhook_id}/deliveries",
        headers={"X-API-Key": "legacy-webhook-key"},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["event"] == "agent.heartbeat"


@pytest.mark.asyncio
async def test_webhook_delivery_history_other_user_forbidden(
    client: AsyncClient, other_user_client: AsyncClient, db_session, test_user
):
    create_response = await client.post(
        "/webhooks/",
        json={"url": "https://example.com/webhook", "events": ["*"]},
    )
    assert create_response.status_code == 201
    webhook_id = uuid.UUID(create_response.json()["id"])

    db_session.add(
        WebhookDeliveryLog(
            webhook_id=webhook_id,
            event="agent.status",
            payload='{"new_status":"running"}',
            success=True,
            attempts=1,
        )
    )
    await db_session.commit()

    response = await other_user_client.get(f"/webhooks/{webhook_id}/deliveries")
    assert response.status_code == 403
