"""
Tests for /auth endpoints.
"""
import pytest
import pytest_asyncio
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
    async def test_register_duplicate_email(self, client_no_auth: AsyncClient, db_session: AsyncSession):
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
    async def test_login_invalid_password(self, client_no_auth: AsyncClient, db_session: AsyncSession):
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
    async def test_refresh_token_success(self, client_no_auth: AsyncClient, db_session: AsyncSession):
        """Test token refresh."""
        from src.api.auth.jwt import create_refresh_token
        
        # Create a user with a valid refresh token
        user = User(
            id=uuid.uuid4(),
            email="refresh@example.com",
            password_hash="hashedpassword",
            name="Refresh User",
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        
        refresh_token, _ = create_refresh_token(user.id)
        
        response = await client_no_auth.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self, client_no_auth: AsyncClient):
        """Test token refresh with invalid token fails."""
        response = await client_no_auth.post(
            "/api/auth/refresh",
            json={"refresh_token": "invalid_token"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_logout_success(self, client: AsyncClient, test_user):
        """Test logout endpoint."""
        response = await client.post("/api/auth/logout")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_forgot_password_success(self, client_no_auth: AsyncClient, db_session: AsyncSession):
        """Test forgot password endpoint."""
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
        assert "message" in response.json()

    @pytest.mark.asyncio
    async def test_forgot_password_nonexistent(self, client_no_auth: AsyncClient):
        """Test forgot password with nonexistent email."""
        response = await client_no_auth.post(
            "/api/auth/forgot-password",
            json={"email": "nonexistent@example.com"},
        )
        # Should still return 200 to prevent email enumeration
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_reset_password_success(self, client_no_auth: AsyncClient, db_session: AsyncSession):
        """Test reset password endpoint."""
        from src.api.auth.password import hash_password
        
        user = User(
            id=uuid.uuid4(),
            email="reset@example.com",
            password_hash=hash_password("OldPassword123!"),
            name="Reset User",
            is_active=True,
            password_reset_token="valid_reset_token",
            password_reset_expires_at=None,  # Never expires for test
        )
        db_session.add(user)
        await db_session.commit()
        
        response = await client_no_auth.post(
            "/api/auth/reset-password",
            json={
                "token": "valid_reset_token",
                "new_password": "NewPassword456!",
            },
        )
        assert response.status_code == 200
        assert "message" in response.json()

    @pytest.mark.asyncio
    async def test_reset_password_invalid_token(self, client_no_auth: AsyncClient):
        """Test reset password with invalid token fails."""
        response = await client_no_auth.post(
            "/api/auth/reset-password",
            json={
                "token": "invalid_token",
                "new_password": "NewPassword456!",
            },
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_verify_email_success(self, client_no_auth: AsyncClient, db_session: AsyncSession):
        """Test email verification endpoint."""
        from src.api.auth.password import hash_password
        
        user = User(
            id=uuid.uuid4(),
            email="verify@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Verify User",
            is_active=True,
            email_verification_token="valid_verify_token",
            is_email_verified=False,
        )
        db_session.add(user)
        await db_session.commit()
        
        response = await client_no_auth.post(
            "/api/auth/verify-email",
            json={"token": "valid_verify_token"},
        )
        assert response.status_code == 200
        assert "message" in response.json()

    @pytest.mark.asyncio
    async def test_verify_email_invalid_token(self, client_no_auth: AsyncClient):
        """Test verify email with invalid token fails."""
        response = await client_no_auth.post(
            "/api/auth/verify-email",
            json={"token": "invalid_token"},
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_resend_verification_success(self, client_no_auth: AsyncClient, db_session: AsyncSession):
        """Test resend verification email endpoint."""
        from src.api.auth.password import hash_password
        
        user = User(
            id=uuid.uuid4(),
            email="resend@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Resend User",
            is_active=True,
            is_email_verified=False,
        )
        db_session.add(user)
        await db_session.commit()
        
        response = await client_no_auth.post(
            "/api/auth/resend-verification",
            json={"email": "resend@example.com"},
        )
        assert response.status_code == 200
        assert "message" in response.json()

    @pytest.mark.asyncio
    async def test_resend_verification_already_verified(self, client_no_auth: AsyncClient, db_session: AsyncSession):
        """Test resend verification for already verified email."""
        from src.api.auth.password import hash_password
        
        user = User(
            id=uuid.uuid4(),
            email="alreadyverified@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Already Verified User",
            is_active=True,
            is_email_verified=True,
        )
        db_session.add(user)
        await db_session.commit()
        
        response = await client_no_auth.post(
            "/api/auth/resend-verification",
            json={"email": "alreadyverified@example.com"},
        )
        assert response.status_code == 400
        assert "already verified" in response.json()["detail"].lower()
