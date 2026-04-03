---
description: Complete guide to the MUTX Python SDK with practical examples for all resources.
icon: terminal
---

# Python SDK

The MUTX Python SDK provides a programmatic interface to manage agents, deployments, API keys, webhooks, and ClawHub integrations.

## Install

```bash
pip install mutx
```

## Authentication

Initialize the client with your API key:

```python
from mutx import MutxClient

# Using context manager (recommended)
with MutxClient(api_key="mutx_live_your_key") as client:
    # API calls here
    pass
```

### Custom Base URL

```python
with MutxClient(
    api_key="mutx_live_your_key",
    base_url="http://localhost:8000"
) as client:
    # ...
```

### Timeout Configuration

```python
with MutxClient(
    api_key="mutx_live_your_key",
    timeout=60.0
) as client:
    # ...
```

---

## Agents

### List All Agents

```python
from mutx import MutxClient

with MutxClient(api_key="your-api-key") as client:
    agents = client.agents.list()
    for agent in agents:
        print(f"{agent.name}: {agent.status}")
```

### Create an Agent

```python
from mutx import MutxClient

with MutxClient(api_key="your-api-key") as client:
    agent = client.agents.create(
        name="my-agent",
        description="A helpful assistant",
        type="openai",
        config={"model": "gpt-4", "temperature": 0.7}
    )
    print(f"Created agent: {agent.id}")
```

### Get Agent Details

```python
with MutxClient(api_key="your-api-key") as client:
    agent = client.agents.get("550e8400-e29b-41d4-a716-446655440000")
    print(f"Agent: {agent.name}, Status: {agent.status}")
```

### Update Agent Configuration

```python
with MutxClient(api_key="your-api-key") as client:
    updated = client.agents.update_config(
        agent_id="550e8400-e29b-41d4-a716-446655440000",
        config={"model": "gpt-4-turbo", "temperature": 0.5}
    )
```

### Deploy an Agent

```python
with MutxClient(api_key="your-api-key") as client:
    result = client.agents.deploy("550e8400-e29b-41d4-a716-446655440000")
```

### Stop a Deployment

```python
with MutxClient(api_key="your-api-key") as client:
    result = client.agents.stop("550e8400-e29b-41d4-a716-446655440000")
```

### Get Agent Logs

```python
with MutxClient(api_key="your-api-key") as client:
    logs = client.agents.logs(agent_id="agent-id", level="ERROR", limit=100)
    for log in logs:
        print(f"[{log.timestamp}] {log.level}: {log.message}")
```

### Stream Agent Logs

```python
def log_handler(log):
    print(f"Received: {log.message}")

with MutxClient(api_key="your-api-key") as client:
    for log in client.agents.stream_logs(agent_id="agent-id", callback=log_handler):
        pass
```

### Get Agent Metrics

```python
with MutxClient(api_key="your-api-key") as client:
    metrics = client.agents.metrics(agent_id="agent-id", limit=50)
    for m in metrics:
        print(f"CPU: {m.cpu_usage}%, Memory: {m.memory_usage}%")
```

### Delete an Agent

```python
with MutxClient(api_key="your-api-key") as client:
    client.agents.delete("agent-id")
```

---

## API Keys

### List API Keys

```python
with MutxClient(api_key="your-api-key") as client:
    keys = client.api_keys.list()
    for key in keys:
        print(f"{key.name}: active={key.is_active}")
```

### Create an API Key

```python
with MutxClient(api_key="your-api-key") as client:
    new_key = client.api_keys.create(name="production-key", expires_in_days=90)
    print(f"API Key: {new_key.key}")
```

### Rotate an API Key

```python
with MutxClient(api_key="your-api-key") as client:
    rotated = client.api_keys.rotate("key-uuid")
    print(f"New key: {rotated.key}")
```

### Revoke an API Key

```python
with MutxClient(api_key="your-api-key") as client:
    client.api_keys.revoke("key-uuid")
```

---

## Webhooks

### Create a Webhook

```python
with MutxClient(api_key="your-api-key") as client:
    webhook = client.webhooks.create(
        url="https://your-server.com/webhook",
        events=["agent.deployed", "agent.stopped"],
        secret="your-secret"
    )
```

### List Webhooks

```python
with MutxClient(api_key="your-api-key") as client:
    webhooks = client.webhooks.list()
```

### Update a Webhook

```python
with MutxClient(api_key="your-api-key") as client:
    updated = client.webhooks.update(webhook_id="wh-id", url="https://new-url.com")
```

### Test a Webhook

```python
with MutxClient(api_key="your-api-key") as client:
    result = client.webhooks.test("webhook-id")
```

### Get Webhook Deliveries

```python
with MutxClient(api_key="your-api-key") as client:
    deliveries = client.webhooks.get_deliveries(webhook_id="wh-id", success=True)
```

### Delete a Webhook

```python
with MutxClient(api_key="your-api-key") as client:
    client.webhooks.delete("webhook-id")
```

---

## Deployments

### Create a Deployment

```python
with MutxClient(api_key="your-api-key") as client:
    deployment = client.deployments.create(agent_id="agent-id", replicas=2)
    print(f"Deployment: {deployment.id}, Status: {deployment.status}")
```

### List Deployments

```python
with MutxClient(api_key="your-api-key") as client:
    deployments = client.deployments.list(status="running")
```

### Get Deployment Details

```python
with MutxClient(api_key="your-api-key") as client:
    d = client.deployments.get("deployment-id")
    print(f"Status: {d.status}, Replicas: {d.replicas}")
```

### Scale a Deployment

```python
with MutxClient(api_key="your-api-key") as client:
    updated = client.deployments.scale(deployment_id="d-id", replicas=5)
```

### Restart a Deployment

```python
with MutxClient(api_key="your-api-key") as client:
    restarted = client.deployments.restart("deployment-id")
```

### Get Deployment Logs

```python
with MutxClient(api_key="your-api-key") as client:
    logs = client.deployments.logs(deployment_id="d-id", level="ERROR")
```

### Get Deployment Metrics

```python
with MutxClient(api_key="your-api-key") as client:
    metrics = client.deployments.metrics(deployment_id="d-id")
```

### Get Deployment Events

```python
with MutxClient(api_key="your-api-key") as client:
    events = client.deployments.events(deployment_id="d-id", status="failed")
    print(f"Total: {events.total}")
```

### Delete a Deployment

```python
with MutxClient(api_key="your-api-key") as client:
    client.deployments.delete("deployment-id")
```

---

## ClawHub

### List Available Skills

```python
with MutxClient(api_key="your-api-key") as client:
    skills = client.clawhub.list_skills()
    for s in skills:
        print(f"{s.name}: {s.description}")
```

### Install a Skill

```python
with MutxClient(api_key="your-api-key") as client:
    client.clawhub.install_skill(agent_id="agent-id", skill_id="github")
```

### Uninstall a Skill

```python
with MutxClient(api_key="your-api-key") as client:
    client.clawhub.uninstall_skill(agent_id="agent-id", skill_id="github")
```

---

## Async Support

```python
import asyncio
from mutx import MutxAsyncClient

async def main():
    async with MutxAsyncClient(api_key="your-key") as client:
        agents = await client.agents.alist()
        await client.agents.acreate(name="async-agent", type="openai")

asyncio.run(main())
```

{% hint style="warning" %}
MutxAsyncClient is deprecated. Use MutxClient with async-prefixed resource methods instead.
{% endhint %}

---

## Error Handling

```python
import httpx

with MutxClient(api_key="your-api-key") as client:
    try:
        agent = client.agents.get("invalid-id")
    except httpx.HTTPStatusError as e:
        print(f"HTTP {e.response.status_code}: {e.response.text}")
```

---

## Good Use Cases

- Backend services calling MUTX directly
- Scripts for agent and deployment automation
- CI jobs that should avoid browser auth flows
- Monitoring agent health and metrics

---

## Related Docs

- [API Overview](api/index.md)
- [CLI Guide](cli.md)
