---
name: browser-use
description: Use the browser-use GitHub project for Python-based AI browser automation, agentic web tasks, browser session reuse, structured extraction, custom tools, or CLI-driven browser control. Trigger when asked to build or debug browser-use agents, wire browser-use to OpenAI/Anthropic/Gemini/Groq/Ollama, connect to a real Chrome profile or CDP session, use Browser Use Cloud from open source code, integrate Playwright with browser-use, or choose between browser-use open source vs cloud for reliable web automation.
---

# Browser Use

Use `browser-use` when the job is agentic web automation in Python: navigate, inspect, click, fill forms, extract data, reuse browser state, or combine an LLM with browser actions.

## Quick workflow

1. Decide whether the request is for **open source** (`browser-use` Python package / CLI) or **cloud** (`browser-use-sdk`).
2. For open source work, start with a minimal async Python example and a supported chat model.
3. Prefer a **real Chrome profile** or **CDP connection** when the site needs existing logins/cookies.
4. Use **custom tools** or **Playwright integration** when element-level precision is needed.
5. Use **cloud / `Browser(use_cloud=True)`** for stealth, CAPTCHA-heavy, proxy, or scale-sensitive work.

## Minimal open-source pattern

```python
import asyncio
from browser_use import Agent, Browser, ChatBrowserUse

async def main():
    browser = Browser()
    agent = Agent(
        task='Find the star count of browser-use on GitHub',
        llm=ChatBrowserUse(),
        browser=browser,
    )
    result = await agent.run()
    print(result.final_result())

asyncio.run(main())
```

## Choose the right path

### Use open source first when
- The user wants Python code in their own repo
- Running locally or self-hosted is fine
- They want custom tools, custom prompts, or integration with local code
- A normal browser session is enough

### Escalate to cloud when
- The task needs stealth browsers, CAPTCHA avoidance, proxies, or managed infra
- Many parallel agents or production reliability matter more than local simplicity
- The user wants the SDK/API rather than an embedded Python library

## High-value patterns

### Real logged-in browser
Use a real Chrome profile or CDP-backed browser for authenticated sites. This is the default fix for tasks that fail because the agent is not logged in.

### Playwright + browser-use
Use browser-use for planning and high-level navigation, then Playwright for precise selectors, screenshots, or tricky widgets. Read `references/patterns.md` before implementing this.

### Structured extraction
When the output is meant for code, define a schema instead of returning prose. Prefer flat schemas when possible.

### Speed tuning
Use a fast model, concise task wording, and lighter browser waits only after the happy path works. Read `references/gotchas.md` before over-optimizing.

## Install and run

### Open source
```bash
uv init
uv add browser-use
uv sync
# install Chromium if needed
uvx browser-use install
```

Python 3.11+ is required.

### Cloud SDK
```bash
pip install browser-use-sdk
export BROWSER_USE_API_KEY=...
```

## What to read next

- Read `references/overview.md` for architecture, install paths, model classes, and repo layout.
- Read `references/patterns.md` for common implementation patterns: real browser auth, Playwright integration, custom tools, structured output, and CLI usage.
- Read `references/gotchas.md` for caveats, production advice, and repo truths that often trip agents up.

## Practical guidance

- Prefer `Browser()` / `BrowserSession` reuse over recreating a browser for each step.
- Keep tasks specific and outcome-based; vague prompts cost time and steps.
- For authenticated flows, prefer profile reuse over asking the agent to log in from scratch.
- For brittle pages, add custom tools or use Playwright selectors rather than fighting purely agentic clicks.
- Do not assume cloud and open-source APIs are the same product; they are related but separate.
