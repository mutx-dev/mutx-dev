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
