"""
Tests for OpenAPI spec auto-generation.
"""

import pytest
from httpx import AsyncClient


class TestOpenAPISpec:
    """Tests for the /openapi.json endpoint and spec validity."""

    @pytest.mark.asyncio
    async def test_openapi_endpoint_returns_200(self, client: AsyncClient):
        """Test that the /openapi.json endpoint returns HTTP 200."""
        response = await client.get("/openapi.json")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_openapi_spec_is_valid_json(self, client: AsyncClient):
        """Test that the OpenAPI spec is valid JSON."""
        response = await client.get("/openapi.json")
        assert response.status_code == 200
        spec = response.json()
        assert isinstance(spec, dict)

    @pytest.mark.asyncio
    async def test_openapi_spec_has_required_fields(self, client: AsyncClient):
        """Test that the OpenAPI spec contains required top-level fields."""
        response = await client.get("/openapi.json")
        spec = response.json()
        assert "openapi" in spec
        assert "info" in spec
        assert "paths" in spec

    @pytest.mark.asyncio
    async def test_openapi_spec_info(self, client: AsyncClient):
        """Test that the OpenAPI spec info fields are populated."""
        response = await client.get("/openapi.json")
        spec = response.json()
        info = spec["info"]
        assert info.get("title") is not None
        assert info.get("version") is not None

    @pytest.mark.asyncio
    async def test_openapi_spec_has_paths(self, client: AsyncClient):
        """Test that the OpenAPI spec exposes API paths."""
        response = await client.get("/openapi.json")
        spec = response.json()
        paths = spec["paths"]
        assert len(paths) > 0

    @pytest.mark.asyncio
    async def test_openapi_spec_version(self, client: AsyncClient):
        """Test that the OpenAPI spec uses OpenAPI 3.x."""
        response = await client.get("/openapi.json")
        spec = response.json()
        assert spec["openapi"].startswith("3.")
