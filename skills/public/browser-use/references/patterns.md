# Browser Use Patterns


## Contents

- [1. Authenticated browsing with a real profile](#1-authenticated-browsing-with-a-real-profile)
- [2. CDP / existing Chrome connection](#2-cdp-existing-chrome-connection)
- [3. Playwright integration for precision](#3-playwright-integration-for-precision)
- [4. Custom tools/actions](#4-custom-toolsactions)
- [5. Structured extraction](#5-structured-extraction)
- [6. Speed mode / fast agents](#6-speed-mode-fast-agents)
- [7. CLI for debugging or deterministic steps](#7-cli-for-debugging-or-deterministic-steps)

## 1. Authenticated browsing with a real profile

Use this first when the site requires saved logins, cookies, MFA state, or an existing user session.

```python
import asyncio
from browser_use import Agent, Browser, ChatGoogle

async def main():
    browser = Browser.from_system_chrome(profile_directory='Default')
    agent = Agent(
        task='Open GitHub and summarize my notifications',
        llm=ChatGoogle(model='gemini-flash-latest'),
        browser=browser,
    )
    await agent.run()

asyncio.run(main())
```

Why it matters:
- More reliable than asking the agent to log in from scratch
- Preserves cookies and site preferences
- Reduces CAPTCHA and auth friction

## 2. CDP / existing Chrome connection

Use when Chrome is already running with remote debugging or another tool needs to share the browser instance.

Typical CLI path:
```bash
browser-use --connect open https://example.com
# or
browser-use --cdp-url http://localhost:9222 open https://example.com
```

Typical Python pattern uses `BrowserSession(cdp_url=...)`.

## 3. Playwright integration for precision

Use browser-use for task planning and high-level actions, then add Playwright-backed tools for exact selectors, high-fidelity screenshots, or hard-to-reach widgets.

Repo example: `examples/browser/playwright_integration.py`

Practical recipe:
1. Start or connect to a Chrome instance over CDP.
2. Point Playwright at the same CDP URL.
3. Create browser-use `Tools()` actions that call Playwright methods.
4. Let the agent invoke those custom actions when needed.

This is the best pattern for:
- brittle selectors
- complex forms
- iframes or widgets that generic agent actions mishandle
- screenshot or extraction steps that need exact CSS selectors

## 4. Custom tools/actions

Use `Tools()` to expose deterministic actions to the agent.

```python
from browser_use import Tools

tools = Tools()

@tools.action(description='Look up an internal ID in a trusted local system.')
def lookup_customer(customer_id: str) -> str:
    return f'customer={customer_id}'
```

Pass `tools=tools` into `Agent(...)`.

Use custom tools when:
- the task needs local business logic
- one step is deterministic and should not be re-invented by the LLM
- you want tighter control over side effects

## 5. Structured extraction

Prefer typed results when code will consume the answer.

Cloud SDK example pattern:
```python
from pydantic import BaseModel
from browser_use_sdk.v3 import AsyncBrowserUse

class Product(BaseModel):
    name: str
    price: float

client = AsyncBrowserUse()
result = await client.run('Get product info', output_schema=Product)
```

Guideline: keep schemas flat unless nesting is truly needed.

## 6. Speed mode / fast agents

Repo example: `examples/getting_started/05_fast_agent.py`

Levers shown by the repo:
- choose a fast model
- set `flash_mode=True`
- reduce browser wait timings with `BrowserProfile`
- keep instructions concise

Only do this after a stable baseline exists. Otherwise you can trade away reliability for speed.

## 7. CLI for debugging or deterministic steps

The CLI is valuable when you need to inspect a page outside a full autonomous run.

Useful commands:
- `browser-use state`
- `browser-use click <index>`
- `browser-use input <index> "text"`
- `browser-use eval "..."`
- `browser-use screenshot path.png`
- `browser-use cookies export cookies.json`

Because the CLI keeps a daemon/browser alive between commands, it is good for tight debug loops.
