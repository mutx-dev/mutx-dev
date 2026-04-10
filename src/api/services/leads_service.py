"""
Lead notification service.

Handles outbound notifications when a new lead is captured:
- Discord webhook (raw POST, no auth)
- Resend email notification (transactional alert to us)
- Optional Resend audience sync (adds contact to a list for blast campaigns)
"""

import logging
from datetime import datetime, timezone
from typing import Optional

import aiohttp

from src.api.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# Discord webhook
# ---------------------------------------------------------------------------

DISCORD_LEAD_COLOR = 0x4B8DFF  # MUTX blue


def _build_discord_lead_payload(
    email: str,
    source: Optional[str],
    name: Optional[str] = None,
    company: Optional[str] = None,
    message: Optional[str] = None,
) -> dict:
    fields = [{"name": "Email", "value": email, "inline": True}]
    if name:
        fields.append({"name": "Name", "value": name, "inline": True})
    if company:
        fields.append({"name": "Company", "value": company, "inline": True})
    if source:
        fields.append({"name": "Source", "value": source, "inline": True})
    if message:
        fields.append({"name": "Message", "value": message, "inline": False})

    embed = {
        "title": "New Lead Captured",
        "description": f"**{email}** just signed up.",
        "color": DISCORD_LEAD_COLOR,
        "fields": fields,
        "footer": {"text": "MUTX Lead Pipeline"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # Attach avatar and username
    return {
        "username": "MUTX Leads",
        "avatar_url": "https://mutx.dev/logo.png",
        "embeds": [embed],
    }


async def _notify_discord_lead(
    webhook_url: str,
    email: str,
    source: Optional[str],
    name: Optional[str] = None,
    company: Optional[str] = None,
    message: Optional[str] = None,
) -> bool:
    payload = _build_discord_lead_payload(email, source, name, company, message)
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                webhook_url,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.ok:
                    logger.info(f"Discord lead notification sent for {email}")
                    return True
                body = await resp.text()
                logger.warning(
                    f"Discord webhook returned {resp.status}: {body[:200]}"
                )
                return False
    except Exception as e:
        logger.error(f"Failed to send Discord lead notification: {e}")
        return False


# ---------------------------------------------------------------------------
# Resend — transactional lead alert email to us
# ---------------------------------------------------------------------------

async def _notify_resend_lead(
    email: str,
    source: Optional[str],
    name: Optional[str] = None,
    company: Optional[str] = None,
) -> bool:
    """
    Send a transactional alert email to the team when a lead comes in.
    Uses Resend API directly (no SDK dependency).
    """
    if not settings.resend_api_key:
        logger.debug("RESEND_API_KEY not set, skipping Resend lead alert")
        return False

    from_email = settings.resend_from_email or "leads@mutx.dev"
    to_email = settings.resend_lead_alert_email or "leads@mutx.dev"

    subject = f"New lead: {email}"
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #131a24;">
        <div style="background: #f8f6f3; border-radius: 12px; padding: 24px; border: 1px solid rgba(19,26,36,0.1);">
            <h2 style="margin: 0 0 16px; color: #131a24; font-size: 18px; font-weight: 700;">New Lead Captured</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid rgba(19,26,36,0.08); font-size: 13px; color: rgba(19,26,36,0.6); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Email</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid rgba(19,26,36,0.08); font-size: 15px; color: #131a24; font-weight: 600;">{email}</td>
                </tr>
                {f'<tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(19,26,36,0.08); font-size: 13px; color: rgba(19,26,36,0.6); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Name</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(19,26,36,0.08); font-size: 15px; color: #131a24;">{name}</td></tr>' if name else ''}
                {f'<tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(19,26,36,0.08); font-size: 13px; color: rgba(19,26,36,0.6); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Company</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(19,26,36,0.08); font-size: 15px; color: #131a24;">{company}</td></tr>' if company else ''}
                {f'<tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(19,26,36,0.08); font-size: 13px; color: rgba(19,26,36,0.6); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Source</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(19,26,36,0.08); font-size: 15px; color: #131a24;">{source}</td></tr>' if source else ''}
                <tr>
                    <td style="padding: 8px 0; font-size: 13px; color: rgba(19,26,36,0.6); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Captured</td>
                    <td style="padding: 8px 0; font-size: 15px; color: #131a24;">{datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")}</td>
                </tr>
            </table>
        </div>
        <p style="margin: 16px 0 0; font-size: 12px; color: rgba(19,26,36,0.5);">This lead was captured via the MUTX lead pipeline.</p>
    </body>
    </html>
    """

    text_body = f"""New lead captured

Email: {email}
{"Name: " + name if name else ""}
{"Company: " + company if company else ""}
{"Source: " + source if source else ""}
Captured: {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")}
"""

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.resend.com/email",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": from_email,
                    "to": [to_email],
                    "subject": subject,
                    "html": html_body,
                    "text": text_body,
                },
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.ok:
                    logger.info(f"Resend lead alert sent for {email}")
                    return True
                body = await resp.text()
                logger.warning(f"Resend lead alert failed {resp.status}: {body[:200]}")
                return False
    except Exception as e:
        logger.error(f"Failed to send Resend lead alert: {e}")
        return False


# ---------------------------------------------------------------------------
# Resend audience sync — add to a contact list for blast campaigns
# ---------------------------------------------------------------------------

async def _sync_resend_audience(
    email: str,
    name: Optional[str] = None,
    company: Optional[str] = None,
    source: Optional[str] = None,
) -> bool:
    """
    Add/update a contact in the configured Resend audience.
    Skipped if RESEND_AUDIENCE_ID is not set.
    """
    if not settings.resend_api_key or not settings.resend_audience_id:
        return False

    contacts_url = (
        f"https://api.resend.com/audiences/{settings.resend_audience_id}/contacts"
    )

    payload: dict[str, str] = {"email": email}
    if name:
        payload["first_name"] = name
    if company:
        payload["last_name"] = company  # using last_name as company per Resend field

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                contacts_url,
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.ok:
                    logger.info(f"Resend audience sync completed for {email}")
                    return True
                # 409 = already exists (that's fine)
                if resp.status == 409:
                    logger.debug(f"Resend contact already exists: {email}")
                    return True
                body = await resp.text()
                logger.warning(
                    f"Resend audience sync failed {resp.status}: {body[:200]}"
                )
                return False
    except Exception as e:
        logger.error(f"Failed to sync Resend audience: {e}")
        return False


# ---------------------------------------------------------------------------
# Public entry point — call after lead is successfully captured
# ---------------------------------------------------------------------------

async def notify_new_lead(
    email: str,
    source: Optional[str],
    name: Optional[str] = None,
    company: Optional[str] = None,
    message: Optional[str] = None,
) -> None:
    """
    Fire all configured lead notifications asynchronously.
    Failures are logged but never raise — notifications are best-effort.
    """
    import asyncio

    tasks: list[asyncio.Task] = []

    # Discord webhook
    if settings.lead_discord_webhook_url:
        tasks.append(
            asyncio.create_task(
                _notify_discord_lead(
                    settings.lead_discord_webhook_url,
                    email,
                    source,
                    name,
                    company,
                    message,
                )
            )
        )

    # Resend alert email
    if settings.resend_api_key:
        tasks.append(
            asyncio.create_task(
                _notify_resend_lead(email, source, name, company)
            )
        )

    # Resend audience sync
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)
