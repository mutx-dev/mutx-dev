"""RAG and Vector endpoints for embeddings and similarity search."""

import os
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["rag"])


class EmbedRequest(BaseModel):
    """Request model for embedding generation."""
    text: str = Field(..., min_length=1)
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

# Module-level singleton to avoid creating a new httpx client per request
_client: Optional[AsyncOpenAI] = None


def get_client() -> Optional[AsyncOpenAI]:
    """Get OpenAI client with API key from environment."""
    global _client
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY not set - embeddings will use placeholder")
        return None
    if _client is None:
        _client = AsyncOpenAI(api_key=api_key)
    return _client


@router.post("/embed", response_model=EmbedResponse)
async def generate_embedding(request: EmbedRequest) -> EmbedResponse:
    """
    Generate embeddings for text input using OpenAI's embedding models.
    
    Supports text-embedding-3-small, text-embedding-3-large, and text-embedding-ada-002.
    """
    client = get_client()
    
    # Validate model
    if request.model not in EMBEDDING_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported model. Supported: {list(EMBEDDING_MODELS.keys())}"
        )
    
    if client is None:
        # Fallback to placeholder if no API key
        dimension = EMBEDDING_MODELS[request.model]
        embedding = [0.0] * dimension
        logger.warning(f"Using placeholder embedding for model {request.model} (no API key)")
        return EmbedResponse(
            embedding=embedding,
            model=request.model,
            tokens=0,  # No API key; real token count unavailable
        )
    
    try:
        response = await client.embeddings.create(
            model=request.model,
            input=request.text,
        )

        if not response.data:
            raise HTTPException(status_code=502, detail="Empty embedding response from provider")

        embedding_data = response.data[0]
        return EmbedResponse(
            embedding=embedding_data.embedding,
            model=request.model,
            tokens=response.usage.total_tokens,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail="Embedding generation failed")


class BatchEmbedRequest(BaseModel):
    """Request model for batch embedding generation."""
    texts: list[str] = Field(..., min_length=1, max_length=2048)
    model: str = "text-embedding-3-small"

    @field_validator("texts")
    @classmethod
    def texts_not_empty(cls, v: list[str]) -> list[str]:
        if any(not t.strip() for t in v):
            raise ValueError("texts must not contain empty strings")
        return v


class BatchEmbedResponse(BaseModel):
    """Response model for batch embedding generation."""
    embeddings: list[list[float]]
    model: str
    total_tokens: int


@router.post("/embed/batch", response_model=BatchEmbedResponse)
async def generate_batch_embeddings(request: BatchEmbedRequest) -> BatchEmbedResponse:
    """
    Generate embeddings for multiple texts in a single request.
    """
    client = get_client()
    
    if request.model not in EMBEDDING_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported model. Supported: {list(EMBEDDING_MODELS.keys())}"
        )
    
    if client is None:
        dimension = EMBEDDING_MODELS[request.model]
        embeddings = [[0.0] * dimension for _ in request.texts]
        return BatchEmbedResponse(
            embeddings=embeddings,
            model=request.model,
            total_tokens=0,  # No API key; real token count unavailable
        )
    
    try:
        response = await client.embeddings.create(
            model=request.model,
            input=request.texts,
        )
        
        # Sort by index to maintain order
        sorted_data = sorted(response.data, key=lambda x: x.index)
        embeddings = [item.embedding for item in sorted_data]
        
        return BatchEmbedResponse(
            embeddings=embeddings,
            model=request.model,
            total_tokens=response.usage.total_tokens,
        )
    except Exception as e:
        logger.error(f"Batch embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail="Batch embedding generation failed")


class SearchRequest(BaseModel):
    """Request model for similarity search."""
    query: str = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=100)
    model: str = "text-embedding-3-small"


class SearchResult(BaseModel):
    """Single search result."""
    text: str
    score: float


@router.post("/search", response_model=list[SearchResult])
async def similarity_search(request: SearchRequest) -> list[SearchResult]:
    """
    Simple similarity search endpoint.
    
    Note: Full implementation requires pgvector and a document store.
    This is a placeholder that demonstrates the API contract.
    """
    # TODO: Implement with pgvector once extension is added
    # For now, return empty results with a clear message
    return []


@router.get("/health")
async def rag_health():
    """Health check for RAG service."""
    api_key_present = bool(os.getenv("OPENAI_API_KEY"))
    return {
        "status": "available",
        "feature": "embeddings",
        "openai_configured": api_key_present,
        "supported_models": list(EMBEDDING_MODELS.keys())
    }
