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
import ipaddress
import json
import logging
import socket
import uuid
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlsplit

import aiohttp
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from src.api.models import Webhook, WebhookDeliveryLog
from src.api.security import decrypt_secret_value

logger = logging.getLogger(__name__)

# Delivery retry configuration
MAX_RETRIES = 3
RETRY_DELAYS = [2, 10, 30]  # Seconds between retries
TIMEOUT_SECONDS = 30


class UnsafeWebhookDestinationError(ValueError):
    """Raised when a webhook destination points to a non-public network target."""


def generate_signature(payload: str, secret: str) -> str:
    """Generate HMAC-SHA256 signature for webhook payload."""
    if not secret:
        return ""
    return hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()


def _normalize_ip_address(value: str) -> ipaddress.IPv4Address | ipaddress.IPv6Address:
    ip = ipaddress.ip_address(value)
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped is not None:
        return ip.ipv4_mapped
    return ip


def _assert_public_ip_address(value: str, *, hostname: str) -> None:
    ip = _normalize_ip_address(value)
    if not ip.is_global:
        raise UnsafeWebhookDestinationError(
            f"Webhook destination '{hostname}' resolves to a non-public address"
        )


async def resolve_webhook_destination_ips(hostname: str, port: int) -> set[str]:
    loop = asyncio.get_running_loop()
    try:
        addrinfo = await loop.getaddrinfo(
            hostname,
            port,
            type=socket.SOCK_STREAM,
            proto=socket.IPPROTO_TCP,
        )
    except socket.gaierror as exc:
        raise UnsafeWebhookDestinationError(
            f"Webhook destination '{hostname}' could not be resolved"
        ) from exc

    resolved_ips = {sockaddr[0] for _, _, _, _, sockaddr in addrinfo if sockaddr and sockaddr[0]}
    if not resolved_ips:
        raise UnsafeWebhookDestinationError(
            f"Webhook destination '{hostname}' could not be resolved"
        )

    return resolved_ips


async def ensure_safe_webhook_destination(url: str) -> None:
    parsed = urlsplit(url)
    if parsed.scheme not in {"http", "https"}:
        raise UnsafeWebhookDestinationError("URL must start with http:// or https://")

    hostname = parsed.hostname
    if not hostname:
        raise UnsafeWebhookDestinationError("Webhook URL must include a hostname")
    if hostname == "localhost" or hostname.endswith(".localhost"):
        raise UnsafeWebhookDestinationError(
            f"Webhook destination '{hostname}' resolves to a non-public address"
        )

    port = parsed.port or (443 if parsed.scheme == "https" else 80)

    try:
        parsed_ip = _normalize_ip_address(hostname)
    except ValueError:
        parsed_ip = None

    if parsed_ip is not None:
        _assert_public_ip_address(parsed_ip.compressed, hostname=hostname)
        return

    resolved_ips = await resolve_webhook_destination_ips(hostname, port)
    for resolved_ip in resolved_ips:
        _assert_public_ip_address(resolved_ip, hostname=hostname)


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
    secret = decrypt_secret_value(webhook.secret)

    # Prepare payload
    payload_json = json.dumps(
        {
            "event": event,
            "timestamp": datetime.now(timezone.utc).isoformat(),
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
        await ensure_safe_webhook_destination(url)
    except UnsafeWebhookDestinationError as exc:
        error_msg = str(exc)
        logger.warning("Blocked webhook delivery to unsafe destination %s: %s", url, error_msg)
        return False, None, error_msg

    try:
        async with session.post(
            url,
            data=payload_json.encode("utf-8"),
            headers=headers,
            timeout=aiohttp.ClientTimeout(total=TIMEOUT_SECONDS),
            allow_redirects=False,
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
    if db.bind is None:
        raise RuntimeError("Database session is not bound")

    isolated_session_factory = async_sessionmaker(
        db.bind,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with isolated_session_factory() as isolated_db:
        refreshed_webhook = await isolated_db.get(Webhook, webhook.id)
        if not refreshed_webhook or not refreshed_webhook.is_active:
            logger.info(f"Webhook {webhook.id} is inactive, skipping delivery")
            return False

        delivery_id = uuid.uuid4()
        delivery_log = WebhookDeliveryLog(
            id=delivery_id,
            webhook_id=refreshed_webhook.id,
            event=event,
            payload=json.dumps(payload, default=str),
        )
        isolated_db.add(delivery_log)
        await isolated_db.commit()

        for attempt in range(MAX_RETRIES):
            success, status_code, error_message = await deliver_webhook(
                session, refreshed_webhook, event, payload, delivery_id
            )

            if success:
                delivery_log.success = True
                delivery_log.status_code = status_code
                delivery_log.delivered_at = datetime.now(timezone.utc)
                await isolated_db.commit()
                return True

            delivery_log.attempts = attempt + 1
            delivery_log.status_code = status_code
            delivery_log.error_message = error_message
            await isolated_db.commit()

            if attempt < MAX_RETRIES - 1:
                delay = RETRY_DELAYS[attempt]
                logger.info(
                    f"Retrying webhook delivery in {delay}s (attempt {attempt + 2}/{MAX_RETRIES})"
                )
                await asyncio.sleep(delay)

        logger.error(
            f"Webhook delivery failed after {MAX_RETRIES} attempts: {event} to {refreshed_webhook.url}"
        )
        return False


async def trigger_webhook_event(
    db: AsyncSession,
    event: str,
    payload: dict,
    user_id: Optional[uuid.UUID] = None,
) -> int:
    """
    Trigger a webhook event to all active webhooks subscribed to the event.

    Returns:
        Number of successful deliveries
    """
    # Get active webhooks that subscribe to this event.
    # If a user_id is provided, only deliver within that tenant.
    query = select(Webhook).where(Webhook.is_active)
    if user_id is not None:
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
