from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import logging
from typing import Optional

from src.api.database import get_db
from src.api.models import User, Webhook, WebhookDeliveryLog
from src.api.services.webhook_handler import WebhookEventType as WebhookEvent
from src.api.models.schemas import (
    WebhookCreate,
    WebhookUpdate,
    WebhookResponse,
    WebhookDelivery,
)
from src.api.middleware.auth import get_current_user_or_api_key

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)


async def _get_owned_webhook(
    webhook_id: uuid.UUID,
    db: AsyncSession,
    current_user: User,
    *,
    not_found_detail: str = "Webhook not found",
    forbidden_detail: str = "Not authorized to access this webhook",
) -> Webhook:
    result = await db.execute(select(Webhook).where(Webhook.id == webhook_id))
    webhook = result.scalar_one_or_none()

    if not webhook:
        raise HTTPException(status_code=404, detail=not_found_detail)
    if webhook.user_id != current_user.id:
        raise HTTPException(status_code=403, detail=forbidden_detail)

    return webhook


async def get_webhook_auth(
    authorization: Optional[str] = Header(None, description="Bearer token for JWT auth"),
    x_api_key: Optional[str] = Header(
        None, alias="X-API-Key", description="API key for webhook management"
    ),
    session: AsyncSession = Depends(get_db),
) -> User:
    """Authenticate webhook management requests via JWT or API key."""
    user = await get_current_user_or_api_key(authorization, x_api_key, session)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication. Provide valid JWT Bearer token or X-API-Key header.",
        )
    return user


@router.post("/", response_model=WebhookResponse, status_code=201)
async def create_webhook(
    webhook_data: WebhookCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_webhook_auth),
):
    """Register a new webhook endpoint."""
    # Validate URL format
    if not webhook_data.url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")

    # Validate events
    allowed_events = [e.value for e in WebhookEvent]
    for event in webhook_data.events:
        if event == "*":
            continue

        if event not in allowed_events:
            # Check for prefix.* wildcards
            if not any(
                event.startswith(p.split(".")[0] + ".*") for p in allowed_events if "." in p
            ):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid event: {event}. Supported events: {allowed_events} and '*'",
                )

    webhook = Webhook(
        user_id=current_user.id,
        url=webhook_data.url,
        events=webhook_data.events,
        secret=webhook_data.secret,
        is_active=True,
    )
    db.add(webhook)
    await db.commit()
    await db.refresh(webhook)

    logger.info(f"Webhook created: {webhook.id} for user {current_user.id}")
    return webhook


@router.get("/", response_model=list[WebhookResponse])
async def list_webhooks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_webhook_auth),
):
    """List all webhooks registered by the authenticated user."""
    result = await db.execute(select(Webhook).where(Webhook.user_id == current_user.id))
    webhooks = result.scalars().all()
    return webhooks


@router.get("/{webhook_id}", response_model=WebhookResponse)
async def get_webhook(
    webhook_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_webhook_auth),
):
    """Get a specific webhook by ID."""
    webhook = await _get_owned_webhook(webhook_id, db, current_user)
    return webhook


@router.patch("/{webhook_id}", response_model=WebhookResponse)
async def update_webhook(
    webhook_id: uuid.UUID,
    webhook_data: WebhookUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_webhook_auth),
):
    """Update an existing webhook."""
    webhook = await _get_owned_webhook(webhook_id, db, current_user)

    # Update fields if provided
    if webhook_data.url is not None:
        if not webhook_data.url.startswith(("http://", "https://")):
            raise HTTPException(status_code=400, detail="URL must start with http:// or https://")
        webhook.url = webhook_data.url

    if webhook_data.events is not None:
        allowed_events = [e.value for e in WebhookEvent]
        for event in webhook_data.events:
            if event == "*":
                continue

            if event not in allowed_events:
                # Check for prefix.* wildcards
                if not any(
                    event.startswith(p.split(".")[0] + ".*") for p in allowed_events if "." in p
                ):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid event: {event}. Supported events: {allowed_events} and '*'",
                    )
        webhook.events = webhook_data.events

    if webhook_data.is_active is not None:
        webhook.is_active = webhook_data.is_active

    await db.commit()
    await db.refresh(webhook)

    logger.info(f"Webhook updated: {webhook.id}")
    return webhook


@router.delete("/{webhook_id}", status_code=204)
async def delete_webhook(
    webhook_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_webhook_auth),
):
    """Delete a webhook."""
    webhook = await _get_owned_webhook(webhook_id, db, current_user)

    await db.delete(webhook)
    await db.commit()

    logger.info(f"Webhook deleted: {webhook_id}")
    return None


@router.post("/{webhook_id}/test")
async def test_webhook(
    webhook_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_webhook_auth),
):
    """Send a test event to a webhook to verify it's working."""
    webhook = await _get_owned_webhook(webhook_id, db, current_user)

    # Import the delivery function
    from src.api.services.webhook_service import deliver_webhook_with_retry
    import aiohttp

    test_payload = {
        "message": "This is a test webhook from MUTX",
        "event": "test",
    }

    async with aiohttp.ClientSession() as session:
        success = await deliver_webhook_with_retry(session, db, webhook, "test", test_payload)

    if success:
        return {"status": "test_delivered", "message": "Test event delivered successfully"}
    else:
        raise HTTPException(
            status_code=502,
            detail="Test event delivery failed. Check webhook URL and ensure it's reachable.",
        )


@router.get("/{webhook_id}/deliveries", response_model=list[WebhookDelivery])
async def list_webhook_deliveries(
    webhook_id: uuid.UUID,
    event: Optional[str] = None,
    success: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_webhook_auth),
):
    """List delivery attempts for a webhook owned by the authenticated user."""
    webhook = await _get_owned_webhook(webhook_id, db, current_user)

    query = (
        select(WebhookDeliveryLog)
        .where(WebhookDeliveryLog.webhook_id == webhook.id)
        .order_by(WebhookDeliveryLog.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    if event is not None:
        query = query.where(WebhookDeliveryLog.event == event)
    if success is not None:
        query = query.where(WebhookDeliveryLog.success == success)

    result = await db.execute(query)
    return result.scalars().all()
