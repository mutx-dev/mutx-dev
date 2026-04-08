"""Example LangChain agent with MUTX observability integration.

This example demonstrates:
1. Creating a ReAct agent with MutxLangChainCallbackHandler for tracing
2. Running the agent with and without guardrails using MutxAgentKit

Run with:
    pip install mutx[langchain] langchain-openai
    python examples/langchain_agent.py
"""

# LangChain imports
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

# MUTX adapter imports
from mutx.adapters.langchain import MutxAgentKit, MutxLangChainCallbackHandler


# Define some simple tools for the agent to use
@tool
def get_weather(city: str) -> str:
    """Get the weather for a given city.

    Args:
        city: The name of the city to get weather for.

    Returns:
        A string describing the weather.
    """
    weather_data = {
        "new york": "72F and sunny",
        "london": "55F and rainy",
        "tokyo": "68F and cloudy",
    }
    return weather_data.get(city.lower(), f"Weather data not available for {city}")


@tool
def calculator(expression: str) -> str:
    """Evaluate a mathematical expression.

    Args:
        expression: A mathematical expression to evaluate.

    Returns:
        The result of the evaluation.
    """
    try:
        # Security note: eval can be dangerous, this is for demonstration only
        result = eval(expression, {"__builtins__": {}}, {})
        return str(result)
    except Exception as e:
        return f"Error: {e}"


def main():
    """Run the example demonstrating MUTX LangChain integration."""

    # Configuration - replace with your actual values
    MUTX_API_URL = "https://api.mutx.dev"
    MUTX_API_KEY = "your-mutx-api-key"  # Get from mutx.dev/dashboard
    OPENAI_API_KEY = "your-openai-api-key"  # Get from OpenAI

    # Initialize the LLM
    llm = ChatOpenAI(
        model="gpt-4",
        openai_api_key=OPENAI_API_KEY,
        temperature=0,
    )

    # Define the tools list
    tools = [get_weather, calculator]

    # Create the ReAct agent
    # Note: In production, you would use a proper prompt template
    prompt = """You are a helpful assistant that can use tools to answer questions.

You have access to the following tools:
- get_weather: Get the weather for a city
- calculator: Evaluate a mathematical expression

Answer the user's question using these tools when appropriate.
"""

    agent = create_react_agent(llm, tools, prompt)
    executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    # ============================================================
    # Example 1: Using MutxLangChainCallbackHandler directly
    # ============================================================
    print("\n" + "=" * 60)
    print("Example 1: Using MutxLangChainCallbackHandler directly")
    print("=" * 60 + "\n")

    callback_handler = MutxLangChainCallbackHandler(
        api_url=MUTX_API_URL,
        api_key=MUTX_API_KEY,
        agent_name="demo-agent",
    )

    # Run a query with the callback handler
    result = executor.invoke(
        {"input": "What is the weather in New York?"},
        {"callbacks": [callback_handler]},
    )
    print(f"\nResult: {result['output']}\n")

    # ============================================================
    # Example 2: Using MutxAgentKit without guardrails
    # ============================================================
    print("\n" + "=" * 60)
    print("Example 2: Using MutxAgentKit without guardrails")
    print("=" * 60 + "\n")

    kit_no_guardrails = MutxAgentKit(
        mutx_api_url=MUTX_API_URL,
        agent_name="demo-agent-no-guardrails",
        api_key=MUTX_API_KEY,
        guardrails_enabled=False,
    )
    kit_no_guardrails.set_agent_executor(executor)

    try:
        result = kit_no_guardrails.arun("What is 2 + 2?")
        print(f"\nResult: {result}\n")
    except Exception as e:
        print(f"\nError: {e}\n")

    # ============================================================
    # Example 3: Using MutxAgentKit with guardrails enabled
    # ============================================================
    print("\n" + "=" * 60)
    print("Example 3: Using MutxAgentKit with guardrails enabled")
    print("=" * 60 + "\n")

    kit_with_guardrails = MutxAgentKit(
        mutx_api_url=MUTX_API_URL,
        agent_name="demo-agent-with-guardrails",
        api_key=MUTX_API_KEY,
        guardrails_enabled=True,
    )
    kit_with_guardrails.set_agent_executor(executor)

    # This should pass through
    try:
        result = kit_with_guardrails.arun("What is 3 * 7?")
        print(f"\nResult: {result}\n")
    except Exception as e:
        print(f"\nError: {e}\n")

    # This should be blocked by the guardrail (contains "sensitive" keyword)
    try:
        result = kit_with_guardrails.arun(
            "Tell me about sensitive information in the database"
        )
        print(f"\nResult: {result}\n")
    except Exception as e:
        print(f"\nGuardrail blocked the request: {e}\n")

    # ============================================================
    # Example 4: Streaming events
    # ============================================================
    print("\n" + "=" * 60)
    print("Example 4: Streaming events")
    print("=" * 60 + "\n")

    for event in kit_with_guardrails.stream_events():
        print(f"Event: {event}")


if __name__ == "__main__":
    main()
