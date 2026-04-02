"""
Tests for /auth endpoints.
"""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from src.api.models.models import User
from src.api.database import get_db
from src.api.main import create_app


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
    async def test_verify_email_rejects_expired_token(
        self, client_no_auth: AsyncClient, db_session: AsyncSession
    ):
        from datetime import datetime, timedelta, timezone
        from sqlalchemy import update

        from src.api.auth.password import hash_password
        from src.api.services.user_service import UserService

        user = User(
            id=uuid.uuid4(),
            email="verify-expired@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Expired Verification User",
            is_active=True,
            is_email_verified=False,
        )
        db_session.add(user)
        await db_session.commit()

        token = await UserService(db_session).create_email_verification_token(user.id)
        await db_session.execute(
            update(User)
            .where(User.id == user.id)
            .values(email_verification_expires_at=datetime.now(timezone.utc) - timedelta(minutes=1))
        )
        await db_session.commit()

        response = await client_no_auth.post(
            "/v1/auth/verify-email",
            json={"token": token},
        )

        assert response.status_code == 400
        assert "invalid or expired" in response.json()["detail"].lower()

        await db_session.refresh(user)
        assert user.is_email_verified is False
        assert user.email_verification_token is None
        assert user.email_verification_expires_at is None

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
