import pytest
from httpx import AsyncClient
import uuid
from datetime import datetime, timedelta

from src.api.auth.jwt import create_access_token
from src.api.models.models import Webhook, WebhookDeliveryLog
from src.api.services.webhook_service import trigger_webhook_event


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
@pytest.mark.parametrize(
    "event_name",
    ["agent.heartbeat", "agent.status", "agent.status_update"],
)
async def test_webhook_create_accepts_runtime_status_event_names(
    client: AsyncClient, event_name: str
):
    response = await client.post(
        "/webhooks/",
        json={"url": "https://example.com/webhook", "events": [event_name]},
    )

    assert response.status_code == 201
    assert response.json()["events"] == [event_name]


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
async def test_trigger_webhook_event_scopes_delivery_to_user(
    db_session, test_user, other_user, monkeypatch
):
    import src.api.services.webhook_service as webhook_service

    test_user_webhook = Webhook(
        user_id=test_user.id,
        url="https://example.com/test-user",
        events=["agent.status"],
        is_active=True,
    )
    other_user_webhook = Webhook(
        user_id=other_user.id,
        url="https://example.com/other-user",
        events=["agent.status"],
        is_active=True,
    )
    db_session.add_all([test_user_webhook, other_user_webhook])
    await db_session.commit()

    delivered_user_ids: list[uuid.UUID] = []

    async def mock_deliver(_session, _db, webhook, _event, _payload):
        delivered_user_ids.append(webhook.user_id)
        return True

    monkeypatch.setattr(webhook_service, "deliver_webhook_with_retry", mock_deliver)

    success_count = await trigger_webhook_event(
        db_session,
        "agent.status",
        {"agent_id": "33333333-3333-4333-a333-333333333333"},
        user_id=test_user.id,
    )

    assert success_count == 1
    assert delivered_user_ids == [test_user.id]


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
async def test_webhook_delivery_history_honors_skip_limit_and_desc_order(
    client: AsyncClient, db_session
):
    create_response = await client.post(
        "/webhooks/",
        json={"url": "https://example.com/webhook", "events": ["*"]},
    )
    assert create_response.status_code == 201
    webhook_id = uuid.UUID(create_response.json()["id"])

    now = datetime.now()
    db_session.add_all(
        [
            WebhookDeliveryLog(
                webhook_id=webhook_id,
                event="agent.status",
                payload='{"seq":1}',
                success=True,
                attempts=1,
                created_at=now - timedelta(minutes=3),
            ),
            WebhookDeliveryLog(
                webhook_id=webhook_id,
                event="agent.status",
                payload='{"seq":2}',
                success=False,
                attempts=1,
                created_at=now - timedelta(minutes=2),
            ),
            WebhookDeliveryLog(
                webhook_id=webhook_id,
                event="agent.status",
                payload='{"seq":3}',
                success=True,
                attempts=1,
                created_at=now - timedelta(minutes=1),
            ),
        ]
    )
    await db_session.commit()

    response = await client.get(f"/webhooks/{webhook_id}/deliveries?skip=1&limit=1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["payload"] == '{"seq":2}'
    assert data[0]["success"] is False


@pytest.mark.asyncio
async def test_webhook_delivery_history_rejects_invalid_pagination_bounds(client: AsyncClient):
    create_response = await client.post(
        "/webhooks/",
        json={"url": "https://example.com/webhook", "events": ["*"]},
    )
    assert create_response.status_code == 201
    webhook_id = create_response.json()["id"]

    negative_skip = await client.get(f"/webhooks/{webhook_id}/deliveries?skip=-1")
    assert negative_skip.status_code == 422

    zero_limit = await client.get(f"/webhooks/{webhook_id}/deliveries?limit=0")
    assert zero_limit.status_code == 422

    oversized_limit = await client.get(f"/webhooks/{webhook_id}/deliveries?limit=501")
    assert oversized_limit.status_code == 422


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
async def test_webhook_delivery_history_supports_managed_api_key_auth(
    client_no_auth: AsyncClient, db_session, test_user
):
    access_token, _ = create_access_token(test_user.id)

    create_response = await client_no_auth.post(
        "/webhooks/",
        json={"url": "https://example.com/webhook", "events": ["*"]},
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert create_response.status_code == 201
    webhook_id = uuid.UUID(create_response.json()["id"])

    key_response = await client_no_auth.post(
        "/api-keys",
        json={"name": "managed-webhook-key"},
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert key_response.status_code == 201
    managed_api_key = key_response.json()["key"]

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
        headers={"X-API-Key": managed_api_key},
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
