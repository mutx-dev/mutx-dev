"""Stripe integration service for subscriptions, checkout, and webhooks."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models.subscription import Subscription, Payment
from src.api.models.models import User

logger = logging.getLogger(__name__)

# Lazy config — reads from env at call time so tests can monkeypatch
def _get_secret_key() -> str:
    import os
    key = os.getenv("STRIPE_SECRET_KEY", "")
    if not key:
        raise RuntimeError("STRIPE_SECRET_KEY not configured")
    return key


def _get_webhook_secret() -> str:
    import os
    return os.getenv("STRIPE_WEBHOOK_SECRET", "")


# Map Stripe price IDs to internal plan names
def _price_id_to_plan(price_id: str) -> str:
    import os
    if price_id == os.getenv("STRIPE_STARTER_PRICE_ID", ""):
        return "starter"
    if price_id == os.getenv("STRIPE_PRO_PRICE_ID", ""):
        return "pro"
    if price_id == os.getenv("STRIPE_ENTERPRISE_PRICE_ID", ""):
        return "enterprise"
    return "starter"  # fallback


async def _get_or_create_customer(
    db: AsyncSession,
    user: User,
) -> tuple[str, str | None]:
    """Return (stripe_customer_id, existing_subscription_id) for a user.

    Creates a Stripe Customer if the user doesn't have one yet.
    """
    sub = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id).order_by(Subscription.created_at.desc())
    )
    existing = sub.scalars().first()
    if existing:
        return existing.stripe_customer_id, existing.stripe_subscription_id

    customer = stripe.Customer.create(
        email=user.email,
        name=user.name,
        metadata={"user_id": str(user.id)},
        api_key=_get_secret_key(),
    )
    return customer.id, None


# ── Checkout ──────────────────────────────────────────────────────────

async def create_checkout_session(
    db: AsyncSession,
    user: User,
    price_id: str,
    success_url: str,
    cancel_url: str,
    trial_days: int | None = None,
) -> dict[str, str]:
    """Create a Stripe Checkout Session for subscription signup."""
    customer_id, _ = await _get_or_create_customer(db, user)

    params: dict[str, Any] = {
        "customer": customer_id,
        "mode": "subscription",
        "line_items": [{"price": price_id, "quantity": 1}],
        "success_url": success_url,
        "cancel_url": cancel_url,
        "metadata": {"user_id": str(user.id)},
        "api_key": _get_secret_key(),
    }

    if trial_days and trial_days > 0:
        from datetime import timedelta
        trial_end = datetime.now(timezone.utc) + timedelta(days=trial_days)
        params["subscription_data"] = {"trial_end": int(trial_end.timestamp())}

    session = stripe.checkout.Session.create(**params)
    return {"checkout_url": session.url, "session_id": session.id}


# ── Customer Portal ──────────────────────────────────────────────────

async def create_customer_portal(
    db: AsyncSession,
    user: User,
    return_url: str,
) -> dict[str, str]:
    """Create a Stripe Customer Portal session."""
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id).order_by(Subscription.created_at.desc())
    )
    sub = result.scalars().first()
    if not sub:
        raise ValueError("No subscription found for user")

    session = stripe.billing_portal.Session.create(
        customer=sub.stripe_customer_id,
        return_url=return_url,
        api_key=_get_secret_key(),
    )
    return {"portal_url": session.url}


# ── Webhook handlers ─────────────────────────────────────────────────

def verify_webhook_signature(payload: bytes, sig_header: str) -> stripe.Event:
    """Verify and parse a Stripe webhook event."""
    return stripe.Webhook.construct_event(
        payload, sig_header, _get_webhook_secret()
    )


async def handle_checkout_complete(session_data: dict[str, Any], db: AsyncSession) -> None:
    """Handle checkout.session.completed — create subscription, upgrade user."""
    user_id_str = session_data.get("metadata", {}).get("user_id") or session_data.get("client_reference_id")
    if not user_id_str:
        logger.error("checkout.session.completed: no user_id in metadata")
        return

    user_id = uuid.UUID(user_id_str)
    stripe_sub = session_data.get("subscription")
    stripe_customer = session_data.get("customer")

    if not stripe_sub or not stripe_customer:
        logger.error("checkout.session.completed: missing subscription or customer ID")
        return

    # Get plan from line items
    line_items = session_data.get("line_items", {}).get("data", [])
    price_id = ""
    if line_items:
        price_id = line_items[0].get("price", {}).get("id", "")

    # Fetch subscription details from Stripe
    sub_details = stripe.Subscription.retrieve(stripe_sub, api_key=_get_secret_key())

    plan = _price_id_to_plan(price_id) if price_id else "starter"

    # Create or update subscription record
    result = await db.execute(
        select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub)
    )
    existing = result.scalars().first()

    if existing:
        existing.status = sub_details.status
        existing.plan = plan
        existing.current_period_start = datetime.fromtimestamp(sub_details.current_period_start, tz=timezone.utc)
        existing.current_period_end = datetime.fromtimestamp(sub_details.current_period_end, tz=timezone.utc)
    else:
        new_sub = Subscription(
            user_id=user_id,
            stripe_customer_id=stripe_customer,
            stripe_subscription_id=stripe_sub,
            plan=plan,
            status=sub_details.status,
            current_period_start=datetime.fromtimestamp(sub_details.current_period_start, tz=timezone.utc),
            current_period_end=datetime.fromtimestamp(sub_details.current_period_end, tz=timezone.utc),
            cancel_at_period_end=sub_details.get("cancel_at_period_end", False),
        )
        if sub_details.get("trial_end"):
            new_sub.trial_end = datetime.fromtimestamp(sub_details["trial_end"], tz=timezone.utc)
            new_sub.status = "trialing"
        db.add(new_sub)

    # Upgrade user plan
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    if user:
        user.plan = plan.upper()

    await db.commit()
    logger.info("Subscription created/upgraded: user=%s plan=%s", user_id, plan)


async def handle_subscription_updated(sub_data: dict[str, Any], db: AsyncSession) -> None:
    """Handle customer.subscription.updated — sync status and period."""
    stripe_sub_id = sub_data.get("id")
    if not stripe_sub_id:
        return

    result = await db.execute(
        select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id)
    )
    sub = result.scalars().first()
    if not sub:
        logger.warning("subscription.updated: no local record for %s", stripe_sub_id)
        return

    sub.status = sub_data.get("status", sub.status)
    sub.cancel_at_period_end = sub_data.get("cancel_at_period_end", False)

    period_start = sub_data.get("current_period_start")
    period_end = sub_data.get("current_period_end")
    if period_start:
        sub.current_period_start = datetime.fromtimestamp(period_start, tz=timezone.utc)
    if period_end:
        sub.current_period_end = datetime.fromtimestamp(period_end, tz=timezone.utc)

    # Sync user plan if changed
    items = sub_data.get("items", {}).get("data", [])
    if items:
        price_id = items[0].get("price", {}).get("id", "")
        if price_id:
            new_plan = _price_id_to_plan(price_id)
            sub.plan = new_plan
            user_result = await db.execute(select(User).where(User.id == sub.user_id))
            user = user_result.scalars().first()
            if user:
                user.plan = new_plan.upper()

    await db.commit()
    logger.info("Subscription updated: %s status=%s", stripe_sub_id, sub.status)


async def handle_subscription_deleted(sub_data: dict[str, Any], db: AsyncSession) -> None:
    """Handle customer.subscription.deleted — downgrade user to FREE."""
    stripe_sub_id = sub_data.get("id")
    if not stripe_sub_id:
        return

    result = await db.execute(
        select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id)
    )
    sub = result.scalars().first()
    if not sub:
        return

    sub.status = "canceled"

    user_result = await db.execute(select(User).where(User.id == sub.user_id))
    user = user_result.scalars().first()
    if user:
        user.plan = "FREE"

    await db.commit()
    logger.info("Subscription canceled: user=%s", sub.user_id)


async def handle_invoice_paid(invoice_data: dict[str, Any], db: AsyncSession) -> None:
    """Handle invoice.paid — create payment record."""
    stripe_invoice_id = invoice_data.get("id")
    stripe_sub_id = invoice_data.get("subscription")
    stripe_customer = invoice_data.get("customer")
    amount = invoice_data.get("amount_paid", invoice_data.get("total", 0))
    currency = invoice_data.get("currency", "usd")

    if not stripe_invoice_id:
        return

    # Find user by subscription or customer
    user_id = None
    subscription_id = None

    if stripe_sub_id:
        sub_result = await db.execute(
            select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id)
        )
        sub = sub_result.scalars().first()
        if sub:
            user_id = sub.user_id
            subscription_id = sub.id

    if not user_id and stripe_customer:
        sub_result = await db.execute(
            select(Subscription).where(Subscription.stripe_customer_id == stripe_customer).order_by(Subscription.created_at.desc())
        )
        sub = sub_result.scalars().first()
        if sub:
            user_id = sub.user_id
            subscription_id = sub.id

    if not user_id:
        logger.warning("invoice.paid: could not resolve user for invoice %s", stripe_invoice_id)
        return

    payment = Payment(
        user_id=user_id,
        subscription_id=subscription_id,
        stripe_invoice_id=stripe_invoice_id,
        amount_cents=amount,
        currency=currency,
        status="paid",
    )
    db.add(payment)
    await db.commit()
    logger.info("Payment recorded: invoice=%s amount=%d", stripe_invoice_id, amount)


async def handle_invoice_payment_failed(invoice_data: dict[str, Any], db: AsyncSession) -> None:
    """Handle invoice.payment_failed — mark subscription past_due."""
    stripe_sub_id = invoice_data.get("subscription")
    if not stripe_sub_id:
        return

    result = await db.execute(
        select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id)
    )
    sub = result.scalars().first()
    if sub:
        sub.status = "past_due"
        await db.commit()
        logger.info("Subscription past_due: %s", stripe_sub_id)


async def dispatch_webhook_event(event: stripe.Event, db: AsyncSession) -> None:
    """Route a verified Stripe webhook event to the right handler."""
    handler_map = {
        "checkout.session.completed": handle_checkout_complete,
        "customer.subscription.updated": handle_subscription_updated,
        "customer.subscription.deleted": handle_subscription_deleted,
        "invoice.paid": handle_invoice_paid,
        "invoice.payment_failed": handle_invoice_payment_failed,
    }

    handler = handler_map.get(event.type)
    if not handler:
        logger.debug("Unhandled webhook event type: %s", event.type)
        return

    await handler(event.data.object, db)


# ── Query helpers ────────────────────────────────────────────────────

async def get_subscription_status(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> dict[str, Any]:
    """Return current subscription status for a user."""
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user_id)
        .order_by(Subscription.created_at.desc())
    )
    sub = result.scalars().first()

    if not sub:
        return {
            "plan": "FREE",
            "status": None,
            "current_period_end": None,
            "cancel_at_period_end": None,
            "trial_end": None,
        }

    return {
        "plan": sub.plan,
        "status": sub.status,
        "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
        "cancel_at_period_end": sub.cancel_at_period_end,
        "trial_end": sub.trial_end.isoformat() if sub.trial_end else None,
    }


async def cancel_subscription(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> dict[str, str]:
    """Cancel subscription at period end via Stripe."""
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user_id, Subscription.status.in_(["active", "trialing"]))
        .order_by(Subscription.created_at.desc())
    )
    sub = result.scalars().first()

    if not sub:
        raise ValueError("No active subscription found")

    stripe.Subscription.modify(
        sub.stripe_subscription_id,
        cancel_at_period_end=True,
        api_key=_get_secret_key(),
    )

    sub.cancel_at_period_end = True
    await db.commit()

    return {"status": "canceling", "message": "Subscription will cancel at period end"}
