"""Compatibility coverage for the supported LangChain 0.3 dependency island."""

from importlib.metadata import version

from langchain_core.documents import Document
from packaging.version import Version

from src.api.integrations.langchain_agent import ChatMessageHistory, LLMProvider
from src.api.integrations.vector_store import (
    EmbeddingProvider,
    VectorStoreConfig,
    VectorStoreManager,
)


def test_langchain_03_packages_resolve_to_the_tested_security_line() -> None:
    minimum_versions = {
        "langchain": "0.3.30",
        "langchain-core": "0.3.86",
        "langchain-openai": "0.3.35",
        "langchain-anthropic": "0.3.22",
        "langchain-community": "0.3.31",
        "langchain-text-splitters": "0.3.11",
    }

    for package, minimum in minimum_versions.items():
        installed = Version(version(package))
        assert installed >= Version(minimum)
        assert installed < Version("0.4.0")


def test_langchain_agent_uses_the_current_03_history_provider() -> None:
    assert ChatMessageHistory.__module__.startswith("langchain_core.chat_history")
    assert LLMProvider.OPENAI.value == "openai"


def test_vector_store_chunks_and_searches_with_current_langchain(
    monkeypatch,
) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    store = VectorStoreManager(
        VectorStoreConfig(
            database_url="sqlite:///:memory:",
            embedding_provider=EmbeddingProvider.OPENAI,
            collection_name="langchain-compat",
        )
    )

    ids = store.add_documents(
        ["production deployment checklist", "monthly analytics report"],
        metadatas=[{"kind": "operations"}, {"kind": "analytics"}],
    )
    results = store.similarity_search(
        "deployment",
        k=2,
        filter_metadata={"kind": "operations"},
    )

    assert len(ids) == 2
    assert len(results) == 1
    assert isinstance(results[0], Document)
    assert results[0].metadata == {"kind": "operations"}
