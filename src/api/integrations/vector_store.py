import os
import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum

from sqlalchemy import Column, String, Text, create_engine
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from langchain_community.embeddings import OpenAIEmbeddings
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from src.api.database import build_sync_database_url

logger = logging.getLogger(__name__)

Base = declarative_base()


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True)
    collection_name = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    extra_data = Column("metadata", JSONB, default={})
    embedding = Column(JSONB, nullable=True)


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

    def _initialize_embeddings(self):
        if self.config.embedding_provider == EmbeddingProvider.OPENAI:
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

    def _get_sync_engine(self):
        if self._sync_engine is None:
            self._sync_engine = create_engine(
                build_sync_database_url(self.config.database_url),
                pool_pre_ping=True,
            )
        return self._sync_engine

    def _get_sync_session_maker(self):
        if self._sync_session_maker is None:
            self._sync_session_maker = sessionmaker(bind=self._get_sync_engine())
        return self._sync_session_maker

    def init_database(self):
        Base.metadata.create_all(self._get_sync_engine())
        logger.info("Vector store database initialized")

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

        with self._get_sync_session_maker() as session:
            for i, split in enumerate(splits):
                doc_id = ids[i] if ids and i < len(ids) else f"doc_{i}_{os.urandom(8).hex()}"
                doc = DocumentModel(
                    id=doc_id,
                    collection_name=self.config.collection_name,
                    content=split.page_content,
                    extra_data=split.metadata,
                )
                session.add(doc)
            session.commit()

        logger.info(
            f"Added {len(splits)} document chunks to collection {self.config.collection_name}"
        )
        return [f"doc_{i}" for i in range(len(splits))]

    def similarity_search(
        self,
        query: str,
        k: int = 4,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        with self._get_sync_session_maker() as session:
            query_embedding = self._embeddings.embed_query(query)

            stmt = session.query(DocumentModel).filter(
                DocumentModel.collection_name == self.config.collection_name
            )

            if filter_metadata:
                for key, value in filter_metadata.items():
                    stmt = stmt.filter(DocumentModel.extra_data[key].astext == str(value))

            results = stmt.all()

            def cosine_similarity(a: List[float], b: List[float]) -> float:
                import numpy as np

                a = np.array(a)
                b = np.array(b)
                return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

            scored_results = []
            for doc in results:
                if doc.embedding:
                    score = cosine_similarity(query_embedding, doc.embedding)
                else:
                    score = 0.0
                scored_results.append((score, doc))

            scored_results.sort(key=lambda x: x[0], reverse=True)
            top_k = scored_results[:k]

            documents = [
                Document(page_content=doc.content, metadata=doc.extra_data) for score, doc in top_k
            ]

        logger.info(f"Similarity search returned {len(documents)} documents")
        return documents

    def similarity_search_with_score(
        self,
        query: str,
        k: int = 4,
    ) -> List[tuple[Document, float]]:
        docs = self.similarity_search(query, k)
        with self._get_sync_session_maker() as session:
            query_embedding = self._embeddings.embed_query(query)
            results = []
            for doc in docs:
                doc_model = (
                    session.query(DocumentModel)
                    .filter(
                        DocumentModel.collection_name == self.config.collection_name,
                        DocumentModel.content == doc.page_content,
                    )
                    .first()
                )
                if doc_model and doc_model.embedding:
                    import numpy as np

                    score = float(
                        np.dot(
                            np.array(query_embedding),
                            np.array(doc_model.embedding),
                        )
                        / (
                            np.linalg.norm(np.array(query_embedding))
                            * np.linalg.norm(np.array(doc_model.embedding))
                        )
                    )
                else:
                    score = 0.0
                results.append((doc, score))
        return results

    def delete_collection(self, collection_name: Optional[str] = None) -> bool:
        target_collection = collection_name or self.config.collection_name
        with self._get_sync_session_maker() as session:
            session.query(DocumentModel).filter(
                DocumentModel.collection_name == target_collection
            ).delete()
            session.commit()
        logger.info(f"Deleted collection {target_collection}")
        return True

    def get_collection_stats(self) -> Dict[str, Any]:
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
        logger.info(f"Created vector store: {name}")
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
