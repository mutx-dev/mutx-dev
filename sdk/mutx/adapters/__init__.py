"""MUTX agent framework adapters.

This module provides adapters for integrating MUTX observability
with various agent frameworks:
- LangChain: mutx.adapters.langchain
- CrewAI: mutx.adapters.crewai
- AutoGen: mutx.adapters.autogen
"""


def __getattr__(name: str):
    """Lazy import to avoid hard dependencies on optional packages."""
    if name in ("MutxLangChainCallbackHandler", "MutxAgentKit"):
        from mutx.adapters.langchain import (  # noqa: F401
            MutxAgentKit,
            MutxLangChainCallbackHandler,
        )

        return locals()[name]
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = [
    "MutxLangChainCallbackHandler",
    "MutxAgentKit",
]
