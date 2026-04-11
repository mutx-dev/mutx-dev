import pytest
from httpx import AsyncClient

import src.api.routes.rag as rag_mod


@pytest.mark.asyncio
async def test_generate_embedding_returns_local_embedding_without_openai_key(
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
    assert any(value != 0.0 for value in payload["embedding"])


@pytest.mark.asyncio
async def test_similarity_search_returns_ranked_results_after_ingest(client: AsyncClient):
    try:
        rag_mod._get_vector_store_components()
    except ImportError:
        pytest.skip("vector store dependencies unavailable in this environment")

    ingest_response = await client.post(
        "/v1/rag/ingest",
        json={
            "texts": [
                "python api design patterns",
                "gardening tips for tomatoes",
                "async fastapi route testing",
            ]
        },
    )
    assert ingest_response.status_code == 200

    response = await client.post(
        "/v1/rag/search",
        json={"query": "fastapi api testing", "top_k": 2},
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 2
    assert payload[0]["text"] in {
        "python api design patterns",
        "async fastapi route testing",
    }
    assert payload[0]["score"] >= payload[1]["score"]


@pytest.mark.asyncio
async def test_similarity_search_returns_503_when_vector_store_deps_missing(
    client: AsyncClient,
    monkeypatch,
):
    def raise_import_error():
        raise ImportError("vector store deps missing")

    monkeypatch.setattr(rag_mod, "_get_vector_store_components", raise_import_error)

    response = await client.post(
        "/v1/rag/search",
        json={"query": "fastapi api testing", "top_k": 2},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "RAG search dependencies are not available in this environment."


@pytest.mark.asyncio
async def test_ingest_returns_503_when_vector_store_deps_missing(
    client: AsyncClient,
    monkeypatch,
):
    def raise_import_error():
        raise ImportError("vector store deps missing")

    monkeypatch.setattr(rag_mod, "_get_vector_store_components", raise_import_error)

    response = await client.post(
        "/v1/rag/ingest",
        json={"texts": ["async fastapi route testing"]},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "RAG ingestion is not available — vector store dependencies missing."
