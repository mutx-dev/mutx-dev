import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_generate_embedding_returns_placeholder_without_openai_key(
    client: AsyncClient,
    monkeypatch,
):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    response = await client.post(
        "/v1/rag/embed",
        json={"text": "hello world", "model": "text-embedding-3-small"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["model"] == "text-embedding-3-small"
    assert payload["tokens"] == 2
    assert len(payload["embedding"]) == 1536


@pytest.mark.asyncio
async def test_similarity_search_returns_503_not_implemented(client: AsyncClient):
    response = await client.post(
        "/v1/rag/search",
        json={"query": "find related docs", "top_k": 3},
    )

    assert response.status_code == 503
    assert "not yet implemented" in response.json()["detail"].lower()
    assert "X-Feature-Flag" in response.headers
    assert response.headers["X-Feature-Flag"] == "rag.search"
