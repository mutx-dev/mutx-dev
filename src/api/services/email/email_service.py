import secrets
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from src.api.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

PASSWORD_RESET_TOKEN_EXPIRE_HOURS = 1


def generate_token() -> str:
    """Generate a secure random token."""
    return secrets.token_urlsafe(32)


def send_email(
    to_email: str, subject: str, html_body: str, text_body: Optional[str] = None
) -> bool:
    """Send an email using SMTP.

    Returns True if email was sent successfully, False otherwise.
    """
    if not settings.smtp_user or not settings.smtp_password:
        logger.warning(f"SMTP not configured. Would send email to {to_email}: {subject}")
        return True  # Return True in dev mode so flow continues

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        msg["To"] = to_email
        msg["Subject"] = subject

        # Attach plain text and HTML versions
        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        # Connect to SMTP server and send
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)

        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_verification_email(
    to_email: str,
    name: str,
    token: str,
    *,
    frontend_url: str | None = None,
) -> bool:
    """Send email verification email."""
    base_url = (frontend_url or settings.frontend_url).rstrip("/")
    verify_url = f"{base_url}/verify-email?token={token}"

    subject = "Verify your MUTX account"
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a2e;">Welcome to MUTX, {name}!</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Thanks for signing up! Please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{verify_url}" style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Verify Email
            </a>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:<br>
            <a href="{verify_url}" style="color: #4f46e5;">{verify_url}</a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in {settings.email_verification_token_expire_hours} hours.<br>
            If you didn't create an account with MUTX, you can safely ignore this email.
        </p>
    </body>
    </html>
    """
    text_body = f"""
    Welcome to MUTX, {name}!

    Thanks for signing up! Please verify your email address by visiting this link:
    {verify_url}

    This link will expire in {settings.email_verification_token_expire_hours} hours.

    If you didn't create an account with MUTX, you can safely ignore this email.
    """

    return send_email(to_email, subject, html_body, text_body)


def send_password_reset_email(
    to_email: str,
    name: str,
    token: str,
    *,
    frontend_url: str | None = None,
) -> bool:
    """Send password reset email."""
    base_url = (frontend_url or settings.frontend_url).rstrip("/")
    reset_url = f"{base_url}/reset-password?token={token}"

    subject = "Reset your MUTX password"
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a2e;">Reset your password</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Hi {name},<br><br>
            We received a request to reset your password. Click the button below to create a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_url}" style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Reset Password
            </a>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:<br>
            <a href="{reset_url}" style="color: #4f46e5;">{reset_url}</a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in {PASSWORD_RESET_TOKEN_EXPIRE_HOURS} hour.<br>
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
    </body>
    </html>
    """
    text_body = f"""
    Reset your password

    Hi {name},

    We received a request to reset your password. Visit this link to create a new password:
    {reset_url}

    This link will expire in {PASSWORD_RESET_TOKEN_EXPIRE_HOURS} hour.

    If you didn't request a password reset, you can safely ignore this email.
    """

    return send_email(to_email, subject, html_body, text_body)
