"""RAG and Vector endpoints for embeddings and similarity search."""

import os
import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.api.config import get_settings
from src.api.integrations.vector_store import LocalHashEmbeddings
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
        logger.warning("OPENAI_API_KEY not set - falling back to local deterministic embeddings")
        return None
    from openai import AsyncOpenAI

    return AsyncOpenAI(api_key=api_key)


def get_local_embedding_backend(model: str) -> LocalHashEmbeddings:
    return LocalHashEmbeddings(dimensions=EMBEDDING_MODELS[model])


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
        embedding = get_local_embedding_backend(request.model).embed_query(request.text)
        logger.info("Using local deterministic embedding backend for model %s", request.model)
        await track_usage_best_effort(
            user_id=current_user.id,
            event_type="rag.embed",
            resource_type="rag",
            resource_id=request.model,
            metadata={"text_length": len(request.text), "mode": "local_hash"},
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
        embeddings = get_local_embedding_backend(request.model).embed_documents(request.texts)
        total_tokens = sum(len(t.split()) for t in request.texts)
        await track_usage_best_effort(
            user_id=current_user.id,
            event_type="rag.embed.batch",
            resource_type="rag",
            resource_id=request.model,
            metadata={
                "batch_size": len(request.texts),
                "total_length": total_length,
                "mode": "local_hash",
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
    """Run similarity search against the configured default collection."""
    require_enabled_rag_api()
    validate_text_payload(request.query, field_name="query", max_length=MAX_SEARCH_QUERY_LENGTH)
    if request.model not in EMBEDDING_MODELS:
        raise HTTPException(
            status_code=400, detail=f"Unsupported model. Supported: {list(EMBEDDING_MODELS.keys())}"
        )
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

    try:
        from src.api.config import get_settings
        from src.api.integrations.vector_store import (
            EmbeddingProvider,
            VectorStoreConfig,
            VectorStoreRegistry,
            VectorStoreManager,
        )
    except ImportError as imp_err:
        logger.warning("RAG vector store dependencies unavailable: %s", imp_err)
        raise HTTPException(
            status_code=503,
            detail="RAG search dependencies are not available in this environment.",
        ) from imp_err

    try:
        store: VectorStoreManager | None = VectorStoreRegistry.get_store("default")

        if store is None:
            settings_cfg = get_settings()
            db_url = os.environ.get("DATABASE_URL") or settings_cfg.database_url
            if not db_url:
                raise HTTPException(
                    status_code=503,
                    detail="No database configured for RAG search. Set DATABASE_URL to enable the vector store.",
                )
            config = VectorStoreConfig(
                database_url=db_url,
                embedding_provider=EmbeddingProvider.OPENAI,
                embedding_model=request.model,
                embedding_dimensions=EMBEDDING_MODELS[request.model],
                collection_name="default",
            )
            try:
                store = VectorStoreRegistry.create_store("default", config)
            except Exception as init_err:
                logger.warning("RAG auto-init failed for %s: %s", db_url, init_err)
                fallback_config = VectorStoreConfig(
                    database_url="sqlite:///:memory:",
                    embedding_provider=EmbeddingProvider.OPENAI,
                    embedding_model=request.model,
                    embedding_dimensions=EMBEDDING_MODELS[request.model],
                    collection_name="default",
                )
                store = VectorStoreRegistry.create_store("default", fallback_config)

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
        logger.exception("RAG search failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"RAG search failed: {str(exc)}",
        ) from exc


@router.get("/health")
async def rag_health(current_user: User = Depends(get_current_user)):
    """Health check for RAG service."""
    require_enabled_rag_api()
    api_key_present = bool(os.getenv("OPENAI_API_KEY"))

    # Check vector store status
    store_status = "not_configured"
    try:
        from src.api.integrations.vector_store import VectorStoreRegistry

        stores = VectorStoreRegistry.list_stores()
        if stores:
            store_status = f"active ({len(stores)} store(s))"
    except ImportError:
        store_status = "unavailable"

    return {
        "status": "available",
        "feature": "embeddings, search, ingest",
        "openai_configured": api_key_present,
        "vector_store": store_status,
        "supported_models": list(EMBEDDING_MODELS.keys()),
    }


class IngestRequest(BaseModel):
    """Request model for document ingestion."""

    texts: list[str]
    collection_name: str = "default"
    model: str = "text-embedding-3-small"
    metadatas: Optional[list[dict[str, Any]]] = None
    ids: Optional[list[str]] = None


class IngestResponse(BaseModel):
    """Response model for document ingestion."""

    document_ids: list[str]
    collection_name: str
    document_count: int


@router.post("/ingest", response_model=IngestResponse)
async def ingest_documents(
    request: IngestRequest,
    current_user: User = Depends(get_current_user),
) -> IngestResponse:
    """Ingest documents into the named vector-store collection."""
    require_enabled_rag_api()

    if not request.texts:
        raise HTTPException(status_code=400, detail="texts must not be empty")
    if len(request.texts) > 100:
        raise HTTPException(status_code=400, detail="texts exceeds maximum of 100 documents")
    if not request.collection_name.strip():
        raise HTTPException(status_code=400, detail="collection_name must not be empty")
    if request.metadatas is not None and len(request.metadatas) != len(request.texts):
        raise HTTPException(status_code=400, detail="metadatas must match texts length")
    if request.ids is not None and len(request.ids) != len(request.texts):
        raise HTTPException(status_code=400, detail="ids must match texts length")

    total_length = sum(len(t) for t in request.texts)
    for i, text in enumerate(request.texts):
        validate_text_payload(text, field_name=f"texts[{i}]", max_length=MAX_EMBED_TEXT_LENGTH)

    if request.model not in EMBEDDING_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported model. Supported: {list(EMBEDDING_MODELS.keys())}",
        )

    logger.info(
        "RAG document ingestion requested",
        extra={
            "user_id": str(current_user.id),
            "collection": request.collection_name,
            "document_count": len(request.texts),
            "total_length": total_length,
        },
    )

    try:
        from src.api.integrations.vector_store import (
            EmbeddingProvider,
            VectorStoreConfig,
            VectorStoreRegistry,
            VectorStoreManager,
        )
    except ImportError as imp_err:
        raise HTTPException(
            status_code=503,
            detail="RAG ingestion is not available — vector store dependencies missing.",
        ) from imp_err

    try:
        store: VectorStoreManager | None = VectorStoreRegistry.get_store(request.collection_name)

        if store is None:
            db_url = os.environ.get("DATABASE_URL") or settings.database_url
            if not db_url:
                raise HTTPException(
                    status_code=503,
                    detail="No database configured for RAG ingestion. Configure DATABASE_URL.",
                )

            config = VectorStoreConfig(
                database_url=db_url,
                embedding_provider=EmbeddingProvider.OPENAI,
                embedding_model=request.model,
                embedding_dimensions=EMBEDDING_MODELS[request.model],
                collection_name=request.collection_name,
            )
            try:
                store = VectorStoreRegistry.create_store(request.collection_name, config)
            except Exception as init_err:
                logger.warning("RAG ingest auto-init failed for %s: %s", db_url, init_err)
                fallback_config = VectorStoreConfig(
                    database_url="sqlite:///:memory:",
                    embedding_provider=EmbeddingProvider.OPENAI,
                    embedding_model=request.model,
                    embedding_dimensions=EMBEDDING_MODELS[request.model],
                    collection_name=request.collection_name,
                )
                store = VectorStoreRegistry.create_store(request.collection_name, fallback_config)

        doc_ids = store.add_documents(
            texts=request.texts,
            metadatas=request.metadatas,
            ids=request.ids,
        )

        await track_usage_best_effort(
            user_id=current_user.id,
            event_type="rag.ingest",
            resource_type="rag",
            resource_id=request.collection_name,
            metadata={
                "document_count": len(request.texts),
                "total_length": total_length,
                "collection": request.collection_name,
            },
        )

        return IngestResponse(
            document_ids=doc_ids,
            collection_name=request.collection_name,
            document_count=len(doc_ids),
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("RAG ingestion failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"RAG ingestion failed: {str(exc)}",
        ) from exc
