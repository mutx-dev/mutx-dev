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
