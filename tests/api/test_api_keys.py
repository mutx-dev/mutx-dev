"""
Tests for /api-keys endpoints.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from src.api.models.models import APIKey


class TestListAPIKeys:
    """Tests for GET /api-keys endpoint."""
    
    @pytest.mark.asyncio
    async def test_list_api_keys_empty(self, client: AsyncClient):
        """Test listing API keys when none exist."""
        response = await client.get("/api-keys")
        assert response.status_code == 200
        assert response.json() == []
    
    @pytest.mark.asyncio
    async def test_list_api_keys_with_data(
        self, client: AsyncClient, db_session: AsyncSession, test_user
    ):
        """Test listing API keys returns user's keys."""
        # Create an API key
        key = APIKey(
            id=uuid.uuid4(),
            user_id=test_user.id,
            key_hash="hashed_key",
            name="test-key",
            is_active=True,
        )
        db_session.add(key)
        await db_session.commit()
        
        response = await client.get("/api-keys")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "test-key"


class TestCreateAPIKey:
    """Tests for POST /api-keys endpoint."""
    
    @pytest.mark.asyncio
    async def test_create_api_key_success(self, client: AsyncClient):
        """Test creating an API key successfully."""
        response = await client.post(
            "/api-keys",
            json={
                "name": "new-key",
                "expires_in_days": 30,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "new-key"
        assert "key" in data
        assert data["key"].startswith("mutx_live_")
    
    @pytest.mark.asyncio
    async def test_create_api_key_minimal(self, client: AsyncClient):
        """Test creating an API key with minimal data."""
        response = await client.post(
            "/api-keys",
            json={"name": "minimal-key"},
        )
        assert response.status_code == 201
        assert response.json()["name"] == "minimal-key"


class TestRevokeAPIKey:
    """Tests for DELETE /api-keys/{key_id} endpoint."""
    
    @pytest.mark.asyncio
    async def test_revoke_api_key_success(
        self, client: AsyncClient, db_session: AsyncSession, test_user
    ):
        """Test revoking an API key."""
        key = APIKey(
            id=uuid.uuid4(),
            user_id=test_user.id,
            key_hash="hashed_key",
            name="to-revoke",
            is_active=True,
        )
        db_session.add(key)
        await db_session.commit()
        
        response = await client.delete(f"/api-keys/{key.id}")
        assert response.status_code == 204
        
        # Verify it's gone
        result = await db_session.get(APIKey, key.id)
        assert result is None
    
    @pytest.mark.asyncio
    async def test_revoke_api_key_not_found(self, client: AsyncClient):
        """Test revoking non-existent API key returns 404."""
        response = await client.delete(f"/api-keys/{uuid.uuid4()}")
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_revoke_other_user_forbidden(
        self, client: AsyncClient, db_session: AsyncSession, other_user
    ):
        """Test that users cannot revoke other users' API keys."""
        key = APIKey(
            id=uuid.uuid4(),
            user_id=other_user.id,
            key_hash="other_hash",
            name="other-key",
            is_active=True,
        )
        db_session.add(key)
        await db_session.commit()
        
        response = await client.delete(f"/api-keys/{key.id}")
        assert response.status_code == 404  # Not found for this user


class TestRotateAPIKey:
    """Tests for POST /api-keys/{key_id}/rotate endpoint."""
    
    @pytest.mark.asyncio
    async def test_rotate_api_key_success(
        self, client: AsyncClient, db_session: AsyncSession, test_user
    ):
        """Test rotating an API key."""
        key = APIKey(
            id=uuid.uuid4(),
            user_id=test_user.id,
            key_hash="old_hash",
            name="to-rotate",
            is_active=True,
        )
        db_session.add(key)
        await db_session.commit()
        
        response = await client.post(f"/api-keys/{key.id}/rotate")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "to-rotate"
        assert "key" in data
        assert data["key"].startswith("mutx_live_")
        
        # Verify old key is gone
        result = await db_session.get(APIKey, key.id)
        assert result is None
