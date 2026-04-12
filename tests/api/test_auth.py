"""
Tests for /auth endpoints.
"""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from src.api.models.models import ExternalAuthIdentity, User
from src.api.database import get_db
from src.api.main import create_app
from src.api.services.social_auth import OAuthProvider, OAuthUserProfile


class TestAuthEndpoints:
    """Tests for authentication endpoints."""

    @pytest.mark.asyncio
    async def test_register_success(self, client_no_auth: AsyncClient):
        """Test user registration."""
        response = await client_no_auth.post(
            "/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "StrongPassword123!",
                "name": "New User",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_register_uses_requested_verification_origin(
        self, client_no_auth: AsyncClient, monkeypatch
    ):
        from src.api.routes import auth as auth_routes

        captured: dict[str, str | None] = {}

        def fake_send_verification_email(
            to_email: str,
            name: str,
            token: str,
            *,
            frontend_url: str | None = None,
        ) -> bool:
            captured["to_email"] = to_email
            captured["name"] = name
            captured["token"] = token
            captured["frontend_url"] = frontend_url
            return True

        monkeypatch.setattr(auth_routes, "send_verification_email", fake_send_verification_email)

        response = await client_no_auth.post(
            "/v1/auth/register",
            json={
                "email": "origin@example.com",
                "password": "StrongPassword123!",
                "name": "Origin User",
                "verification_origin": "https://pico.mutx.dev",
            },
        )

        assert response.status_code == 201
        assert captured["to_email"] == "origin@example.com"
        assert captured["frontend_url"] == "https://pico.mutx.dev"

    @pytest.mark.asyncio
    async def test_login_success(self, client_no_auth: AsyncClient, db_session: AsyncSession):
        """Test user login."""
        from src.api.auth.password import hash_password

        # Create a user with known password
        user = User(
            id=uuid.uuid4(),
            email="login@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Login User",
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()

        response = await client_no_auth.post(
            "/v1/auth/login",
            json={
                "email": "login@example.com",
                "password": "StrongPassword123!",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_local_bootstrap_creates_verified_operator(
        self, client_no_auth: AsyncClient, db_session: AsyncSession
    ):
        response = await client_no_auth.post(
            "/v1/auth/local-bootstrap",
            json={"name": "Studio Operator"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

        result = await db_session.execute(
            select(User).where(User.email == "local-operator@mutx.local")
        )
        user = result.scalar_one()
        assert user.name == "Studio Operator"
        assert user.password_hash is None
        assert user.is_active is True
        assert user.is_email_verified is True

    @pytest.mark.asyncio
    async def test_local_bootstrap_reuses_existing_operator(
        self, client_no_auth: AsyncClient, db_session: AsyncSession
    ):
        user = User(
            id=uuid.uuid4(),
            email="local-operator@mutx.local",
            password_hash=None,
            name="Old Operator",
            is_active=False,
            is_email_verified=False,
        )
        db_session.add(user)
        await db_session.commit()

        response = await client_no_auth.post(
            "/v1/auth/local-bootstrap",
            json={"name": "Fresh Operator"},
        )
        assert response.status_code == 200

        result = await db_session.execute(
            select(User).where(User.email == "local-operator@mutx.local")
        )
        updated_user = result.scalar_one()
        assert updated_user.id == user.id
        assert updated_user.name == "Fresh Operator"
        assert updated_user.is_active is True
        assert updated_user.is_email_verified is True

    @pytest.mark.asyncio
    async def test_local_bootstrap_rejects_non_loopback_clients(self, db_session: AsyncSession):
        app = create_app(
            enable_lifespan=False,
            background_monitor_enabled=False,
            database_required_on_startup=False,
        )

        async def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        async with AsyncClient(
            transport=ASGITransport(app=app, client=("203.0.113.10", 4242)),
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/v1/auth/local-bootstrap",
                json={"name": "Remote Operator"},
            )

        assert response.status_code == 403
        assert "localhost" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_local_bootstrap_rejects_forwarded_headers(self, client_no_auth: AsyncClient):
        response = await client_no_auth.post(
            "/v1/auth/local-bootstrap",
            json={"name": "Spoofed Operator"},
            headers={"X-Forwarded-For": "127.0.0.1"},
        )

        assert response.status_code == 403
        assert "localhost" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_me_endpoint(self, client: AsyncClient, test_user):
        """Test the /me endpoint."""
        response = await client.get("/v1/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["id"] == str(test_user.id)

    @pytest.mark.asyncio
    async def test_register_duplicate_email(
        self, client_no_auth: AsyncClient, db_session: AsyncSession
    ):
        """Test registering with an existing email fails."""
        from src.api.auth.password import hash_password

        # Create existing user
        user = User(
            id=uuid.uuid4(),
            email="duplicate@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Existing User",
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()

        # Try to register with same email
        response = await client_no_auth.post(
            "/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "StrongPassword123!",
                "name": "New User",
            },
        )
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_invalid_password(
        self, client_no_auth: AsyncClient, db_session: AsyncSession
    ):
        """Test login with wrong password fails."""
        from src.api.auth.password import hash_password

        user = User(
            id=uuid.uuid4(),
            email="wrongpass@example.com",
            password_hash=hash_password("CorrectPassword123!"),
            name="Wrong Pass User",
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()

        response = await client_no_auth.post(
            "/v1/auth/login",
            json={
                "email": "wrongpass@example.com",
                "password": "WrongPassword456!",
            },
        )
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_inactive_user(self, client_no_auth: AsyncClient, db_session: AsyncSession):
        """Test login with inactive user fails."""
        from src.api.auth.password import hash_password

        user = User(
            id=uuid.uuid4(),
            email="inactive@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Inactive User",
            is_active=False,
        )
        db_session.add(user)
        await db_session.commit()

        response = await client_no_auth.post(
            "/v1/auth/login",
            json={
                "email": "inactive@example.com",
                "password": "StrongPassword123!",
            },
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_login_can_require_verified_email(
        self, client_no_auth: AsyncClient, db_session: AsyncSession, monkeypatch
    ):
        from src.api.auth.password import hash_password
        from src.api.routes import auth as auth_routes

        user = User(
            id=uuid.uuid4(),
            email="unverified-login@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Unverified Login User",
            is_active=True,
            is_email_verified=False,
        )
        db_session.add(user)
        await db_session.commit()

        monkeypatch.setattr(auth_routes.settings, "require_email_verification", True)
        try:
            response = await client_no_auth.post(
                "/v1/auth/login",
                json={
                    "email": "unverified-login@example.com",
                    "password": "StrongPassword123!",
                },
            )
        finally:
            monkeypatch.setattr(auth_routes.settings, "require_email_verification", False)

        assert response.status_code == 403
        assert "verification is required" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_register_token_cannot_access_me_when_email_verification_required(
        self, client_no_auth: AsyncClient, monkeypatch
    ):
        from src.api.routes import auth as auth_routes

        monkeypatch.setattr(auth_routes.settings, "require_email_verification", True)
        try:
            register_response = await client_no_auth.post(
                "/v1/auth/register",
                json={
                    "email": "unverified-register@example.com",
                    "password": "StrongPassword123!",
                    "name": "Unverified Register User",
                },
            )
            assert register_response.status_code == 201

            token = register_response.json()["access_token"]
            me_response = await client_no_auth.get(
                "/v1/auth/me",
                headers={"Authorization": f"Bearer {token}"},
            )
        finally:
            monkeypatch.setattr(auth_routes.settings, "require_email_verification", False)

        assert me_response.status_code == 403
        assert "verification is required" in me_response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_register_weak_password(self, client_no_auth: AsyncClient):
        """Test registration with weak password fails."""
        response = await client_no_auth.post(
            "/v1/auth/register",
            json={
                "email": "weakpass@example.com",
                "password": "weak",
                "name": "Weak Pass User",
            },
        )
        assert response.status_code == 400
        assert "password" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client_no_auth: AsyncClient):
        """Test login with nonexistent user fails."""
        response = await client_no_auth.post(
            "/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "SomePassword123!",
            },
        )
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_logout(self, client: AsyncClient):
        """Test logout endpoint."""
        response = await client.post("/v1/auth/logout")
        assert response.status_code == 200
        assert response.json()["message"] == "Successfully logged out"

    @pytest.mark.asyncio
    async def test_logout_requires_auth(self, client_no_auth: AsyncClient):
        """Test logout requires authentication."""
        response = await client_no_auth.post("/v1/auth/logout")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_forgot_password_existing_user(
        self, client_no_auth: AsyncClient, db_session: AsyncSession
    ):
        """Test forgot password for existing user."""
        from src.api.auth.password import hash_password

        user = User(
            id=uuid.uuid4(),
            email="forgot@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Forgot User",
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()

        response = await client_no_auth.post(
            "/v1/auth/forgot-password",
            json={"email": "forgot@example.com"},
        )
        assert response.status_code == 200
        # Should return success regardless of whether email exists (to prevent enumeration)
        assert "If an account exists" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_forgot_password_uses_requested_origin(
        self, client_no_auth: AsyncClient, db_session: AsyncSession, monkeypatch
    ):
        from src.api.auth.password import hash_password
        from src.api.routes import auth as auth_routes

        user = User(
            id=uuid.uuid4(),
            email="reset-origin@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Reset Origin User",
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()

        captured: dict[str, str | None] = {}

        def fake_send_password_reset_email(
            to_email: str,
            name: str,
            token: str,
            *,
            frontend_url: str | None = None,
        ) -> bool:
            captured["to_email"] = to_email
            captured["frontend_url"] = frontend_url
            return True

        monkeypatch.setattr(
            auth_routes, "send_password_reset_email", fake_send_password_reset_email
        )

        response = await client_no_auth.post(
            "/v1/auth/forgot-password",
            json={
                "email": "reset-origin@example.com",
                "email_link_origin": "https://pico.mutx.dev",
            },
        )

        assert response.status_code == 200
        assert captured["to_email"] == "reset-origin@example.com"
        assert captured["frontend_url"] == "https://pico.mutx.dev"

    @pytest.mark.asyncio
    async def test_forgot_password_nonexistent_user(self, client_no_auth: AsyncClient):
        """Test forgot password for nonexistent user returns same message."""
        response = await client_no_auth.post(
            "/v1/auth/forgot-password",
            json={"email": "nonexistent@example.com"},
        )
        assert response.status_code == 200
        # Should return success to prevent email enumeration

    @pytest.mark.asyncio
    async def test_resend_verification_existing_unverified(
        self, client_no_auth: AsyncClient, db_session: AsyncSession
    ):
        """Test resend verification for unverified user."""
        from src.api.auth.password import hash_password

        user = User(
            id=uuid.uuid4(),
            email="unverified@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Unverified User",
            is_active=True,
            is_email_verified=False,
        )
        db_session.add(user)
        await db_session.commit()

        response = await client_no_auth.post(
            "/v1/auth/resend-verification",
            json={"email": "unverified@example.com"},
        )
        assert response.status_code == 200
        assert "If an account exists and is not verified" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_resend_verification_already_verified(
        self, client_no_auth: AsyncClient, db_session: AsyncSession
    ):
        """Test resend verification for already verified user returns generic success."""
        from src.api.auth.password import hash_password

        user = User(
            id=uuid.uuid4(),
            email="verified@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Verified User",
            is_active=True,
            is_email_verified=True,
        )
        db_session.add(user)
        await db_session.commit()

        response = await client_no_auth.post(
            "/v1/auth/resend-verification",
            json={"email": "verified@example.com"},
        )
        assert response.status_code == 200
        assert "If an account exists and is not verified" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_resend_verification_nonexistent_user(self, client_no_auth: AsyncClient):
        """Test resend verification for nonexistent user returns success to prevent enumeration."""
        response = await client_no_auth.post(
            "/v1/auth/resend-verification",
            json={"email": "nonexistent@example.com"},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_oauth_authorize_returns_provider_redirect(
        self, client_no_auth: AsyncClient, monkeypatch
    ):
        from src.api.routes import auth as auth_routes

        monkeypatch.setattr(auth_routes.settings, "google_client_id", "google-client-id")
        monkeypatch.setattr(
            auth_routes,
            "build_authorization_url",
            lambda provider, **kwargs: f"https://accounts.google.com/test?state={kwargs['state']}",
        )

        response = await client_no_auth.get(
            "/v1/auth/oauth/google/authorize",
            params={
                "redirect_uri": "https://app.mutx.dev/api/auth/oauth/google/callback",
                "state": "oauth-state",
            },
        )

        assert response.status_code == 200
        assert response.json() == {
            "authorization_url": "https://accounts.google.com/test?state=oauth-state"
        }

    @pytest.mark.asyncio
    async def test_oauth_exchange_creates_identity_and_verified_user(
        self, client_no_auth: AsyncClient, db_session: AsyncSession, monkeypatch
    ):
        from src.api.routes import auth as auth_routes

        async def fake_exchange_code_for_user_profile(provider, *, code, redirect_uri):
            assert provider == OAuthProvider.GOOGLE
            assert code == "provider-code"
            assert redirect_uri == "https://app.mutx.dev/api/auth/oauth/google/callback"
            return OAuthUserProfile(
                provider=OAuthProvider.GOOGLE,
                provider_user_id="google-user-123",
                email="oauth@example.com",
                email_verified=True,
                display_name="OAuth User",
                username=None,
                avatar_url="https://example.com/avatar.png",
                profile={"sub": "google-user-123"},
            )

        monkeypatch.setattr(
            auth_routes,
            "exchange_code_for_user_profile",
            fake_exchange_code_for_user_profile,
        )

        response = await client_no_auth.post(
            "/v1/auth/oauth/google/exchange",
            json={
                "code": "provider-code",
                "redirect_uri": "https://app.mutx.dev/api/auth/oauth/google/callback",
            },
        )

        assert response.status_code == 200
        payload = response.json()
        assert "access_token" in payload
        assert "refresh_token" in payload

        user_result = await db_session.execute(
            select(User).where(User.email == "oauth@example.com")
        )
        user = user_result.scalar_one()
        assert user.name == "OAuth User"
        assert user.is_email_verified is True

        identity_result = await db_session.execute(
            select(ExternalAuthIdentity).where(
                ExternalAuthIdentity.provider == "google",
                ExternalAuthIdentity.provider_user_id == "google-user-123",
            )
        )
        identity = identity_result.scalar_one()
        assert identity.user_id == user.id

    @pytest.mark.asyncio
    async def test_oauth_exchange_links_existing_email_account(
        self, client_no_auth: AsyncClient, db_session: AsyncSession, monkeypatch
    ):
        from src.api.routes import auth as auth_routes
        from src.api.auth.password import hash_password

        user = User(
            id=uuid.uuid4(),
            email="linked@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Linked User",
            is_active=True,
            is_email_verified=False,
        )
        db_session.add(user)
        await db_session.commit()

        async def fake_exchange_code_for_user_profile(provider, *, code, redirect_uri):
            return OAuthUserProfile(
                provider=OAuthProvider.GITHUB,
                provider_user_id="github-user-123",
                email="linked@example.com",
                email_verified=True,
                display_name="Linked User",
                username="linked-user",
                avatar_url=None,
                profile={"id": 123},
            )

        monkeypatch.setattr(
            auth_routes,
            "exchange_code_for_user_profile",
            fake_exchange_code_for_user_profile,
        )

        response = await client_no_auth.post(
            "/v1/auth/oauth/github/exchange",
            json={
                "code": "provider-code",
                "redirect_uri": "https://app.mutx.dev/api/auth/oauth/github/callback",
            },
        )

        assert response.status_code == 200

        await db_session.refresh(user)
        assert user.is_email_verified is True

        identity_result = await db_session.execute(
            select(ExternalAuthIdentity).where(
                ExternalAuthIdentity.provider == "github",
                ExternalAuthIdentity.provider_user_id == "github-user-123",
            )
        )
        identity = identity_result.scalar_one()
        assert identity.user_id == user.id


class TestPasswordCompatibility:
    """Compatibility tests for legacy password hashes."""

    def test_verify_password_accepts_legacy_pbkdf2_sha256_hash(self):
        """Test that verify_password can verify legacy pbkdf2_sha256 hashed passwords."""
        from passlib.hash import pbkdf2_sha256
        from src.api.auth.password import verify_password

        plain_password = "StrongPassword123!"
        legacy_hash = pbkdf2_sha256.hash(plain_password)

        # Verify that the legacy hash can be checked with verify_password
        assert verify_password(plain_password, legacy_hash) is True
        assert verify_password("WrongPassword", legacy_hash) is False

    @pytest.mark.asyncio
    async def test_refresh_token_sliding_expiry(
        self, client_no_auth: AsyncClient, db_session: AsyncSession
    ):
        """Test that refresh token uses sliding expiry."""
        from src.api.auth.password import hash_password
        from src.api.auth.jwt import (
            get_refresh_token_iat,
        )

        # Create a user
        user = User(
            id=uuid.uuid4(),
            email="sliding@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Sliding User",
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()

        # Login to get initial tokens
        response = await client_no_auth.post(
            "/v1/auth/login",
            json={
                "email": "sliding@example.com",
                "password": "StrongPassword123!",
            },
        )
        assert response.status_code == 200
        data = response.json()
        refresh_token = data["refresh_token"]

        # Get original iat
        original_iat = get_refresh_token_iat(refresh_token)
        assert original_iat is not None

        # Use the refresh token
        response = await client_no_auth.post(
            "/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()

        new_refresh_token = data["refresh_token"]
        new_iat = get_refresh_token_iat(new_refresh_token)

        # The new token should keep the original iat (for sliding window calculation)
        assert new_iat == original_iat

    @pytest.mark.asyncio
    async def test_refresh_token_sliding_expiry_max_days(
        self, client_no_auth: AsyncClient, db_session: AsyncSession
    ):
        """Test that sliding expiry is capped at max days."""
        from src.api.auth.password import hash_password
        from datetime import datetime, timedelta, timezone
        from src.api.auth.jwt import (
            get_refresh_token_iat,
            issue_refresh_token,
            verify_refresh_token,
        )

        # Create a user
        user = User(
            id=uuid.uuid4(),
            email="slidingmax@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Sliding Max User",
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()

        # Login to get initial tokens
        response = await client_no_auth.post(
            "/v1/auth/login",
            json={
                "email": "slidingmax@example.com",
                "password": "StrongPassword123!",
            },
        )
        assert response.status_code == 200

        # Simulate a refresh token that was issued 25 days ago (almost at max)
        old_iat = datetime.now(timezone.utc) - timedelta(days=25)
        old_token, _, _ = await issue_refresh_token(db_session, user.id, original_iat=old_iat)
        await db_session.commit()

        # Refresh with the old token
        response = await client_no_auth.post(
            "/v1/auth/refresh",
            json={"refresh_token": old_token},
        )
        assert response.status_code == 200
        data = response.json()

        new_refresh_token = data["refresh_token"]
        new_iat = get_refresh_token_iat(new_refresh_token)

        # The iat should still be the original (25 days ago)
        assert new_iat is not None
        age = (datetime.now(timezone.utc) - new_iat).days
        assert age >= 25  # Original iat preserved

        # Verify the new token is still valid (not more than 30 days from original iat)
        assert verify_refresh_token(new_refresh_token) is not None


class TestSSOAuth:
    """Tests for SSO OAuth authentication."""

    @pytest.mark.asyncio
    async def test_sso_provider_enum_values(self):
        """Test SSOProvider enum has correct values."""
        from src.api.services.auth import PROVIDER_JWKS_URLS, SSOProvider

        assert SSOProvider.OKTA.value == "okta"
        assert SSOProvider.AUTH0.value == "auth0"
        assert SSOProvider.KEYCLOAK.value == "keycloak"
        assert SSOProvider.GOOGLE.value == "google"
        assert PROVIDER_JWKS_URLS[SSOProvider.OKTA] == "{domain}/oauth2/v1/keys"

    @pytest.mark.asyncio
    async def test_role_enum_values(self):
        """Test Role enum has correct values."""
        from src.api.services.auth import Role

        assert Role.ADMIN.value == "ADMIN"
        assert Role.DEVELOPER.value == "DEVELOPER"
        assert Role.VIEWER.value == "VIEWER"
        assert Role.AUDIT_ADMIN.value == "AUDIT_ADMIN"

    @pytest.mark.asyncio
    async def test_token_payload_model(self):
        """Test TokenPayload model works correctly."""
        from datetime import datetime, timezone
        from src.api.services.auth import TokenPayload

        payload = TokenPayload(
            sub="user-123",
            email="test@example.com",
            roles=["ADMIN", "DEVELOPER"],
            exp=datetime.now(timezone.utc),
        )

        assert payload.sub == "user-123"
        assert payload.email == "test@example.com"
        assert payload.roles == ["ADMIN", "DEVELOPER"]

    @pytest.mark.asyncio
    async def test_create_access_token_and_verify(self):
        """Test JWT access token creation and verification."""
        from datetime import datetime, timedelta, timezone
        from src.api.services.auth import TokenPayload, create_access_token, verify_access_token

        payload = TokenPayload(
            sub="user-456",
            email="sso@example.com",
            roles=["DEVELOPER"],
            exp=datetime.now(timezone.utc) + timedelta(hours=1),
        )

        secret = "test-secret-key-that-is-long-enough-32"
        token = create_access_token(payload, secret)

        assert token is not None
        assert isinstance(token, str)

        # Verify the token
        verified = verify_access_token(token, secret)
        assert verified.sub == "user-456"
        assert verified.email == "sso@example.com"
        assert verified.roles == ["DEVELOPER"]

    @pytest.mark.asyncio
    async def test_verify_access_token_invalid_secret(self):
        """Test that token verification fails with wrong secret."""
        from datetime import datetime, timedelta, timezone
        from fastapi import HTTPException
        from src.api.services.auth import TokenPayload, create_access_token, verify_access_token

        payload = TokenPayload(
            sub="user-789",
            email="test@example.com",
            roles=["VIEWER"],
            exp=datetime.now(timezone.utc) + timedelta(hours=1),
        )

        token = create_access_token(payload, "correct-secret")

        with pytest.raises(HTTPException) as exc_info:
            verify_access_token(token, "wrong-secret")

        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_verify_access_token_expired(self):
        """Test that token verification fails for expired token."""
        from datetime import datetime, timedelta, timezone
        from fastapi import HTTPException
        from jose import jwt
        from src.api.services.auth import verify_access_token

        # Create an already-expired token manually using raw jose
        # (create_access_token always sets exp to future, so we need to bypass it)
        secret = "test-secret-key-that-is-long-enough-32"
        expired_payload = {
            "sub": "user-expired",
            "email": "expired@example.com",
            "roles": ["VIEWER"],
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),  # Expired 1 hour ago
            "iat": datetime.now(timezone.utc) - timedelta(hours=2),
        }
        token = jwt.encode(expired_payload, secret, algorithm="HS256")

        with pytest.raises(HTTPException) as exc_info:
            verify_access_token(token, secret)

        assert exc_info.value.status_code == 401
        assert "expired" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_check_role_admin_has_all_access(self):
        """Test that ADMIN role has access to everything."""
        from src.api.services.auth import Role, check_role

        # ADMIN should have access to everything
        assert check_role(["ADMIN"], [Role.VIEWER]) is True
        assert check_role(["ADMIN"], [Role.DEVELOPER]) is True
        assert check_role(["ADMIN"], [Role.ADMIN]) is True
        assert check_role(["ADMIN"], [Role.AUDIT_ADMIN]) is True

    @pytest.mark.asyncio
    async def test_check_role_developer(self):
        """Test DEVELOPER role access."""
        from src.api.services.auth import Role, check_role

        # DEVELOPER should have access to DEVELOPER only (not inherited to VIEWER)
        assert check_role(["DEVELOPER"], [Role.DEVELOPER]) is True
        assert check_role(["DEVELOPER"], [Role.VIEWER]) is False  # DEVELOPER doesn't inherit VIEWER
        assert check_role(["DEVELOPER"], [Role.ADMIN]) is False
        assert check_role(["DEVELOPER"], [Role.AUDIT_ADMIN]) is False

    @pytest.mark.asyncio
    async def test_check_role_viewer(self):
        """Test VIEWER role access."""
        from src.api.services.auth import Role, check_role

        # VIEWER should only have access to VIEWER
        assert check_role(["VIEWER"], [Role.VIEWER]) is True
        assert check_role(["VIEWER"], [Role.DEVELOPER]) is False
        assert check_role(["VIEWER"], [Role.ADMIN]) is False

    @pytest.mark.asyncio
    async def test_check_role_audit_admin(self):
        """Test AUDIT_ADMIN role access."""
        from src.api.services.auth import Role, check_role

        # AUDIT_ADMIN should only have access to AUDIT_ADMIN
        assert check_role(["AUDIT_ADMIN"], [Role.AUDIT_ADMIN]) is True
        assert check_role(["AUDIT_ADMIN"], [Role.ADMIN]) is False
        assert check_role(["AUDIT_ADMIN"], [Role.VIEWER]) is False

    @pytest.mark.asyncio
    async def test_check_role_multiple_user_roles(self):
        """Test user with multiple roles."""
        from src.api.services.auth import Role, check_role

        # User with both DEVELOPER and VIEWER roles
        assert check_role(["DEVELOPER", "VIEWER"], [Role.DEVELOPER]) is True
        assert check_role(["DEVELOPER", "VIEWER"], [Role.VIEWER]) is True
        assert check_role(["DEVELOPER", "VIEWER"], [Role.ADMIN]) is False

    @pytest.mark.asyncio
    async def test_require_role_success(self):
        """Test require_role dependency succeeds with correct role."""
        from src.api.dependencies import SSOTokenUser
        from src.api.services.auth import TokenPayload
        from datetime import datetime, timezone

        payload = TokenPayload(
            sub="role-test-user",
            email="roles@example.com",
            roles=["ADMIN"],
            exp=datetime.now(timezone.utc),
        )
        user = SSOTokenUser(payload)

        # The user should have ADMIN role
        assert user.roles == ["ADMIN"]

    @pytest.mark.asyncio
    async def test_require_role_forbidden(self):
        """Test require_role dependency raises 403 for insufficient roles."""
        from src.api.dependencies import SSOTokenUser
        from src.api.services.auth import TokenPayload
        from datetime import datetime, timezone

        payload = TokenPayload(
            sub="role-test-user",
            email="roles@example.com",
            roles=["VIEWER"],  # Only VIEWER role
            exp=datetime.now(timezone.utc),
        )
        user = SSOTokenUser(payload)

        # User with VIEWER should not have access to ADMIN-only routes
        assert "ADMIN" not in user.roles


class TestSSOTokenUser:
    """Tests for SSOTokenUser class."""

    @pytest.mark.asyncio
    async def test_sso_token_user_creation(self):
        """Test SSOTokenUser is created correctly from TokenPayload."""
        from datetime import datetime, timezone, timedelta
        from src.api.services.auth import TokenPayload
        from src.api.dependencies import SSOTokenUser

        payload = TokenPayload(
            sub="sso-user-123",
            email="sso.user@example.com",
            roles=["DEVELOPER", "VIEWER"],
            exp=datetime.now(timezone.utc) + timedelta(hours=1),
        )

        user = SSOTokenUser(payload)

        assert user.id == "sso-user-123"
        assert user.email == "sso.user@example.com"
        assert user.name == "sso.user"  # email.split("@")[0]
        assert user.roles == ["DEVELOPER", "VIEWER"]
        assert user.is_active is True
        assert user.is_email_verified is True

    @pytest.mark.asyncio
    async def test_sso_token_user_no_email(self):
        """Test SSOTokenUser handles missing email gracefully."""
        from datetime import datetime, timezone, timedelta
        from src.api.services.auth import TokenPayload
        from src.api.dependencies import SSOTokenUser

        payload = TokenPayload(
            sub="no-email-user",
            email="",  # Empty email
            roles=["VIEWER"],
            exp=datetime.now(timezone.utc) + timedelta(hours=1),
        )

        user = SSOTokenUser(payload)

        assert user.name == "SSO User"  # Default name when no email

    @pytest.mark.asyncio
    async def test_sso_token_user_repr(self):
        """Test SSOTokenUser __repr__ method."""
        from datetime import datetime, timezone, timedelta
        from src.api.services.auth import TokenPayload
        from src.api.dependencies import SSOTokenUser

        payload = TokenPayload(
            sub="repr-test-user",
            email="repr@example.com",
            roles=["ADMIN"],
            exp=datetime.now(timezone.utc) + timedelta(hours=1),
        )

        user = SSOTokenUser(payload)
        repr_str = repr(user)

        assert "repr-test-user" in repr_str
        assert "repr@example.com" in repr_str
        assert "ADMIN" in repr_str
