# TradingAgents architecture and config


## Contents

- [When to read this](#when-to-read-this)
- [High-level architecture](#high-level-architecture)
- [Execution order](#execution-order)
- [Selected analyst keys](#selected-analyst-keys)
- [Main class](#main-class)
- [Config keys that matter most](#config-keys-that-matter-most)
  - [Paths](#paths)
  - [LLM selection](#llm-selection)
  - [Provider-specific reasoning/thinking controls](#provider-specific-reasoningthinking-controls)
  - [Debate depth / runtime expansion](#debate-depth-runtime-expansion)
  - [Data vendor routing](#data-vendor-routing)
- [Provider support](#provider-support)
- [Model validation nuance](#model-validation-nuance)
- [Data vendor routing](#data-vendor-routing)
- [Final decision normalization](#final-decision-normalization)
- [Memory / reflection](#memory-reflection)

## When to read this

Read this file when explaining internals, customizing the framework, or mapping user requests onto actual config keys and graph behavior.

## High-level architecture

TradingAgents models a trading-firm workflow with multiple specialized roles:

1. **Analyst team**
   - market analyst
   - social analyst
   - news analyst
   - fundamentals analyst
2. **Research debate**
   - bull researcher
   - bear researcher
   - research manager
3. **Trader**
4. **Risk debate**
   - aggressive analyst
   - conservative analyst
   - neutral analyst
5. **Portfolio manager**

The graph is built with **LangGraph**.

## Execution order

`GraphSetup.setup_graph()` compiles a workflow with this shape:

- Start at the first selected analyst
- Run selected analysts sequentially
- After each analyst, clear message history before moving on
- Move into bull/bear research debate
- Let research manager resolve the investment debate
- Pass to trader
- Run risk discussion loop across aggressive/conservative/neutral analysts
- Let portfolio manager issue the final trade decision

This means analyst selection changes the early branch of the graph, but the downstream research/trader/risk/portfolio stages always exist.

## Selected analyst keys

Use these internal keys when editing code/config or explaining the CLI mapping:

- `market`
- `social`
- `news`
- `fundamentals`

The CLI labels `social` as “Social Media Analyst”, but the report section is `sentiment_report` and some docs call it “Social Analyst”. Mention the naming mismatch if it matters.

## Main class

Core entrypoint:

```python
from tradingagents.graph.trading_graph import TradingAgentsGraph
```

Important constructor args:

- `selected_analysts=[...]`
- `debug=False|True`
- `config={...}`
- `callbacks=[...]`

Main execution method:

```python
final_state, decision = ta.propagate(ticker, trade_date)
```

## Config keys that matter most

From `tradingagents/default_config.py`:

### Paths

- `project_dir`
- `results_dir`
- `data_cache_dir`

### LLM selection

- `llm_provider`
- `deep_think_llm`
- `quick_think_llm`
- `backend_url`

### Provider-specific reasoning/thinking controls

- `google_thinking_level`
- `openai_reasoning_effort`
- `anthropic_effort`

### Debate depth / runtime expansion

- `max_debate_rounds`
- `max_risk_discuss_rounds`
- `max_recur_limit`

### Data vendor routing

- `data_vendors`
- `tool_vendors`

## Provider support

The repo supports these LLM provider families:

- `openai`
- `google`
- `anthropic`
- `xai`
- `openrouter`
- `ollama`

Behavior nuances:

- Native OpenAI uses the **Responses API** through LangChain’s `ChatOpenAI` wrapper.
- OpenRouter, xAI, and Ollama flow through the OpenAI-compatible client path.
- Google maps `thinking_level` differently depending on Gemini 3 vs Gemini 2.5 model families.
- Ollama accepts arbitrary model names and targets `http://localhost:11434/v1`.

## Model validation nuance

The repo validates model names for:

- OpenAI
- Anthropic
- Google
- xAI

But it does **not** strictly validate model names for:

- `ollama`
- `openrouter`

That means user typos may fail later at runtime rather than at config time.

## Data vendor routing

Vendor routing happens in `tradingagents/dataflows/interface.py`.

Category-level defaults:

- `core_stock_apis`
- `technical_indicators`
- `fundamental_data`
- `news_data`

Supported vendors by repo code:

- `yfinance`
- `alpha_vantage`

Use `tool_vendors` to override specific tool methods. Tool-level config takes precedence over category-level config.

Routing behavior detail:

- The configured vendor becomes the primary choice.
- Remaining available vendors become fallback options.
- Fallback is attempted only when Alpha Vantage raises its specific rate-limit exception.

## Final decision normalization

After the portfolio manager writes a full narrative decision, the repo runs `SignalProcessor.process_signal()` to extract exactly one of:

- `BUY`
- `OVERWEIGHT`
- `HOLD`
- `UNDERWEIGHT`
- `SELL`

This extraction itself is LLM-based, not rule-based.

## Memory / reflection

The graph constructs several `FinancialSituationMemory` stores for bull, bear, trader, investment judge, and portfolio manager.

There is also:

```python
ta.reflect_and_remember(returns_losses)
```

Use this only when the user is doing iterative experiments and has realized returns/losses to feed back into the system.
