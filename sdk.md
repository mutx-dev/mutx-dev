---
description: Install, authenticate, and script against the current MUTX API surface.
icon: terminal
---

# Python SDK

Python SDK for MUTX.

## Install

```bash
pip install mutx
```

## Authenticate

Use an API key for automation:

```python
from mutx import MutxClient

with MutxClient(api_key='mutx_live_your_key') as client:
    agents = client.agents.list()
    print(agents)
```

Use a base URL override for local work:

```python
from mutx import MutxClient

with MutxClient(
    api_key='mutx_live_your_key',
    base_url='http://localhost:8000'
) as client:
    print(client.health.check())
```

## Quick example

```python
from mutx import MutxClient

with MutxClient(api_key="your-api-key") as client:
    agents = client.agents.list()
    print(agents)
```

## Good use cases

* backend services calling MUTX directly
* scripts for agent and deployment automation
* CI jobs that should avoid browser auth flows

{% hint style="info" %}
Some SDK methods still trail the live backend contract. Confirm route truth in [API Overview](docs/contracts/api/index.md) when behavior matters.
{% endhint %}

## Related docs

* [API Overview](docs/contracts/api/index.md)
* [CLI Guide](docs/cli.md)
