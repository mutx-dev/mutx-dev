"""
Tests for /rag endpoints.
"""
import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient


class TestRagHealthEndpoint:
    """Tests for GET /rag/health."""

    @pytest.mark.asyncio
    async def test_health_returns_200(self, client_no_auth: AsyncClient):
        """Health endpoint should return 200 with expected keys."""
        response = await client_no_auth.get("/v1/rag/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "available"
        assert data["feature"] == "embeddings"
        assert "openai_configured" in data
        assert "supported_models" in data

    @pytest.mark.asyncio
    async def test_health_reports_no_api_key(self, client_no_auth: AsyncClient):
        """Health endpoint should report openai_configured=False when key absent."""
        with patch.dict(os.environ, {}, clear=True):
            response = await client_no_auth.get("/v1/rag/health")
        assert response.status_code == 200
        assert response.json()["openai_configured"] is False


class TestEmbedEndpoint:
    """Tests for POST /rag/embed."""

    @pytest.mark.asyncio
    async def test_embed_placeholder_when_no_api_key(self, client_no_auth: AsyncClient):
        """Returns a zero-vector placeholder when OPENAI_API_KEY is not set."""
        import src.api.routes.rag as rag_module

        original_client = rag_module._client
        try:
            rag_module._client = None
            with patch.dict(os.environ, {}, clear=True):
                response = await client_no_auth.post(
                    "/v1/rag/embed",
                    json={"text": "hello world"},
                )
        finally:
            rag_module._client = original_client

        assert response.status_code == 200
        data = response.json()
        assert data["model"] == "text-embedding-3-small"
        assert len(data["embedding"]) == 1536
        assert all(v == 0.0 for v in data["embedding"])
        assert data["tokens"] == 0

    @pytest.mark.asyncio
    async def test_embed_invalid_model_returns_400(self, client_no_auth: AsyncClient):
        """Unsupported model name should return 400."""
        response = await client_no_auth.post(
            "/v1/rag/embed",
            json={"text": "hello", "model": "gpt-4"},
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_embed_empty_text_returns_422(self, client_no_auth: AsyncClient):
        """Empty text should fail pydantic validation with 422."""
        response = await client_no_auth.post(
            "/v1/rag/embed",
            json={"text": ""},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_embed_missing_text_returns_422(self, client_no_auth: AsyncClient):
        """Missing text field should return 422."""
        response = await client_no_auth.post("/v1/rag/embed", json={})
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_embed_with_large_model(self, client_no_auth: AsyncClient):
        """text-embedding-3-large placeholder has 3072 dimensions."""
        import src.api.routes.rag as rag_module

        original_client = rag_module._client
        try:
            rag_module._client = None
            with patch.dict(os.environ, {}, clear=True):
                response = await client_no_auth.post(
                    "/v1/rag/embed",
                    json={"text": "hello", "model": "text-embedding-3-large"},
                )
        finally:
            rag_module._client = original_client

        assert response.status_code == 200
        assert len(response.json()["embedding"]) == 3072


class TestBatchEmbedEndpoint:
    """Tests for POST /rag/embed/batch."""

    @pytest.mark.asyncio
    async def test_batch_embed_placeholder(self, client_no_auth: AsyncClient):
        """Batch endpoint returns independent zero-vector placeholders per text."""
        import src.api.routes.rag as rag_module

        original_client = rag_module._client
        try:
            rag_module._client = None
            with patch.dict(os.environ, {}, clear=True):
                response = await client_no_auth.post(
                    "/v1/rag/embed/batch",
                    json={"texts": ["hello", "world"]},
                )
        finally:
            rag_module._client = original_client

        assert response.status_code == 200
        data = response.json()
        assert len(data["embeddings"]) == 2
        assert len(data["embeddings"][0]) == 1536
        assert data["total_tokens"] == 0
        # Confirm each row is an independent object (not the same reference)
        data["embeddings"][0][0] = 99.9
        assert data["embeddings"][1][0] == 0.0

    @pytest.mark.asyncio
    async def test_batch_embed_empty_texts_list_returns_422(
        self, client_no_auth: AsyncClient
    ):
        """Empty list for texts should fail validation."""
        response = await client_no_auth.post(
            "/v1/rag/embed/batch",
            json={"texts": []},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_batch_embed_empty_string_in_texts_returns_422(
        self, client_no_auth: AsyncClient
    ):
        """A blank string in texts list should fail validation."""
        response = await client_no_auth.post(
            "/v1/rag/embed/batch",
            json={"texts": ["valid text", ""]},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_batch_embed_invalid_model_returns_400(
        self, client_no_auth: AsyncClient
    ):
        """Unsupported model should return 400."""
        response = await client_no_auth.post(
            "/v1/rag/embed/batch",
            json={"texts": ["hello"], "model": "unknown-model"},
        )
        assert response.status_code == 400


class TestSearchEndpoint:
    """Tests for POST /rag/search."""

    @pytest.mark.asyncio
    async def test_search_returns_empty_list(self, client_no_auth: AsyncClient):
        """Search placeholder returns an empty list."""
        response = await client_no_auth.post(
            "/v1/rag/search",
            json={"query": "find something"},
        )
        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_search_empty_query_returns_422(self, client_no_auth: AsyncClient):
        """Empty query should fail validation."""
        response = await client_no_auth.post(
            "/v1/rag/search",
            json={"query": ""},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_search_top_k_bounds(self, client_no_auth: AsyncClient):
        """top_k must be between 1 and 100."""
        response = await client_no_auth.post(
            "/v1/rag/search",
            json={"query": "hello", "top_k": 0},
        )
        assert response.status_code == 422

        response = await client_no_auth.post(
            "/v1/rag/search",
            json={"query": "hello", "top_k": 101},
        )
        assert response.status_code == 422
