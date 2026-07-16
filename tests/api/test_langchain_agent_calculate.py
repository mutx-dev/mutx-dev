import importlib
import sys
import types


def _load_langchain_agent_module():
    sys.modules.pop("src.api.integrations.langchain_agent", None)

    stubbed_modules = [
        "langchain_openai",
        "langchain_anthropic",
        "langchain_ollama",
        "langchain_core.chat_history",
        "langchain_core.messages",
        "langchain_core.tools",
        "langchain.agents",
        "src.api.integrations.vector_store",
    ]
    original_modules = {name: sys.modules.get(name) for name in stubbed_modules}

    langchain_openai = types.ModuleType("langchain_openai")
    langchain_openai.ChatOpenAI = type("ChatOpenAI", (), {})
    sys.modules["langchain_openai"] = langchain_openai

    langchain_anthropic = types.ModuleType("langchain_anthropic")
    langchain_anthropic.ChatAnthropic = type("ChatAnthropic", (), {})
    sys.modules["langchain_anthropic"] = langchain_anthropic

    langchain_ollama = types.ModuleType("langchain_ollama")
    langchain_ollama.ChatOllama = type("ChatOllama", (), {})
    sys.modules["langchain_ollama"] = langchain_ollama

    chat_history = types.ModuleType("langchain_core.chat_history")
    chat_history.InMemoryChatMessageHistory = type("InMemoryChatMessageHistory", (), {})
    sys.modules["langchain_core.chat_history"] = chat_history

    messages = types.ModuleType("langchain_core.messages")
    for name in ("HumanMessage", "AIMessage", "SystemMessage", "BaseMessage"):
        setattr(messages, name, type(name, (), {}))
    sys.modules["langchain_core.messages"] = messages

    tools = types.ModuleType("langchain_core.tools")
    tools.BaseTool = type("BaseTool", (), {})

    def tool(*args, **kwargs):
        def decorator(func):
            return func

        return decorator

    tools.tool = tool
    sys.modules["langchain_core.tools"] = tools

    agents = types.ModuleType("langchain.agents")
    agents.create_agent = lambda *args, **kwargs: None
    sys.modules["langchain.agents"] = agents

    vector_store = types.ModuleType("src.api.integrations.vector_store")
    vector_store.VectorStoreRegistry = type(
        "VectorStoreRegistry",
        (),
        {"get_store": staticmethod(lambda _name: None)},
    )
    sys.modules["src.api.integrations.vector_store"] = vector_store

    try:
        return importlib.import_module("src.api.integrations.langchain_agent")
    finally:
        for name, original_module in original_modules.items():
            if original_module is None:
                sys.modules.pop(name, None)
            else:
                sys.modules[name] = original_module


def test_calculate_supports_basic_arithmetic() -> None:
    module = _load_langchain_agent_module()

    assert module.BuiltInTools.calculate("2 + 3 * 4") == "14"
    assert module.BuiltInTools.calculate("2 ** 5") == "32"
    assert module.BuiltInTools.calculate("round(10 / 3, 2)") == "3.33"


def test_calculate_supports_safe_numeric_functions() -> None:
    module = _load_langchain_agent_module()

    assert module.BuiltInTools.calculate("max(1, 5, 3)") == "5"
    assert module.BuiltInTools.calculate("sum([1, 2, 3, 4])") == "10"
    assert module.BuiltInTools.calculate("abs(-8)") == "8"


def test_calculate_rejects_code_like_expressions() -> None:
    module = _load_langchain_agent_module()

    result = module.BuiltInTools.calculate("__import__('os').system('id')")
    assert result.startswith("Error:")

    result = module.BuiltInTools.calculate("(1).__class__.__mro__")
    assert result.startswith("Error:")


def test_calculate_rejects_empty_expression() -> None:
    module = _load_langchain_agent_module()

    assert module.BuiltInTools.calculate("") == "Error: Expression is empty"


def test_calculate_rejects_expensive_power_expressions() -> None:
    module = _load_langchain_agent_module()

    result = module.BuiltInTools.calculate("2 ** 5000")
    assert result.startswith("Error:")

    result = module.BuiltInTools.calculate("10 ** 40")
    assert result.startswith("Error:")
