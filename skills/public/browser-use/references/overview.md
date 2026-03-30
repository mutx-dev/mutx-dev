# Browser Use Overview


## Contents

- [What it is](#what-it-is)
- [Repo truths](#repo-truths)
- [Important top-level areas in the repo](#important-top-level-areas-in-the-repo)
- [Open-source install flow](#open-source-install-flow)
  - [uv-first path](#uv-first-path)
  - [Minimal async example](#minimal-async-example)
- [Model wrappers exported by the package](#model-wrappers-exported-by-the-package)
- [Cloud in open-source code](#cloud-in-open-source-code)
- [CLI role](#cli-role)
- [Good trigger phrases](#good-trigger-phrases)

## What it is

Browser Use has two distinct offerings:

1. **Open source**: the `browser-use` Python library and CLI for local/self-hosted agentic browser automation.
2. **Cloud**: the managed `browser-use-sdk` API/SDK with Browser Use-hosted browsers, models, sessions, files, workspaces, proxies, and production-oriented features.

Do not blur them together when writing code or instructions.

## Repo truths

- Repository: `browser-use/browser-use`
- Python requirement: `>=3.11,<4.0`
- Package version at research time: `0.12.2`
- License: MIT
- CLI entrypoints include `browser-use`, `browseruse`, `bu`, and `browser`
- `Browser` is an alias of `BrowserSession` in the package exports
- The repo ships its own Claude-oriented skill under `skills/browser-use/`, but that skill is focused on the project CLI, not OpenClaw-specific guidance

## Important top-level areas in the repo

- `browser_use/agent/`: agent logic and prompts
- `browser_use/browser/`: browser session and profile abstractions
- `browser_use/llm/`: provider-specific chat model wrappers
- `browser_use/tools/`: custom tool/action plumbing
- `browser_use/skill_cli/`: persistent browser CLI
- `examples/`: best source of real usage patterns
- `skills/`: bundled skills for other coding-agent ecosystems

## Open-source install flow

### uv-first path
```bash
uv init
uv add browser-use
uv sync
uvx browser-use install   # if Chromium is missing
```

### Minimal async example
```python
import asyncio
from browser_use import Agent, ChatBrowserUse

async def main():
    agent = Agent(
        task='Find the top 3 trending repos on GitHub',
        llm=ChatBrowserUse(),
    )
    result = await agent.run()
    print(result.final_result())

asyncio.run(main())
```

## Model wrappers exported by the package

Common imports exposed at package root include:

- `ChatBrowserUse`
- `ChatOpenAI`
- `ChatGoogle`
- `ChatAnthropic`
- `ChatGroq`
- `ChatLiteLLM`
- `ChatMistral`
- `ChatAzureOpenAI`
- `ChatOCIRaw`
- `ChatOllama`
- `ChatVercel`

Choose the wrapper that matches the user’s provider and environment variables.

## Cloud in open-source code

The open-source package can still use Browser Use Cloud-backed browsers:

```python
from browser_use import Agent, Browser, ChatBrowserUse

browser = Browser(use_cloud=True)
agent = Agent(task='...', llm=ChatBrowserUse(), browser=browser)
```

Use this when the user wants the open-source programming model but needs managed browsers, stealth, or proxy help.

## CLI role

The repo also ships a persistent browser CLI. Typical flow:

```bash
browser-use open https://example.com
browser-use state
browser-use click 5
browser-use input 7 "hello@example.com"
browser-use screenshot page.png
browser-use close
```

This is useful for deterministic, index-based interaction and debugging outside a full LLM loop.

## Good trigger phrases

- "build a browser-use agent"
- "use browser-use with Gemini/OpenAI/Claude"
- "connect browser-use to my Chrome profile"
- "reuse logged-in browser state"
- "integrate Playwright with browser-use"
- "use browser-use cloud / sdk / session / workspace / structured output"
- "debug a browser-use automation"
