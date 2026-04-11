import pytest
from httpx import AsyncClient


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
