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
