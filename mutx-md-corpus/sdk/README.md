# mutx Python SDK

Python SDK for mutx.dev.

## Install

```bash
pip install mutx
```

## Usage

```python
from mutx import MutxClient

with MutxClient(api_key="your-api-key") as client:
    agents = client.agents.list()
    print(agents)
```

## Async client status

`MutxAsyncClient` is **deprecated** in this release. The class is retained for compatibility but its async contract is still limited.

Use **`MutxClient`** for production code and implement custom `httpx.AsyncClient` wrappers directly if you need fully custom async transport behavior.

- Keep using namespaced async resource methods (`acreate`, `alist`, `aget`, etc.) when you intentionally opt into `MutxAsyncClient`.
- Do **not** call sync-style methods like `.list()` or `.create()` on async resources when using the async client; those calls are rejected by design.
