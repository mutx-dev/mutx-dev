"""Compatibility coverage for the supported LangChain v1 dependency family."""

from importlib.metadata import version

from langchain_core.documents import Document
from packaging.version import Version

from src.api.integrations.langchain_agent import InMemoryChatMessageHistory, LLMProvider
from src.api.integrations.vector_store import (
    EmbeddingProvider,
    VectorStoreConfig,
    VectorStoreManager,
)


def test_langchain_v1_packages_resolve_to_the_tested_security_line() -> None:
    minimum_versions = {
        "langchain": "1.3.14",
        "langchain-core": "1.5.0",
        "langgraph": "1.2.9",
        "langchain-openai": "1.4.0",
        "langchain-anthropic": "1.5.0",
        "langchain-text-splitters": "1.1.2",
        "langchain-ollama": "1.1.0",
        "langchain-huggingface": "1.2.2",
    }

    for package, minimum in minimum_versions.items():
        installed = Version(version(package))
        assert installed >= Version(minimum)
        if package == "langgraph":
            assert installed < Version("1.3.0")
        else:
            assert installed < Version("2.0.0")


def test_langchain_agent_uses_the_v1_history_provider() -> None:
    assert InMemoryChatMessageHistory.__module__.startswith("langchain_core.chat_history")
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
