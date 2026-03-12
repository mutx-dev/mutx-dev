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
            "/auth/register",
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
            "/auth/login",
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
        response = await client.get("/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["id"] == str(test_user.id)

    @pytest.mark.asyncio
    async def test_refresh_token_success(self, client_no_auth: AsyncClient, db_session: AsyncSession):
        """Test refreshing an access token."""
        from src.api.auth.password import hash_password
        from src.api.auth.jwt import create_refresh_token
        
        # Create a user
        user = User(
            id=uuid.uuid4(),
            email="refresh@example.com",
            password_hash=hash_password("StrongPassword123!"),
            name="Refresh User",
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        
        # Create a real refresh token
        refresh_token, _ = create_refresh_token(user.id)
        
        response = await client_no_auth.post(
            "/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "expires_in" in data

    @pytest.mark.asyncio
    async def test_logout_success(self, client: AsyncClient):
        """Test user logout."""
        response = await client.post("/auth/logout")
        assert response.status_code == 200
        assert response.json() == {"message": "Successfully logged out"}

    @pytest.mark.asyncio
    async def test_forgot_password_flow_step1(self, client_no_auth: AsyncClient, db_session: AsyncSession):
        """Test the forgot password request endpoint."""
        from src.api.auth.password import hash_password
        
        # Create a user
        user = User(
            id=uuid.uuid4(),
            email="forgot@example.com",
            password_hash=hash_password("OldPassword123!"),
            name="Forgot User",
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        
        response = await client_no_auth.post(
            "/auth/forgot-password",
            json={"email": "forgot@example.com"},
        )
        
        assert response.status_code == 200
        assert "sent" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_verify_email_invalid_token(self, client_no_auth: AsyncClient):
        """Test verifying email with an invalid token."""
        response = await client_no_auth.post(
            "/auth/verify-email",
            json={"token": "invalid-token-123"},
        )
        assert response.status_code == 400
        assert "Invalid or expired" in response.json()["detail"]
