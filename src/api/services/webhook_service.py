"""
Webhook delivery service for MUTX.

Handles:
- Webhook registration CRUD
- Event delivery with retry logic
- Signature generation for payload verification
"""

import asyncio
import hashlib
import hmac
import json
import logging
import uuid
from datetime import datetime
from typing import Optional

import aiohttp
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models import Webhook, WebhookDeliveryLog

logger = logging.getLogger(__name__)

# Delivery retry configuration
MAX_RETRIES = 3
RETRY_DELAYS = [2, 10, 30]  # Seconds between retries
TIMEOUT_SECONDS = 30


def generate_signature(payload: str, secret: str) -> str:
    """Generate HMAC-SHA256 signature for webhook payload."""
    if not secret:
        return ""
    return hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()


async def deliver_webhook(
    session: aiohttp.ClientSession,
    webhook: Webhook,
    event: str,
    payload: dict,
    delivery_id: uuid.UUID,
) -> tuple[bool, Optional[int], Optional[str]]:
    """
    Attempt to deliver a webhook event to the registered URL.

    Returns:
        tuple of (success, status_code, error_message)
    """
    url = webhook.url
    secret = webhook.secret

    # Prepare payload
    payload_json = json.dumps(
        {
            "event": event,
            "timestamp": datetime.utcnow().isoformat(),
            "delivery_id": str(delivery_id),
            "data": payload,
        },
        default=str,
    )

    # Generate signature if secret is set
    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Event": event,
        "X-Webhook-Delivery-Id": str(delivery_id),
    }

    if secret:
        signature = generate_signature(payload_json, secret)
        headers["X-Webhook-Signature"] = f"sha256={signature}"

    try:
        async with session.post(
            url,
            data=payload_json.encode("utf-8"),
            headers=headers,
            timeout=aiohttp.ClientTimeout(total=TIMEOUT_SECONDS),
        ) as response:
            status_code = response.status
            response_body = await response.text()

            if 200 <= status_code < 300:
                logger.info(f"Webhook delivered successfully: {event} to {url}")
                return True, status_code, None
            else:
                error_msg = f"HTTP {status_code}: {response_body[:200]}"
                logger.warning(f"Webhook delivery failed: {error_msg}")
                return False, status_code, error_msg

    except asyncio.TimeoutError:
        error_msg = f"Timeout after {TIMEOUT_SECONDS}s"
        logger.warning(f"Webhook delivery timeout: {event} to {url}")
        return False, None, error_msg

    except aiohttp.ClientError as e:
        error_msg = str(e)
        logger.warning(f"Webhook delivery error: {error_msg}")
        return False, None, error_msg

    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        logger.error(f"Webhook delivery failed: {error_msg}")
        return False, None, error_msg


async def deliver_webhook_with_retry(
    session: aiohttp.ClientSession,
    db: AsyncSession,
    webhook: Webhook,
    event: str,
    payload: dict,
) -> bool:
    """
    Deliver webhook with retry logic.

    Retries up to MAX_RETRIES times with increasing delays.
    """
    if not webhook.is_active:
        logger.info(f"Webhook {webhook.id} is inactive, skipping delivery")
        return False

    delivery_id = uuid.uuid4()

    # Log initial attempt
    delivery_log = WebhookDeliveryLog(
        id=delivery_id,
        webhook_id=webhook.id,
        event=event,
        payload=json.dumps(payload, default=str),
    )
    db.add(delivery_log)
    await db.commit()

    for attempt in range(MAX_RETRIES):
        success, status_code, error_message = await deliver_webhook(
            session, webhook, event, payload, delivery_id
        )

        if success:
            # Update delivery log
            delivery_log.success = True
            delivery_log.status_code = status_code
            delivery_log.delivered_at = datetime.utcnow()
            await db.commit()
            return True

        # Update attempt count and error
        delivery_log.attempts = attempt + 1
        delivery_log.status_code = status_code
        delivery_log.error_message = error_message
        await db.commit()

        # Wait before retry (if not last attempt)
        if attempt < MAX_RETRIES - 1:
            delay = RETRY_DELAYS[attempt]
            logger.info(
                f"Retrying webhook delivery in {delay}s (attempt {attempt + 2}/{MAX_RETRIES})"
            )
            await asyncio.sleep(delay)

    # All retries failed
    logger.error(f"Webhook delivery failed after {MAX_RETRIES} attempts: {event} to {webhook.url}")
    return False


async def trigger_webhook_event(
    db: AsyncSession,
    event: str,
    payload: dict,
    user_id: Optional[uuid.UUID] = None,
) -> int:
    """
    Trigger a webhook event to all active webhooks subscribed to the event.

    If user_id is provided, only deliver to webhooks owned by that user.

    Returns:
        Number of successful deliveries
    """
    # Get active webhooks
    query = select(Webhook).where(Webhook.is_active)
    if user_id:
        query = query.where(Webhook.user_id == user_id)

    result = await db.execute(query)
    webhooks = result.scalars().all()

    # Filter webhooks by event subscription
    matching_webhooks = []
    for webhook in webhooks:
        events = webhook.events or []
        # Check if event matches subscription (supports wildcards)
        for subscribed_event in events:
            if subscribed_event == "*":
                matching_webhooks.append(webhook)
                break
            elif subscribed_event.endswith(".*"):
                prefix = subscribed_event[:-1]  # Remove trailing *
                if event.startswith(prefix):
                    matching_webhooks.append(webhook)
                    break
            elif subscribed_event == event:
                matching_webhooks.append(webhook)
                break

    if not matching_webhooks:
        logger.debug(f"No webhooks subscribed to event: {event}")
        return 0

    # Deduplicate webhooks (in case of overlapping subscriptions)
    unique_webhooks = list({w.id: w for w in matching_webhooks}.values())

    logger.info(f"Delivering event '{event}' to {len(unique_webhooks)} webhooks")

    # Create HTTP session and deliver
    success_count = 0
    async with aiohttp.ClientSession() as session:
        tasks = [
            deliver_webhook_with_retry(session, db, webhook, event, payload)
            for webhook in unique_webhooks
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Webhook delivery exception: {result}")
            elif result:
                success_count += 1

    logger.info(f"Event '{event}' delivered to {success_count}/{len(unique_webhooks)} webhooks")
    return success_count


# Helper function to trigger common events
async def trigger_agent_status_event(
    db: AsyncSession,
    agent_id: uuid.UUID,
    old_status: str,
    new_status: str,
    agent_name: str,
):
    """Trigger agent.status event."""
    await trigger_webhook_event(
        db,
        "agent.status",
        {
            "agent_id": str(agent_id),
            "agent_name": agent_name,
            "old_status": old_status,
            "new_status": new_status,
        },
    )


async def trigger_deployment_event(
    db: AsyncSession,
    deployment_id: uuid.UUID,
    agent_id: uuid.UUID,
    event_type: str,
    status: Optional[str] = None,
):
    """Trigger deployment event."""
    await trigger_webhook_event(
        db,
        "deployment.event",
        {
            "deployment_id": str(deployment_id),
            "agent_id": str(agent_id),
            "event_type": event_type,
            "status": status,
        },
    )
