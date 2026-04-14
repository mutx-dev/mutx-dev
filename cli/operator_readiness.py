from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping, Sequence

API_KEY_EXPIRING_SOON_DAYS = 7
API_KEY_UNUSED_DAYS = 7
API_KEY_STALE_DAYS = 30
WEBHOOK_STALE_DAYS = 7


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_datetime(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None

    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def api_key_last_used(key: Mapping[str, Any]) -> str | None:
    last_used_at = key.get("last_used_at")
    if isinstance(last_used_at, str) and last_used_at:
        return last_used_at

    last_used = key.get("last_used")
    if isinstance(last_used, str) and last_used:
        return last_used

    return None


def describe_api_key_lifecycle(key: Mapping[str, Any], now: datetime | None = None) -> str:
    current_time = now or utc_now()

    is_active = key.get("is_active")
    if isinstance(is_active, bool) and not is_active:
        return "revoked"

    status = str(key.get("status") or "").lower()
    if "revoked" in status or "inactive" in status:
        return "revoked"

    expires_at = parse_datetime(key.get("expires_at"))
    if expires_at is not None and expires_at <= current_time:
        return "expired"

    return "active"


def describe_api_key_readiness(key: Mapping[str, Any], now: datetime | None = None) -> str | None:
    current_time = now or utc_now()

    if describe_api_key_lifecycle(key, current_time) != "active":
        return None

    expires_at = parse_datetime(key.get("expires_at"))
    if expires_at is not None:
        days_until_expiry = (expires_at - current_time).days
        if days_until_expiry <= API_KEY_EXPIRING_SOON_DAYS:
            return "expires-soon"

    last_used = parse_datetime(api_key_last_used(key))
    created_at = parse_datetime(key.get("created_at"))
    if last_used is None and created_at is not None:
        if (current_time - created_at).days >= API_KEY_UNUSED_DAYS:
            return "unused"

    if last_used is not None and (current_time - last_used).days >= API_KEY_STALE_DAYS:
        return "stale"

    return "ready"


def describe_webhook_lifecycle(webhook: Mapping[str, Any]) -> str:
    return "active" if bool(webhook.get("is_active")) else "inactive"


def describe_webhook_delivery_health(
    webhook: Mapping[str, Any],
    deliveries: Sequence[Mapping[str, Any]],
    now: datetime | None = None,
) -> str:
    current_time = now or utc_now()

    if describe_webhook_lifecycle(webhook) != "active":
        return "inactive"

    if not deliveries:
        return "not-exercised"

    def delivery_time(delivery: Mapping[str, Any]) -> datetime:
        return parse_datetime(delivery.get("created_at") or delivery.get("delivered_at")) or datetime.min.replace(
            tzinfo=timezone.utc
        )

    sorted_deliveries = sorted(deliveries, key=delivery_time, reverse=True)
    latest = sorted_deliveries[0]
    latest_time = delivery_time(latest)
    recent_failures = sum(1 for delivery in sorted_deliveries if not bool(delivery.get("success")))

    if not bool(latest.get("success")):
        return "failing"

    if (current_time - latest_time).days >= WEBHOOK_STALE_DAYS:
        return "stale"

    if recent_failures > 0:
        return "recovering"

    return "healthy"
