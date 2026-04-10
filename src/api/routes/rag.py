"""RAG and Vector endpoints for embeddings and similarity search."""

import os
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.api.config import get_settings
from src.api.middleware.auth import get_current_user
from src.api.models import User
from src.api.services.usage import track_usage_best_effort

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["rag"])
settings = get_settings()
MAX_EMBED_TEXT_LENGTH = 8000
MAX_BATCH_TEXTS = 32
MAX_BATCH_TOTAL_LENGTH = 32000
MAX_SEARCH_QUERY_LENGTH = 4000
MAX_SEARCH_TOP_K = 20


class EmbedRequest(BaseModel):
    """Request model for embedding generation."""

    text: str
    model: str = "text-embedding-3-small"


class EmbedResponse(BaseModel):
    """Response model for embedding generation."""

    embedding: list[float]
    model: str
    tokens: int


# Supported embedding models and their dimensions
EMBEDDING_MODELS = {
    "text-embedding-3-small": 1536,
    "text-embedding-3-large": 3072,
    "text-embedding-ada-002": 1536,
}


def get_client():
    """Get OpenAI client with API key from environment."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY not set - embeddings will use placeholder")
        return None
    from openai import AsyncOpenAI

    return AsyncOpenAI(api_key=api_key)


def require_enabled_rag_api() -> None:
    if not settings.enable_rag_api:
        raise HTTPException(status_code=404, detail="RAG API is disabled")


def validate_text_payload(text: str, *, field_name: str = "text", max_length: int) -> None:
    if not text.strip():
        raise HTTPException(status_code=400, detail=f"{field_name} must not be empty")
    if len(text) > max_length:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} exceeds maximum length of {max_length} characters",
        )


@router.post("/embed", response_model=EmbedResponse)
async def generate_embedding(
    request: EmbedRequest,
    current_user: User = Depends(get_current_user),
) -> EmbedResponse:
    """
    Generate embeddings for text input using OpenAI's embedding models.

    Supports text-embedding-3-small, text-embedding-3-large, and text-embedding-ada-002.
    """
    require_enabled_rag_api()
    validate_text_payload(request.text, max_length=MAX_EMBED_TEXT_LENGTH)
    client = get_client()

    # Validate model
    if request.model not in EMBEDDING_MODELS:
        raise HTTPException(
            status_code=400, detail=f"Unsupported model. Supported: {list(EMBEDDING_MODELS.keys())}"
        )

    logger.info(
        "RAG embedding request accepted",
        extra={
            "user_id": str(current_user.id),
            "model": request.model,
            "text_length": len(request.text),
        },
    )

    if client is None:
        # Fallback to placeholder if no API key
        dimension = EMBEDDING_MODELS[request.model]
        embedding = [0.0] * dimension
        logger.warning(f"Using placeholder embedding for model {request.model} (no API key)")
        await track_usage_best_effort(
            user_id=current_user.id,
            event_type="rag.embed",
            resource_type="rag",
            resource_id=request.model,
            metadata={"text_length": len(request.text), "mode": "placeholder"},
        )
        return EmbedResponse(
            embedding=embedding, model=request.model, tokens=len(request.text.split())
        )

    try:
        response = await client.embeddings.create(
            model=request.model,
            input=request.text,
        )

        embedding_data = response.data[0]
        await track_usage_best_effort(
            user_id=current_user.id,
            event_type="rag.embed",
            resource_type="rag",
            resource_id=request.model,
            metadata={"text_length": len(request.text), "tokens": embedding_data.usage.tokens},
        )
        return EmbedResponse(
            embedding=embedding_data.embedding,
            model=request.model,
            tokens=embedding_data.usage.tokens,
        )
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")


class BatchEmbedRequest(BaseModel):
    """Request model for batch embedding generation."""

    texts: list[str]
    model: str = "text-embedding-3-small"


class BatchEmbedResponse(BaseModel):
    """Response model for batch embedding generation."""

    embeddings: list[list[float]]
    model: str
    total_tokens: int


@router.post("/embed/batch", response_model=BatchEmbedResponse)
async def generate_batch_embeddings(
    request: BatchEmbedRequest,
    current_user: User = Depends(get_current_user),
) -> BatchEmbedResponse:
    """
    Generate embeddings for multiple texts in a single request.
    """
    require_enabled_rag_api()
    client = get_client()

    if request.model not in EMBEDDING_MODELS:
        raise HTTPException(
            status_code=400, detail=f"Unsupported model. Supported: {list(EMBEDDING_MODELS.keys())}"
        )
    if not request.texts:
        raise HTTPException(status_code=400, detail="texts must not be empty")
    if len(request.texts) > MAX_BATCH_TEXTS:
        raise HTTPException(
            status_code=400,
            detail=f"texts exceeds maximum batch size of {MAX_BATCH_TEXTS}",
        )

    total_length = 0
    for index, text in enumerate(request.texts):
        validate_text_payload(text, field_name=f"texts[{index}]", max_length=MAX_EMBED_TEXT_LENGTH)
        total_length += len(text)

    if total_length > MAX_BATCH_TOTAL_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"batch payload exceeds maximum total length of {MAX_BATCH_TOTAL_LENGTH} characters",
        )

    logger.info(
        "RAG batch embedding request accepted",
        extra={
            "user_id": str(current_user.id),
            "model": request.model,
            "batch_size": len(request.texts),
            "total_length": total_length,
        },
    )

    if client is None:
        dimension = EMBEDDING_MODELS[request.model]
        embeddings = [[0.0] * dimension] * len(request.texts)
        total_tokens = sum(len(t.split()) for t in request.texts)
        await track_usage_best_effort(
            user_id=current_user.id,
            event_type="rag.embed.batch",
            resource_type="rag",
            resource_id=request.model,
            metadata={
                "batch_size": len(request.texts),
                "total_length": total_length,
                "mode": "placeholder",
            },
        )
        return BatchEmbedResponse(
            embeddings=embeddings, model=request.model, total_tokens=total_tokens
        )

    try:
        response = await client.embeddings.create(
            model=request.model,
            input=request.texts,
        )

        # Sort by index to maintain order
        sorted_data = sorted(response.data, key=lambda x: x.index)
        embeddings = [item.embedding for item in sorted_data]
        await track_usage_best_effort(
            user_id=current_user.id,
            event_type="rag.embed.batch",
            resource_type="rag",
            resource_id=request.model,
            metadata={
                "batch_size": len(request.texts),
                "total_length": total_length,
                "tokens": response.usage.tokens,
            },
        )

        return BatchEmbedResponse(
            embeddings=embeddings, model=request.model, total_tokens=response.usage.tokens
        )
    except Exception as e:
        logger.error(f"Batch embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class SearchRequest(BaseModel):
    """Request model for similarity search."""

    query: str
    top_k: int = 5
    model: str = "text-embedding-3-small"


class SearchResult(BaseModel):
    """Single search result."""

    text: str
    score: float


@router.post("/search", response_model=list[SearchResult])
async def similarity_search(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
) -> list[SearchResult]:
    """
    Simple similarity search endpoint.

    Note: Full implementation requires pgvector and a document store.
    This is a placeholder that demonstrates the API contract.
    """
    require_enabled_rag_api()
    validate_text_payload(request.query, field_name="query", max_length=MAX_SEARCH_QUERY_LENGTH)
    if request.top_k < 1 or request.top_k > MAX_SEARCH_TOP_K:
        raise HTTPException(
            status_code=400,
            detail=f"top_k must be between 1 and {MAX_SEARCH_TOP_K}",
        )

    logger.info(
        "RAG similarity search requested",
        extra={
            "user_id": str(current_user.id),
            "model": request.model,
            "top_k": request.top_k,
            "query_length": len(request.query),
        },
    )

    await track_usage_best_effort(
        user_id=current_user.id,
        event_type="rag.search",
        resource_type="rag",
        resource_id=request.model,
        metadata={"top_k": request.top_k, "query_length": len(request.query)},
    )

    # Resolve vector store: try registry first, auto-init from DATABASE_URL if needed
    try:
        from src.api.config import get_settings
        from src.api.integrations.vector_store import (
            EmbeddingProvider,
            VectorStoreConfig,
            VectorStoreRegistry,
            VectorStoreManager,
        )

        store: VectorStoreManager | None = VectorStoreRegistry.get_store("default")

        if store is None:
            # Auto-initialize a default store from DATABASE_URL
            settings_cfg = get_settings()
            db_url = os.environ.get("DATABASE_URL") or settings_cfg.database_url
            if db_url and not db_url.startswith("postgresql"):
                logger.warning("RAG search: DATABASE_URL is not PostgreSQL — search unavailable")
                raise HTTPException(
                    status_code=503,
                    detail="RAG search requires a PostgreSQL database. Please configure DATABASE_URL with a PostgreSQL connection string.",
                )
            if db_url:
                config = VectorStoreConfig(
                    database_url=db_url,
                    embedding_provider=EmbeddingProvider.OPENAI,
                    embedding_model=request.model,
                    collection_name="default",
                )
                store = VectorStoreRegistry.create_store("default", config)

        if store is None:
            raise HTTPException(
                status_code=503,
                detail="No vector store configured. Set DATABASE_URL to a PostgreSQL database to enable RAG search.",
            )

        # Execute similarity search
        results = store.similarity_search_with_score(
            query=request.query,
            k=request.top_k,
        )

        return [
            SearchResult(text=doc.page_content, score=round(score, 4)) for doc, score in results
        ]

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"RAG search failed: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"RAG search failed: {str(exc)}",
        ) from exc


@router.get("/health")
async def rag_health(current_user: User = Depends(get_current_user)):
    """Health check for RAG service."""
    require_enabled_rag_api()
    api_key_present = bool(os.getenv("OPENAI_API_KEY"))
    return {
        "status": "available",
        "feature": "embeddings, search",
        "openai_configured": api_key_present,
        "supported_models": list(EMBEDDING_MODELS.keys()),
    }
