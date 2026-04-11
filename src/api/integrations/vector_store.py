import logging
import math
import os
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional

from langchain_community.embeddings import OpenAIEmbeddings
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy import JSON, Column, String, Text, create_engine
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, sessionmaker

from src.api.database import build_sync_database_url
from src.api.integrations.local_embeddings import LocalHashEmbeddings

logger = logging.getLogger(__name__)

Base = declarative_base()
JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True)
    collection_name = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    extra_data = Column("metadata", JSON_TYPE, default=dict)
    embedding = Column(JSON_TYPE, nullable=True)


class EmbeddingProvider(str, Enum):
    OPENAI = "openai"
    HUGGINGFACE = "huggingface"
    OLLAMA = "ollama"


@dataclass
class VectorStoreConfig:
    database_url: str
    embedding_provider: EmbeddingProvider = EmbeddingProvider.OPENAI
    embedding_model: str = "text-embedding-ada-002"
    embedding_dimensions: int = 1536
    collection_name: str = "default"
    chunk_size: int = 1000
    chunk_overlap: int = 200


class VectorStoreManager:
    def __init__(self, config: VectorStoreConfig):
        self.config = config
        self._embeddings = self._initialize_embeddings()
        self._text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=config.chunk_size,
            chunk_overlap=config.chunk_overlap,
            length_function=len,
        )
        self._sync_engine = None
        self._sync_session_maker = None
        self._memory_documents: list[dict[str, Any]] = []

    def _initialize_embeddings(self):
        if self.config.embedding_provider == EmbeddingProvider.OPENAI:
            if not os.getenv("OPENAI_API_KEY"):
                logger.info(
                    "OPENAI_API_KEY not set; using deterministic local embeddings for collection %s",
                    self.config.collection_name,
                )
                return LocalHashEmbeddings(dimensions=self.config.embedding_dimensions)
            return OpenAIEmbeddings(
                model=self.config.embedding_model,
                dimensions=self.config.embedding_dimensions,
            )
        elif self.config.embedding_provider == EmbeddingProvider.HUGGINGFACE:
            from langchain_community.embeddings import HuggingFaceEmbeddings

            return HuggingFaceEmbeddings(
                model_name=self.config.embedding_model,
                model_kwargs={"device": "cpu"},
            )
        elif self.config.embedding_provider == EmbeddingProvider.OLLAMA:
            from langchain_community.embeddings import OllamaEmbeddings

            return OllamaEmbeddings(model=self.config.embedding_model)
        else:
            raise ValueError(f"Unknown embedding provider: {self.config.embedding_provider}")

    def _uses_memory_store(self) -> bool:
        database_url = self.config.database_url.lower()
        return database_url.startswith(("sqlite:///:memory:", "sqlite+aiosqlite:///:memory:"))

    def _get_sync_engine(self):
        if self._sync_engine is None:
            database_url = build_sync_database_url(self.config.database_url)
            if database_url.startswith("sqlite+aiosqlite://"):
                database_url = database_url.replace("sqlite+aiosqlite://", "sqlite://", 1)
            self._sync_engine = create_engine(
                database_url,
                pool_pre_ping=True,
            )
        return self._sync_engine

    def _get_sync_session_maker(self):
        if self._sync_session_maker is None:
            self._sync_session_maker = sessionmaker(bind=self._get_sync_engine())
        return self._sync_session_maker

    def init_database(self):
        if self._uses_memory_store():
            logger.info(
                "Vector store '%s' using in-memory persistence",
                self.config.collection_name,
            )
            return
        Base.metadata.create_all(self._get_sync_engine())
        logger.info("Vector store database initialized")

    @staticmethod
    def _cosine_similarity(a: List[float], b: List[float]) -> float:
        numerator = sum(x * y for x, y in zip(a, b))
        left_norm = math.sqrt(sum(x * x for x in a))
        right_norm = math.sqrt(sum(y * y for y in b))
        if not left_norm or not right_norm:
            return 0.0
        return float(numerator / (left_norm * right_norm))

    def _rank_documents(
        self,
        query_embedding: List[float],
        documents: List[dict[str, Any]],
    ) -> List[tuple[Document, float]]:
        ranked: list[tuple[Document, float]] = []
        for entry in documents:
            score = self._cosine_similarity(query_embedding, entry.get("embedding") or [])
            ranked.append(
                (
                    Document(
                        page_content=entry["content"],
                        metadata=entry.get("metadata") or {},
                    ),
                    score,
                )
            )
        ranked.sort(key=lambda item: item[1], reverse=True)
        return ranked

    def add_documents(
        self,
        texts: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None,
    ) -> List[str]:
        documents = [
            Document(page_content=text, metadata=metadata or {})
            for text, metadata in zip(texts, metadatas or [{}] * len(texts))
        ]
        splits = self._text_splitter.split_documents(documents)
        generated_ids = [
            ids[i] if ids and i < len(ids) else f"doc_{i}_{os.urandom(8).hex()}"
            for i in range(len(splits))
        ]
        embeddings = self._embeddings.embed_documents([split.page_content for split in splits])

        if self._uses_memory_store():
            for i, split in enumerate(splits):
                self._memory_documents.append(
                    {
                        "id": generated_ids[i],
                        "collection_name": self.config.collection_name,
                        "content": split.page_content,
                        "metadata": split.metadata,
                        "embedding": embeddings[i],
                    }
                )

            logger.info(
                "Added %s document chunks to in-memory collection %s",
                len(splits),
                self.config.collection_name,
            )
            return generated_ids

        with self._get_sync_session_maker() as session:
            for i, split in enumerate(splits):
                doc = DocumentModel(
                    id=generated_ids[i],
                    collection_name=self.config.collection_name,
                    content=split.page_content,
                    extra_data=split.metadata,
                    embedding=embeddings[i],
                )
                session.add(doc)
            session.commit()

        logger.info(
            "Added %s document chunks to collection %s",
            len(splits),
            self.config.collection_name,
        )
        return generated_ids

    def similarity_search(
        self,
        query: str,
        k: int = 4,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        query_embedding = self._embeddings.embed_query(query)

        if self._uses_memory_store():
            documents = [
                doc
                for doc, _score in self._rank_documents(
                    query_embedding,
                    [
                        entry
                        for entry in self._memory_documents
                        if entry["collection_name"] == self.config.collection_name
                        and (
                            not filter_metadata
                            or all(
                                str((entry.get("metadata") or {}).get(key)) == str(value)
                                for key, value in filter_metadata.items()
                            )
                        )
                    ],
                )[:k]
            ]
            logger.info("Similarity search returned %s documents", len(documents))
            return documents

        with self._get_sync_session_maker() as session:
            results = (
                session.query(DocumentModel)
                .filter(DocumentModel.collection_name == self.config.collection_name)
                .all()
            )
            candidate_docs = [
                {
                    "content": doc.content,
                    "metadata": doc.extra_data,
                    "embedding": doc.embedding,
                }
                for doc in results
                if not filter_metadata
                or all(
                    str((doc.extra_data or {}).get(key)) == str(value)
                    for key, value in filter_metadata.items()
                )
            ]

            documents = [
                doc for doc, _score in self._rank_documents(query_embedding, candidate_docs)[:k]
            ]

        logger.info("Similarity search returned %s documents", len(documents))
        return documents

    def similarity_search_with_score(
        self,
        query: str,
        k: int = 4,
    ) -> List[tuple[Document, float]]:
        query_embedding = self._embeddings.embed_query(query)

        if self._uses_memory_store():
            return self._rank_documents(
                query_embedding,
                [
                    entry
                    for entry in self._memory_documents
                    if entry["collection_name"] == self.config.collection_name
                ],
            )[:k]

        with self._get_sync_session_maker() as session:
            results = (
                session.query(DocumentModel)
                .filter(DocumentModel.collection_name == self.config.collection_name)
                .all()
            )
            return self._rank_documents(
                query_embedding,
                [
                    {
                        "content": doc.content,
                        "metadata": doc.extra_data,
                        "embedding": doc.embedding,
                    }
                    for doc in results
                ],
            )[:k]

    def delete_collection(self, collection_name: Optional[str] = None) -> bool:
        target_collection = collection_name or self.config.collection_name
        if self._uses_memory_store():
            self._memory_documents = [
                entry
                for entry in self._memory_documents
                if entry["collection_name"] != target_collection
            ]
            logger.info("Deleted in-memory collection %s", target_collection)
            return True

        with self._get_sync_session_maker() as session:
            session.query(DocumentModel).filter(
                DocumentModel.collection_name == target_collection
            ).delete()
            session.commit()
        logger.info("Deleted collection %s", target_collection)
        return True

    def get_collection_stats(self) -> Dict[str, Any]:
        if self._uses_memory_store():
            count = sum(
                1
                for entry in self._memory_documents
                if entry["collection_name"] == self.config.collection_name
            )
            return {
                "collection_name": self.config.collection_name,
                "document_count": count,
                "embedding_provider": self.config.embedding_provider,
                "embedding_model": self.config.embedding_model,
            }

        with self._get_sync_session_maker() as session:
            count = (
                session.query(DocumentModel)
                .filter(DocumentModel.collection_name == self.config.collection_name)
                .count()
            )
        return {
            "collection_name": self.config.collection_name,
            "document_count": count,
            "embedding_provider": self.config.embedding_provider,
            "embedding_model": self.config.embedding_model,
        }


class VectorStoreRegistry:
    _stores: Dict[str, VectorStoreManager] = {}

    @classmethod
    def create_store(cls, name: str, config: VectorStoreConfig) -> VectorStoreManager:
        store = VectorStoreManager(config)
        store.init_database()
        cls._stores[name] = store
        logger.info("Created vector store: %s", name)
        return store

    @classmethod
    def get_store(cls, name: str) -> Optional[VectorStoreManager]:
        return cls._stores.get(name)

    @classmethod
    def delete_store(cls, name: str) -> bool:
        if name in cls._stores:
            del cls._stores[name]
            return True
        return False

    @classmethod
    def list_stores(cls) -> List[str]:
        return list(cls._stores.keys())
