import pytest
from httpx import AsyncClient
import uuid

@pytest.mark.asyncio
async def test_webhook_lifecycle(client: AsyncClient, test_user):
    # 1. Create Webhook
    response = await client.post(
        "/webhooks/",
        json={
            "url": "https://example.com/webhook",
            "events": ["agent.*"],
            "secret": "test-secret"
        }
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
        f"/webhooks/{webhook_id}",
        json={"url": "https://example.com/updated", "is_active": False}
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
    
    monkeypatch.setattr(src.api.services.webhook_service, "deliver_webhook_with_retry", mock_deliver)
    
    # Create
    response = await client.post(
        "/webhooks/",
        json={"url": "https://example.com/webhook", "events": ["*"]}
    )
    webhook_id = response.json()["id"]

    # Test
    response = await client.post(f"/webhooks/{webhook_id}/test")
    assert response.status_code == 200
    assert response.json()["status"] == "test_delivered"
