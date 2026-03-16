"""
Tests for /auth endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from src.api.models.models import User


class TestAuthEndpoints:
    """Tests for authentication endpoints."""

    @pytest.mark.asyncio
    async def test_register_success(self, client_no_auth: AsyncClient):
        """Test user registration."""
        response = await client_no_auth.post(
            "/api/auth/register",
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
            "/api/auth/login",
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
    async def test_me_endpoint(self, client: AsyncClient, test_user):
        """Test the /me endpoint."""
        response = await client.get("/api/auth/me")
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
            "/api/auth/register",
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
            "/api/auth/login",
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
            "/api/auth/login",
            json={
                "email": "inactive@example.com",
                "password": "StrongPassword123!",
            },
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_register_weak_password(self, client_no_auth: AsyncClient):
        """Test registration with weak password fails."""
        response = await client_no_auth.post(
            "/api/auth/register",
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
            "/api/auth/login",
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
        response = await client.post("/api/auth/logout")
        assert response.status_code == 200
        assert response.json()["message"] == "Successfully logged out"

    @pytest.mark.asyncio
    async def test_logout_requires_auth(self, client_no_auth: AsyncClient):
        """Test logout requires authentication."""
        response = await client_no_auth.post("/api/auth/logout")
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
            "/api/auth/forgot-password",
            json={"email": "forgot@example.com"},
        )
        assert response.status_code == 200
        # Should return success regardless of whether email exists (to prevent enumeration)
        assert "If an account exists" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_forgot_password_nonexistent_user(self, client_no_auth: AsyncClient):
        """Test forgot password for nonexistent user returns same message."""
        response = await client_no_auth.post(
            "/api/auth/forgot-password",
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
            "/api/auth/resend-verification",
            json={"email": "unverified@example.com"},
        )
        assert response.status_code == 200
        assert "Verification email has been sent" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_resend_verification_already_verified(
        self, client_no_auth: AsyncClient, db_session: AsyncSession
    ):
        """Test resend verification for already verified user fails."""
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
            "/api/auth/resend-verification",
            json={"email": "verified@example.com"},
        )
        assert response.status_code == 400
        assert "already verified" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_resend_verification_nonexistent_user(self, client_no_auth: AsyncClient):
        """Test resend verification for nonexistent user returns success to prevent enumeration."""
        response = await client_no_auth.post(
            "/api/auth/resend-verification",
            json={"email": "nonexistent@example.com"},
        )
        assert response.status_code == 200
