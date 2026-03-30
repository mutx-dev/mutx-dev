# Browser Use Gotchas and Caveats

## Open source vs cloud is the first fork

Do not write `browser-use` and `browser-use-sdk` examples as if they were interchangeable. The managed cloud product has sessions, workspaces, hosted browsers, and API-level structured output patterns that differ from the open-source package.

## Authentication usually beats clever prompting

If a task depends on being logged in, reuse a real browser profile or connect to an existing Chrome session. This is more reliable than trying to automate login each run.

## CAPTCHA and anti-bot friction

The repo’s own guidance is blunt: for CAPTCHA handling and stronger fingerprinting, prefer Browser Use Cloud. Open source alone is not the answer for every hostile site.

## Chrome/browser cost in production

The README notes that Chrome can consume a lot of memory and that many parallel agents are tricky to manage. For production-scale concurrency, favor managed cloud infrastructure unless the user explicitly wants to own that operational burden.

## Browser aliasing can confuse readers

At the package root, `Browser` is effectively an alias for `BrowserSession`. Keep examples simple and consistent so users do not think these are unrelated abstractions.

## Model/provider caveats

- `ChatBrowserUse()` is the repo’s preferred default for browser tasks.
- Gemini env var naming changed: docs say prefer `GOOGLE_API_KEY` over deprecated `GEMINI_API_KEY`.
- Qwen support is selective; docs warn that some Qwen models produce the wrong action schema. If using Qwen, prefer the specifically recommended variants.

## The CLI is persistent, not one-shot

`browser-use` CLI commands talk to a background daemon and a persistent browser session. This is a feature, but it means state carries across commands. Remember to close sessions when done.

## Good defaults for reliable tasks

- Start with a visible browser during debugging if the user can watch it.
- Keep the task narrow and concrete.
- Use custom tools for deterministic substeps.
- Add Playwright only for precision gaps, not by default.
- Move to cloud when stealth, proxies, CAPTCHA reduction, or high concurrency become core requirements.

## Research breadcrumbs

Useful repo/example files that informed this skill:
- `README.md`
- `pyproject.toml`
- `browser_use/skill_cli/README.md`
- `examples/browser/real_browser.py`
- `examples/browser/playwright_integration.py`
- `examples/getting_started/05_fast_agent.py`
- `examples/models/skills.py`
