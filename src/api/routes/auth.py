from ipaddress import ip_address
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.config import get_settings
from src.api.database import get_db
from src.api.models.models import User
from src.api.services.user_service import UserService, normalize_preferred_locale
from src.api.services.analytics import log_analytics_event, AnalyticsEventType
from src.api.middleware.auth import get_current_user, get_current_user_optional
from src.api.auth.jwt import (
    issue_token_pair,
    revoke_refresh_token,
    refresh_access_token,
)
from src.api.auth.password import validate_password_strength
from src.api.services.email.email_service import (
    send_verification_email,
    send_password_reset_email,
)
from src.api.services.social_auth import (
    OAuthProvider,
    SocialAuthError,
    build_authorization_url,
    exchange_code_for_user_profile,
    get_provider_client_id,
)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()
LOCAL_BOOTSTRAP_EMAIL = "local-operator@mutx.local"


def _get_expires_in_seconds(expires_at: datetime) -> int:
    return max(0, int((expires_at - datetime.now(timezone.utc)).total_seconds()))


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    verification_origin: str | None = None
    preferred_locale: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    preferred_locale: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class LocalBootstrapRequest(BaseModel):
    name: str = "Local Operator"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    preferred_locale: str | None = None


class RegisterResponse(TokenResponse):
    verification_email_sent: bool = True
    requires_email_verification: bool = False


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    plan: str
    created_at: datetime
    is_active: bool
    is_email_verified: bool = False
    preferred_locale: str | None = None

    model_config = ConfigDict(from_attributes=True)


class UpdatePreferredLocaleRequest(BaseModel):
    preferred_locale: str


class PreferredLocaleResponse(BaseModel):
    preferred_locale: str | None = None


def _is_loopback_host(host: str | None) -> bool:
    if not host:
        return False

    normalized = host.strip().lower()
    if normalized in {"localhost", "testclient"}:
        return True

    try:
        return ip_address(normalized).is_loopback
    except ValueError:
        return False


def _assert_local_bootstrap_allowed(request: Request) -> None:
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Local bootstrap is disabled in production.",
        )

    forwarded_for = request.headers.get("x-forwarded-for")
    forwarded = request.headers.get("forwarded")
    if forwarded_for or forwarded:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Local bootstrap is only available from localhost.",
        )

    client_host = request.client.host if request.client else None
    if not _is_loopback_host(client_host):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Local bootstrap is only available from localhost.",
        )


def _normalize_origin(value: str | None) -> str | None:
    if not value:
        return None

    parsed = urlsplit(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None

    return f"{parsed.scheme}://{parsed.netloc}"


def _get_allowed_frontend_origins() -> set[str]:
    origins = {settings.frontend_url.rstrip("/")}
    configured = settings.cors_origins if isinstance(settings.cors_origins, list) else []
    for origin in configured:
        normalized = _normalize_origin(origin)
        if normalized:
            origins.add(normalized.rstrip("/"))
    return origins


def _is_allowed_frontend_origin(origin: str) -> bool:
    if origin in _get_allowed_frontend_origins():
        return True

    parsed = urlsplit(origin)
    host = (parsed.hostname or "").lower()

    if host == "mutx.dev" or host.endswith(".mutx.dev"):
        return True

    if host in {"localhost", "127.0.0.1", "::1"} or host.endswith(".localhost"):
        return True

    return False


def _resolve_frontend_origin(requested_origin: str | None) -> str:
    normalized = _normalize_origin(requested_origin)
    if normalized and _is_allowed_frontend_origin(normalized):
        return normalized
    return settings.frontend_url.rstrip("/")


def _validate_oauth_redirect_uri(provider: OAuthProvider, redirect_uri: str) -> str:
    parsed = urlsplit(redirect_uri)
    origin = _normalize_origin(redirect_uri)

    if origin is None or not _is_allowed_frontend_origin(origin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth redirect URI must target an allowed frontend origin.",
        )

    expected_suffix = f"/api/auth/oauth/{provider.value}/callback"
    if parsed.path != expected_suffix:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth redirect URI path is invalid.",
        )

    return redirect_uri


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    response_model_exclude_none=True,
)
async def register(request: RegisterRequest, session: AsyncSession = Depends(get_db)):
    user_service = UserService(session)

    existing_user = await user_service.get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    is_valid, error_message = validate_password_strength(request.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message,
        )

    user = await user_service.create_user(
        email=request.email,
        name=request.name,
        password=request.password,
    )
    preferred_locale = await user_service.set_user_locale(user, request.preferred_locale)

    # Send verification email
    token = await user_service.create_email_verification_token(user.id)
    send_verification_email(
        user.email,
        user.name,
        token,
        frontend_url=_resolve_frontend_origin(request.verification_origin),
    )

    access_token, access_token_expires_at, refresh_token = await issue_token_pair(session, user.id)

    # Track analytics event
    await log_analytics_event(
        session,
        event_name="User logged in",
        event_type=AnalyticsEventType.USER_LOGIN,
        user_id=user.id,
    )

    return RegisterResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=_get_expires_in_seconds(access_token_expires_at),
        requires_email_verification=settings.require_email_verification,
        preferred_locale=preferred_locale,
    )


@router.post("/login", response_model=TokenResponse, response_model_exclude_none=True)
async def login(request: LoginRequest, session: AsyncSession = Depends(get_db)):
    user_service = UserService(session)

    user = await user_service.authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    if settings.require_email_verification and not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification is required before login",
        )

    preferred_locale = await user_service.initialize_user_locale(user, request.preferred_locale)
    access_token, access_token_expires_at, refresh_token = await issue_token_pair(session, user.id)

    # Track analytics event
    await log_analytics_event(
        session,
        event_name="User logged in",
        event_type=AnalyticsEventType.USER_LOGIN,
        user_id=user.id,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=_get_expires_in_seconds(access_token_expires_at),
        preferred_locale=preferred_locale,
    )


@router.post("/local-bootstrap", response_model=TokenResponse, response_model_exclude_none=True)
async def local_bootstrap(
    request: LocalBootstrapRequest,
    http_request: Request,
    session: AsyncSession = Depends(get_db),
):
    _assert_local_bootstrap_allowed(http_request)

    user_service = UserService(session)
    user = await user_service.get_or_create_local_bootstrap_user(
        email=LOCAL_BOOTSTRAP_EMAIL,
        name=request.name,
    )

    access_token, access_token_expires_at, refresh_token = await issue_token_pair(session, user.id)

    await log_analytics_event(
        session,
        event_name="Local operator bootstrapped",
        event_type=AnalyticsEventType.USER_LOGIN,
        user_id=user.id,
        properties={"mode": "local_bootstrap"},
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=_get_expires_in_seconds(access_token_expires_at),
        preferred_locale=await user_service.get_user_locale(user.id),
    )


@router.post("/refresh", response_model=TokenResponse, response_model_exclude_none=True)
async def refresh(request: RefreshRequest, session: AsyncSession = Depends(get_db)):
    result = await refresh_access_token(request.refresh_token, session)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    access_token, access_token_expires_at, new_refresh_token = result
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=_get_expires_in_seconds(access_token_expires_at),
    )


@router.post("/logout")
async def logout(
    request: Optional[LogoutRequest] = None,
    session: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    refresh_token = request.refresh_token if request is not None else None

    if not current_user and not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    if refresh_token:
        revoked = await revoke_refresh_token(
            session,
            refresh_token,
            user_id=current_user.id if current_user else None,
        )
        if not revoked and current_user:
            await UserService(session).revoke_all_refresh_tokens(current_user.id)
    elif current_user:
        await UserService(session).revoke_all_refresh_tokens(current_user.id)

    if current_user:
        await log_analytics_event(
            session,
            event_name="User logged out",
            event_type=AnalyticsEventType.USER_LOGOUT,
            user_id=current_user.id,
        )

    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse, response_model_exclude_none=True)
async def get_me(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    user_service = UserService(session)
    if settings.require_email_verification and not current_user.is_email_verified:
        raise HTTPException(
            status_code=403,
            detail="Email verification is required before accessing this resource.",
        )
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        plan=current_user.plan,
        created_at=current_user.created_at,
        is_active=current_user.is_active,
        is_email_verified=current_user.is_email_verified,
        preferred_locale=await user_service.get_user_locale(current_user.id),
    )


@router.put("/locale", response_model=PreferredLocaleResponse, response_model_exclude_none=True)
async def update_preferred_locale(
    request: UpdatePreferredLocaleRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_service = UserService(session)
    normalized_locale = normalize_preferred_locale(request.preferred_locale)

    if normalized_locale is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported locale",
        )

    preferred_locale = await user_service.set_user_locale(current_user, normalized_locale)
    return PreferredLocaleResponse(preferred_locale=preferred_locale)


# New request models for password reset and email verification
class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    email_link_origin: str | None = None


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr
    verification_origin: str | None = None


class MessageResponse(BaseModel):
    message: str


class OAuthAuthorizeResponse(BaseModel):
    authorization_url: str


class OAuthExchangeRequest(BaseModel):
    code: str
    redirect_uri: str
    preferred_locale: str | None = None


VERIFICATION_EMAIL_RESPONSE_MESSAGE = (
    "If an account exists and is not verified, a verification email has been sent"
)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: ForgotPasswordRequest, session: AsyncSession = Depends(get_db)):
    """Request a password reset email."""
    user_service = UserService(session)

    user = await user_service.get_user_by_email(request.email)
    if user:
        # Only send email if user exists (don't reveal if email exists)
        # Create reset token
        token = await user_service.create_password_reset_token(user.id)
        # Send email
        send_password_reset_email(
            user.email,
            user.name,
            token,
            frontend_url=_resolve_frontend_origin(request.email_link_origin),
        )

    # Always return success to prevent email enumeration
    return MessageResponse(
        message="If an account exists with this email, a password reset link has been sent"
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest, session: AsyncSession = Depends(get_db)):
    """Reset password using token."""
    user_service = UserService(session)

    # Validate password strength
    is_valid, error_message = validate_password_strength(request.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message,
        )

    # Reset password
    user = await user_service.reset_password(request.token, request.new_password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    await user_service.revoke_all_refresh_tokens(user.id)

    return MessageResponse(message="Password has been reset successfully")


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(request: VerifyEmailRequest, session: AsyncSession = Depends(get_db)):
    """Verify email with token."""
    user_service = UserService(session)

    user = await user_service.verify_email(request.token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    return MessageResponse(message="Email has been verified successfully")


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    request: ResendVerificationRequest, session: AsyncSession = Depends(get_db)
):
    """Resend verification email."""
    user_service = UserService(session)

    user = await user_service.get_user_by_email(request.email)
    if not user:
        # Don't reveal if email exists
        return MessageResponse(message=VERIFICATION_EMAIL_RESPONSE_MESSAGE)

    if user.is_email_verified:
        return MessageResponse(message=VERIFICATION_EMAIL_RESPONSE_MESSAGE)

    # Create new verification token
    token = await user_service.create_email_verification_token(user.id)
    # Send email
    send_verification_email(
        user.email,
        user.name,
        token,
        frontend_url=_resolve_frontend_origin(request.verification_origin),
    )

    return MessageResponse(message=VERIFICATION_EMAIL_RESPONSE_MESSAGE)


@router.get("/oauth/{provider}/authorize", response_model=OAuthAuthorizeResponse)
async def authorize_oauth(provider: OAuthProvider, redirect_uri: str, state: str):
    validated_redirect_uri = _validate_oauth_redirect_uri(provider, redirect_uri)
    client_id = get_provider_client_id(provider)

    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{provider.value.title()} OAuth is not configured.",
        )

    return OAuthAuthorizeResponse(
        authorization_url=build_authorization_url(
            provider,
            client_id=client_id,
            redirect_uri=validated_redirect_uri,
            state=state,
        )
    )


@router.post(
    "/oauth/{provider}/exchange",
    response_model=TokenResponse,
    response_model_exclude_none=True,
)
async def exchange_oauth_code(
    provider: OAuthProvider,
    request: OAuthExchangeRequest,
    session: AsyncSession = Depends(get_db),
):
    validated_redirect_uri = _validate_oauth_redirect_uri(provider, request.redirect_uri)
    user_service = UserService(session)

    try:
        profile = await exchange_code_for_user_profile(
            provider,
            code=request.code,
            redirect_uri=validated_redirect_uri,
        )
    except SocialAuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    user = await user_service.get_or_create_user_for_oauth(profile)
    preferred_locale = await user_service.initialize_user_locale(user, request.preferred_locale)
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access_token, access_token_expires_at, refresh_token = await issue_token_pair(session, user.id)

    await log_analytics_event(
        session,
        event_name="User logged in",
        event_type=AnalyticsEventType.USER_LOGIN,
        user_id=user.id,
        properties={"provider": provider.value},
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=_get_expires_in_seconds(access_token_expires_at),
        preferred_locale=preferred_locale,
    )


# SSO OAuth Routes


class SSOCallbackResponse(BaseModel):
    """Response model for SSO callback."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400


class SSOUserInfo(BaseModel):
    """SSO user information from token."""

    sub: str
    email: str
    roles: list[str]
    exp: datetime

    model_config = ConfigDict(from_attributes=True)


def _build_sso_authorization_url(
    provider: str,
    client_id: str,
    redirect_uri: str,
    state: str,
) -> tuple[str, str]:
    """
    Build the SSO provider authorization URL.

    Returns tuple of (authorization_url, state)
    """
    from src.api.services.auth import SSOProvider

    # Provider-specific authorization endpoints
    auth_urls = {
        SSOProvider.OKTA.value: "{domain}/oauth2/v1/authorize",
        SSOProvider.AUTH0.value: "{domain}/authorize",
        SSOProvider.KEYCLOAK.value: "{domain}/realms/{realm}/protocol/openid-connect/auth",
        SSOProvider.GOOGLE.value: "https://accounts.google.com/o/oauth2/v2/auth",
    }

    # Build scopes per provider
    scopes = {
        SSOProvider.OKTA.value: "openid email profile groups",
        SSOProvider.AUTH0.value: "openid email profile",
        SSOProvider.KEYCLOAK.value: "openid email profile roles",
        SSOProvider.GOOGLE.value: "openid email profile",
    }

    provider_lower = provider.lower()

    if provider_lower not in auth_urls:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported SSO provider: {provider}",
        )

    # Get domain config
    domain_attr = f"{provider_lower}_domain"
    domain = getattr(settings, domain_attr, None)
    realm = (
        getattr(settings, f"{provider_lower}_realm", None) if provider_lower == "keycloak" else None
    )

    if not domain:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No domain configured for SSO provider: {provider}",
        )

    auth_url_template = auth_urls[provider_lower]
    scope = scopes[provider_lower]

    if provider_lower == SSOProvider.KEYCLOAK.value and realm:
        auth_url = auth_url_template.format(domain=domain, realm=realm)
    else:
        auth_url = auth_url_template.format(domain=domain)

    # Build authorization URL with query parameters
    from urllib.parse import urlencode

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": scope,
        "state": state,
    }

    if provider_lower == SSOProvider.GOOGLE.value:
        params["redirect_uri"] = redirect_uri
        params["access_type"] = "offline"
        params["prompt"] = "consent"

    auth_url = f"{auth_url}?{urlencode(params)}"

    return auth_url, state


async def _exchange_code_for_token(
    provider: str,
    code: str,
    redirect_uri: str,
    client_id: str,
    client_secret: str | None = None,
) -> dict:
    """
    Exchange authorization code for access token.

    Returns the token response from the SSO provider.
    """
    import httpx
    from src.api.services.auth import SSOProvider

    # Provider token endpoints
    token_urls = {
        SSOProvider.OKTA.value: "{domain}/oauth2/v1/token",
        SSOProvider.AUTH0.value: "{domain}/oauth/token",
        SSOProvider.KEYCLOAK.value: "{domain}/realms/{realm}/protocol/openid-connect/token",
        SSOProvider.GOOGLE.value: "https://oauth2.googleapis.com/token",
    }

    provider_lower = provider.lower()
    domain_attr = f"{provider_lower}_domain"
    domain = getattr(settings, domain_attr, None)
    realm = (
        getattr(settings, f"{provider_lower}_realm", None) if provider_lower == "keycloak" else None
    )

    if not domain:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No domain configured for SSO provider: {provider}",
        )

    token_url_template = token_urls[provider_lower]
    if provider_lower == SSOProvider.KEYCLOAK.value and realm:
        token_url = token_url_template.format(domain=domain, realm=realm)
    else:
        token_url = token_url_template.format(domain=domain)

    # Build token request
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": client_id,
    }

    if client_secret:
        data["client_secret"] = client_secret

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            token_url,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        response.raise_for_status()
        return response.json()


@router.get("/sso/{provider}", tags=["auth"])
async def sso_redirect(
    provider: str,
    request: Request,
):
    """
    Initiate SSO authentication by redirecting to the provider's authorization endpoint.

    Returns a redirect to the SSO provider's authorization URL with appropriate
    client_id, redirect_uri, scope, and state parameters.
    """
    import secrets

    # Validate provider
    from src.api.services.auth import SSOProvider

    try:
        SSOProvider(provider.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported SSO provider: {provider}",
        )

    # Get client configuration
    client_id = getattr(settings, f"{provider.lower()}_client_id", None)
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No client_id configured for SSO provider: {provider}",
        )

    # Build redirect URI (callback URL)
    callback_base = str(request.base_url).rstrip("/")
    redirect_uri = f"{callback_base}/v1/auth/sso/{provider}/callback"

    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)

    # Build authorization URL
    auth_url, _ = _build_sso_authorization_url(
        provider=provider,
        client_id=client_id,
        redirect_uri=redirect_uri,
        state=state,
    )

    # Redirect to provider
    from fastapi import RedirectResponse

    return RedirectResponse(url=auth_url, status_code=status.HTTP_302_FOUND)


@router.get("/sso/{provider}/callback", response_model=SSOCallbackResponse, tags=["auth"])
async def sso_callback(
    provider: str,
    code: str,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    session: AsyncSession = Depends(get_db),
):
    """
    Handle SSO callback from the identity provider.

    Exchanges the authorization code for an access token from the SSO provider,
    verifies the token, and issues a MUTX JWT access token.
    """
    from src.api.services.auth import (
        SSOProvider,
        create_access_token,
        verify_oauth_token,
    )

    # Check for error from provider
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SSO error: {error_description or error}",
        )

    # Validate provider
    try:
        sso_provider = SSOProvider(provider.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported SSO provider: {provider}",
        )

    # Get client configuration
    client_id = getattr(settings, f"{provider.lower()}_client_id", None)
    client_secret = getattr(settings, f"{provider.lower()}_client_secret", None)

    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No client_id configured for SSO provider: {provider}",
        )

    # Build redirect URI (must match the one used in initial request)
    # For production, this would typically come from config
    redirect_uri = f"http://localhost:3000/v1/auth/sso/{provider}/callback"

    try:
        # Exchange code for token with SSO provider
        token_response = await _exchange_code_for_token(
            provider=provider,
            code=code,
            redirect_uri=redirect_uri,
            client_id=client_id,
            client_secret=client_secret,
        )

        # Get the access token
        access_token = token_response.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No access token returned from SSO provider",
            )

        # Verify the OAuth token and extract user info
        token_payload = await verify_oauth_token(
            token=access_token,
            provider=sso_provider,
        )

        # Issue MUTX JWT access token
        mutx_access_token = create_access_token(
            payload=token_payload,
            secret=settings.jwt_secret,
        )

        return SSOCallbackResponse(
            access_token=mutx_access_token,
            token_type="bearer",
            expires_in=86400,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SSO authentication failed: {str(e)}",
        )
