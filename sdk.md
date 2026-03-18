---
description: Complete Python SDK reference for MUTX - Manage, deploy, and monitor AI agents
icon: 🤖
---

# MUTX Python SDK

A comprehensive Python SDK for interacting with the MUTX platform. Manage agents, deployments, API keys, webhooks, and ClawHub skills programmatically.

## Installation

Install the MUTX SDK using pip:

```bash
pip install mutx
```

Or install from source:

```bash
cd sdk
pip install -e .
```

**Requirements:**
- Python 3.9+
- httpx >= 0.27.0

---

## Quick Start

Get started with the MUTX SDK in minutes:

```python
from mutx import MutxClient

# Initialize the client with your API key
client = MutxClient(api_key="your-api-key")

# List all agents
agents = client.agents.list()
print(f"Found {len(agents)} agents")

# Create a new agent
new_agent = client.agents.create(
    name="my-agent",
    description="My first AI agent",
    type="openai",
    config={"model": "gpt-4"}
)
print(f"Created agent: {new_agent.name} (ID: {new_agent.id})")

# Don't forget to close the client when done
client.close()
```

### Using Context Managers

The SDK supports context managers for automatic cleanup:

```python
from mutx import MutxClient

with MutxClient(api_key="your-api-key") as client:
    agents = client.agents.list()
    for agent in agents:
        print(f"{agent.name}: {agent.status}")
# Client automatically closed
```

---

## Authentication

### API Key Authentication

The primary authentication method uses API keys:

```python
from mutx import MutxClient

# Standard authentication
client = MutxClient(api_key="your-api-key")

# Using environment variable
import os
client = MutxClient(api_key=os.environ.get("MUTX_API_KEY"))
```

### Local Development

For local development, you can override the base URL:

```python
from mutx import MutxClient

# Use local development server
client = MutxClient(
    api_key="your-api-key",
    base_url="http://localhost:8000"
)
```

### Custom Timeout

Configure custom request timeouts:

```python
from mutx import MutxClient

# 60-second timeout for long-running operations
client = MutxClient(
    api_key="your-api-key",
    timeout=60.0
)
```

### Environment Variables

The SDK can automatically use environment variables:

```python
import os
from mutx import MutxClient

# Set environment variables
os.environ["MUTX_API_KEY"] = "your-api-key"
os.environ["MUTX_BASE_URL"] = "https://api.mutx.dev"

# Client reads from environment automatically
client = MutxClient()
```

---

## Agents

The Agents resource provides full lifecycle management for your AI agents.

### List All Agents

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# List all agents with pagination
agents = client.agents.list(skip=0, limit=50)

for agent in agents:
    print(f"{agent.name} - {agent.status}")

client.close()
```

### Create Agent

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Create a basic agent
agent = client.agents.create(
    name="my-agent",
    description="A helpful assistant agent"
)

# Create an agent with custom configuration
agent = client.agents.create(
    name="custom-agent",
    description="Agent with custom config",
    type="openai",
    config={
        "model": "gpt-4",
        "temperature": 0.7,
        "max_tokens": 2000,
        "system_prompt": "You are a helpful coding assistant."
    }
)

print(f"Created: {agent.id}")
client.close()
```

### Get Agent Details

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Get detailed agent information including deployments
agent = client.agents.get("agent-uuid-or-name")

print(f"Name: {agent.name}")
print(f"Status: {agent.status}")
print(f"Description: {agent.description}")
print(f"Created: {agent.created_at}")
print(f"Config: {agent.config}")

# Access deployments
for deployment in agent.deployments:
    print(f"  Deployment: {deployment.status} (replicas: {deployment.replicas})")

client.close()
```

### Update Agent Configuration

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Update agent configuration
updated_agent = client.agents.update_config(
    agent_id="agent-uuid",
    config={
        "model": "gpt-4-turbo",
        "temperature": 0.5,
        "max_tokens": 4000
    }
)

# Or pass as JSON string
updated_agent = client.agents.update_config(
    agent_id="agent-uuid",
    config='{"model": "gpt-4", "temperature": 0.8}'
)

print(f"Updated config: {updated_agent.config}")
client.close()
```

### Delete Agent

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Delete an agent
client.agents.delete("agent-uuid")

print("Agent deleted successfully")
client.close()
```

### Deploy Agent

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Deploy an agent
result = client.agents.deploy("agent-uuid")

print(f"Deployment status: {result}")
# Returns: {'deployment_id': '...', 'status': 'starting'}
client.close()
```

### Stop Agent Deployment

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Stop a running deployment
result = client.agents.stop("agent-uuid")

print(f"Stop result: {result}")
client.close()
```

### Get Agent Logs

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Get agent logs
logs = client.agents.logs(
    agent_id="agent-uuid",
    skip=0,
    limit=100,
    level="error"  # Optional: filter by level (debug, info, warning, error)
)

for log in logs:
    print(f"[{log.timestamp}] {log.level}: {log.message}")
    if log.metadata:
        print(f"  Metadata: {log.metadata}")

client.close()
```

### Stream Agent Logs

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Stream logs with callback
def log_callback(log):
    print(f"📝 {log.level}: {log.message}")

# Generator-based streaming
for log in client.agents.stream_logs("agent-uuid", log_callback):
    # Process each log as it comes in
    pass

client.close()
```

### Get Agent Metrics

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Get agent metrics
metrics = client.agents.metrics(
    agent_id="agent-uuid",
    skip=0,
    limit=100
)

for metric in metrics:
    print(f"[{metric.timestamp}]")
    print(f"  CPU: {metric.cpu_usage}%")
    print(f"  Memory: {metric.memory_usage}MB")

client.close()
```

---

## Deployments

Manage agent deployments, scale, restart, and monitor deployment health.

### List Deployments

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# List all deployments
deployments = client.deployments.list(skip=0, limit=50)

# Filter by agent
deployments = client.deployments.list(agent_id="agent-uuid")

# Filter by status
deployments = client.deployments.list(status="running")

for dep in deployments:
    print(f"{dep.id} - {dep.status} (replicas: {dep.replicas})")

client.close()
```

### Create Deployment

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Create a deployment with default replicas
deployment = client.deployments.create(agent_id="agent-uuid")

# Create with specific replicas
deployment = client.deployments.create(
    agent_id="agent-uuid",
    replicas=3
)

print(f"Deployment ID: {deployment.id}")
print(f"Status: {deployment.status}")
print(f"Replicas: {deployment.replicas}")
client.close()
```

### Get Deployment Details

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Get deployment details
deployment = client.deployments.get("deployment-uuid")

print(f"Agent ID: {deployment.agent_id}")
print(f"Status: {deployment.status}")
print(f"Replicas: {deployment.replicas}")
print(f"Node: {deployment.node_id}")
print(f"Started: {deployment.started_at}")
print(f"Events: {len(deployment.events)}")

for event in deployment.events:
    print(f"  Event: {event.event_type} - {event.status}")

client.close()
```

### Scale Deployment

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Scale deployment to new replica count
updated = client.deployments.scale(
    deployment_id="deployment-uuid",
    replicas=5
)

print(f"Scaled to {updated.replicas} replicas")
client.close()
```

### Restart Deployment

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Restart a deployment
updated = client.deployments.restart("deployment-uuid")

print(f"Restarted. New status: {updated.status}")
client.close()
```

### Delete Deployment

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Delete a deployment
client.deployments.delete("deployment-uuid")

print("Deployment deleted")
client.close()
```

### Get Deployment Logs

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Get deployment logs
logs = client.deployments.logs(
    deployment_id="deployment-uuid",
    skip=0,
    limit=100,
    level="error"  # Optional filter
)

for log in logs:
    print(log)

client.close()
```

### Get Deployment Events

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Get deployment event history
events = client.deployments.events(
    deployment_id="deployment-uuid",
    skip=0,
    limit=100,
    event_type="scale",  # Optional filter
    status="completed"   # Optional filter
)

print(f"Total events: {events.total}")
for event in events.items:
    print(f"  {event.event_type}: {event.status} at {event.created_at}")

client.close()
```

### Get Deployment Metrics

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Get deployment metrics
metrics = client.deployments.metrics(
    deployment_id="deployment-uuid",
    skip=0,
    limit=100
)

for metric in metrics:
    print(metric)

client.close()
```

---

## API Keys

Manage your MUTX API keys for authentication.

### List API Keys

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# List all API keys
keys = client.api_keys.list()

for key in keys:
    print(f"{key.name}: {key.id}")
    print(f"  Active: {key.is_active}")
    print(f"  Last used: {key.last_used}")
    print(f"  Created: {key.created_at}")
    print(f"  Expires: {key.expires_at}")

client.close()
```

### Create API Key

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Create a new API key
new_key = client.api_keys.create(
    name="my-new-key"
)

# Create with expiration (30 days)
new_key = client.api_keys.create(
    name="temporary-key",
    expires_in_days=30
)

# ⚠️ IMPORTANT: The key is only shown once!
print(f"API Key: {new_key.key}")  # Save this - you won't see it again!
print(f"Key ID: {new_key.id}")

client.close()
```

### Rotate API Key

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Rotate (revoke old, create new) an API key
rotated = client.api_keys.rotate("key-id")

# ⚠️ Get the new key immediately - only shown once!
print(f"New API Key: {rotated.key}")

client.close()
```

### Revoke API Key

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Revoke (delete) an API key
client.api_keys.revoke("key-id")

print("API key revoked")
client.close()
```

---

## Webhooks

Configure webhooks to receive events from MUTX.

### Create Webhook

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Create a webhook
webhook = client.webhooks.create(
    url="https://your-server.com/webhook",
    events=["agent.created", "agent.deployed", "deployment.stopped"],
    secret="your-webhook-secret",  # Optional: for signature verification
    is_active=True
)

print(f"Created webhook: {webhook.id}")
print(f"URL: {webhook.url}")
print(f"Events: {webhook.events}")
client.close()
```

### List Webhooks

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# List all webhooks
webhooks = client.webhooks.list(skip=0, limit=50)

for webhook in webhooks:
    print(f"{webhook.id}: {webhook.url}")
    print(f"  Active: {webhook.is_active}")
    print(f"  Events: {webhook.events}")

client.close()
```

### Get Webhook

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Get webhook details
webhook = client.webhooks.get("webhook-id")

print(f"ID: {webhook.id}")
print(f"URL: {webhook.url}")
print(f"Secret: {webhook.secret}")
print(f"Events: {webhook.events}")
client.close()
```

### Update Webhook

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Update webhook URL
updated = client.webhooks.update(
    webhook_id="webhook-id",
    url="https://new-url.com/webhook"
)

# Update events
updated = client.webhooks.update(
    webhook_id="webhook-id",
    events=["agent.created", "deployment.started"]
)

# Disable webhook
updated = client.webhooks.update(
    webhook_id="webhook-id",
    is_active=False
)

print(f"Updated: {updated.url}")
client.close()
```

### Test Webhook

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Send a test event to webhook
result = client.webhooks.test("webhook-id")

print(f"Test result: {result}")
client.close()
```

### Get Webhook Deliveries

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Get delivery history
deliveries = client.webhooks.get_deliveries(
    webhook_id="webhook-id",
    skip=0,
    limit=50,
    event="agent.deployed",  # Optional filter
    success=True             # Optional filter
)

for delivery in deliveries:
    print(f"{delivery.id}: {delivery.event}")
    print(f"  Success: {delivery.success}")
    print(f"  Status: {delivery.status_code}")
    print(f"  Attempts: {delivery.attempts}")
    if delivery.error_message:
        print(f"  Error: {delivery.error_message}")

client.close()
```

### Delete Webhook

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Delete a webhook
client.webhooks.delete("webhook-id")

print("Webhook deleted")
client.close()
```

---

## ClawHub

Browse and manage skills from ClawHub - the MUTX skill marketplace.

### List Available Skills

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Get trending skills from ClawHub
skills = client.clawhub.list_skills()

for skill in skills:
    print(f"{skill.name} by {skill.author}")
    print(f"  Description: {skill.description}")
    print(f"  Category: {skill.category}")
    print(f"  Stars: {skill.stars}")
    print(f"  Official: {skill.is_official}")
    print()

client.close()
```

### Install Skill

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Install a skill to an agent
result = client.clawhub.install_skill(
    agent_id="agent-uuid",
    skill_id="skill-id"
)

print(f"Skill installed: {result}")
client.close()
```

### Uninstall Skill

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

# Remove a skill from an agent
result = client.clawhub.uninstall_skill(
    agent_id="agent-uuid",
    skill_id="skill-id"
)

print(f"Skill uninstalled: {result}")
client.close()
```

---

## Agent Runtime

The Agent Runtime SDK allows agents to connect to and communicate with the MUTX platform. This is used by agents themselves, not by users managing agents.

### MutxAgentClient (Async)

The async client for agents to register and communicate with MUTX:

```python
import asyncio
from mutx import MutxAgentClient, AgentMetrics

async def main():
    # Create agent client
    client = MutxAgentClient(
        mutx_url="https://api.mutx.dev",
        api_key="your-agent-api-key"  # Or None to register new
    )

    # Register a new agent
    agent_info = await client.register(
        name="my-agent",
        description="A helpful assistant"
    )
    print(f"Registered: {agent_info.agent_id}")

    # Or connect with existing credentials
    # await client.connect(agent_id="...", api_key="...")

    # Start automatic heartbeats
    client.start_heartbeat(interval=30, status="running")

    # Report metrics
    await client.report_metrics(AgentMetrics(
        cpu_usage=25.0,
        memory_usage=512.0,
        uptime_seconds=client.uptime,
        requests_processed=100,
        errors_count=2
    ))

    # Poll for commands
    commands = await client.poll_commands()
    for cmd in commands:
        print(f"Received command: {cmd.action}")
        print(f"Parameters: {cmd.parameters}")

        # Acknowledge command
        await client.acknowledge_command(
            command_id=cmd.command_id,
            success=True,
            result={"output": "Command executed"}
        )

    # Send logs
    await client.log(
        level="info",
        message="Agent started successfully",
        metadata={"version": "1.0.0"}
    )

    # Stop heartbeats
    client.stop_heartbeat()

    # Cleanup
    await client.close()

asyncio.run(main())
```

### Command Callback Loop

Use the built-in command loop for automatic command processing:

```python
import asyncio
from mutx import MutxAgentClient, Command

async def handle_command(command: Command):
    """Handle incoming commands."""
    print(f"Handling: {command.action}")

    if command.action == "greet":
        return {"message": f"Hello, {command.parameters.get('name', 'World')}!"}
    elif command.action == "calculate":
        result = eval(command.parameters.get("expression", "0"))
        return {"result": result}
    else:
        raise ValueError(f"Unknown command: {command.action}")

async def main():
    client = MutxAgentClient(mutx_url="https://api.mutx.dev")
    await client.register(name="my-agent")

    # Set command callback
    client.set_command_callback(handle_command)

    # Run command loop (blocks forever)
    await client.run_command_loop(poll_interval=5)

asyncio.run(main())
```

### MutxAgentSyncClient (Sync)

Synchronous version for simpler use cases:

```python
from mutx import MutxAgentSyncClient

# Create sync client
client = MutxAgentSyncClient(
    mutx_url="https://api.mutx.dev",
    api_key="your-agent-api-key"
)

# Register
agent_info = client.register(
    name="my-agent",
    description="Sync agent"
)

# Send heartbeat
client.heartbeat(status="running", message="All good!")

# Report metrics
client.report_metrics(
    cpu_usage=10.0,
    memory_usage=256.0,
    custom={"requests": 50}
)

# Log
client.log(
    level="info",
    message="Agent is running",
    metadata={"version": "1.0"}
)

print(f"Registered: {agent_info.agent_id}")
```

### Convenience Function

Quick setup with the helper function:

```python
import asyncio
from mutx import create_agent_client

async def main():
    # Create and register in one call
    client = await create_agent_client(
        mutx_url="https://api.mutx.dev",
        agent_name="quick-start-agent",
        agent_description="Created via create_agent_client"
    )

    # Start heartbeat
    client.start_heartbeat(interval=30)

    print(f"Agent running: {client.agent_id}")

    # ... your agent logic ...

    client.stop_heartbeat()
    await client.close()

asyncio.run(main())
```

---

## Async Usage

The SDK supports both sync and async operations. All resources provide `a*` prefixed methods for async usage.

### Using AsyncClient Directly

```python
import httpx
from mutx import MutxClient
from mutx.agents import Agents
from mutx.deployments import Deployments
from mutx.api_keys import APIKeys
from mutx.webhooks import Webhooks
from mutx.clawhub import ClawHub

# Create async client
async_client = httpx.AsyncClient(
    base_url="https://api.mutx.dev",
    headers={"Authorization": "Bearer your-api-key"}
)

# Attach resources
agents = Agents(async_client)
deployments = Deployments(async_client)
api_keys = APIKeys(async_client)
webhooks = Webhooks(async_client)
clawhub = ClawHub(async_client)

# Use async methods
async def main():
    # List agents
    agent_list = await agents.alist()

    # Create agent
    new_agent = await agents.acreate(name="async-agent")

    # Get deployment
    deployment = await deployments.aget("deployment-uuid")

    # Scale deployment
    scaled = await deployments.ascale("deployment-uuid", replicas=3)

    await async_client.aclose()

asyncio.run(main())
```

### Using MutxAsyncClient

```python
import warnings
from mutx import MutxAsyncClient

# Note: MutxAsyncClient is deprecated in favor of using
# async-prefixed methods with sync client
# This still works but shows deprecation warning
warnings.filterwarnings("ignore", category=DeprecationWarning)

async def main():
    async with MutxAsyncClient(api_key="your-api-key") as client:
        agents = await client.agents.alist()
        for agent in agents:
            print(f"{agent.name}: {agent.status}")

asyncio.run(main())
```

### Best Practices for Async

```python
import asyncio
from mutx import MutxClient

async def manage_agents():
    """Example: Efficient async operations."""
    client = MutxClient(api_key="your-api-key")

    # Using async methods requires async transport
    # The sync client handles async automatically with a* methods
    # when used with httpx.AsyncClient

    # List agents concurrently with deployments
    agents = client.agents.list()

    for agent in agents:
        # Get details (includes deployments)
        detail = client.agents.get(agent.id)
        print(f"{detail.name}: {len(detail.deployments)} deployments")

    client.close()

# Run sync code in async context
asyncio.run(manage_agents())
```

---

## Error Handling

The SDK raises exceptions for API errors. Use try/except blocks for robust error handling.

### Basic Error Handling

```python
from mutx import MutxClient
import httpx

client = MutxClient(api_key="your-api-key")

try:
    agent = client.agents.get("invalid-uuid")
except httpx.HTTPStatusError as e:
    if e.response.status_code == 404:
        print("Agent not found")
    elif e.response.status_code == 401:
        print("Unauthorized - check your API key")
    elif e.response.status_code == 403:
        print("Forbidden - insufficient permissions")
    else:
        print(f"HTTP Error: {e.response.status_code}")
except httpx.RequestError as e:
    print(f"Request failed: {e}")
finally:
    client.close()
```

### Handling All Errors

```python
from mutx import MutxClient
import httpx

client = MutxClient(api_key="your-api-key")

try:
    # Your operations
    agents = client.agents.list()
except httpx.HTTPStatusError as e:
    # Handle HTTP errors (4xx, 5xx)
    print(f"HTTP {e.response.status_code}: {e.response.text}")
except httpx.RequestError as e:
    # Handle network errors (timeouts, connection errors)
    print(f"Request error: {e}")
except Exception as e:
    # Handle unexpected errors
    print(f"Unexpected error: {e}")
finally:
    client.close()
```

### Validation Errors

```python
from mutx import MutxClient

client = MutxClient(api_key="your-api-key")

try:
    # Invalid creation - missing required fields
    agent = client.agents.create(name="")  # Empty name
except Exception as e:
    print(f"Validation error: {e}")

try:
    # Invalid deployment
    client.agents.deploy("non-existent-agent")
except httpx.HTTPStatusError as e:
    if e.response.status_code == 404:
        print("Agent not found")

client.close()
```

### Retry Logic

```python
import httpx
from mutx import MutxClient
from tenacity import retry, stop_after_attempt, wait_exponential

client = MutxClient(api_key="your-api-key")

# Using tenacity for automatic retries
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def robust_list_agents():
    return client.agents.list()

# Or manual retry
def get_with_retry(client, max_retries=3):
    for attempt in range(max_retries):
        try:
            return client.agents.list()
        except httpx.TimeoutException:
            if attempt == max_retries - 1:
                raise
            print(f"Timeout, retrying... ({attempt + 1}/{max_retries})")
    return None
```

---

## Good Use Cases

### CI/CD Automation

```python
from mutx import MutxClient
import os

def deploy_to_staging():
    """Deploy agent to staging environment."""
    client = MutxClient(api_key=os.environ["MUTX_API_KEY"])

    # Get agent
    agent = client.agents.get("production-agent")

    # Deploy
    result = client.agents.deploy(agent.id)
    print(f"Deployed: {result}")

    # Wait for running
    import time
    for _ in range(30):
        time.sleep(2)
        deployment = client.deployments.get(result["deployment_id"])
        if deployment.status == "running":
            print("✅ Staging deployment ready")
            break

    client.close()

if __name__ == "__main__":
    deploy_to_staging()
```

### Monitoring Script

```python
from mutx import MutxClient
from datetime import datetime, timedelta
import os

def check_agent_health():
    """Monitor agent health and metrics."""
    client = MutxClient(api_key=os.environ["MUTX_API_KEY"])

    agents = client.agents.list()

    print(f"📊 Agent Health Report - {datetime.now()}")
    print("=" * 50)

    for agent in agents:
        detail = client.agents.get(agent.id)
        logs = client.agents.logs(agent.id, limit=10)

        # Check for recent errors
        errors = [l for l in logs if l.level == "error"]

        status = "✅" if agent.status == "running" else "❌"
        error_count = len(errors)

        print(f"{status} {agent.name}")
        print(f"   Status: {agent.status}")
        print(f"   Errors (last 10): {error_count}")
        print(f"   Deployments: {len(detail.deployments)}")

    client.close()

if __name__ == "__main__":
    check_agent_health()
```

### Webhook Management

```python
from mutx import MutxClient

def setup_deployment_webhooks():
    """Configure webhooks for deployment events."""
    client = MutxClient(api_key="your-api-key")

    events = [
        "deployment.started",
        "deployment.stopped",
        "deployment.failed",
        "deployment.scaled"
    ]

    webhook = client.webhooks.create(
        url="https://your-app.com/hooks/mutx",
        events=events,
        is_active=True
    )

    print(f"Webhook created: {webhook.id}")

    # Test the webhook
    result = client.webhooks.test(webhook.id)
    print(f"Test result: {result}")

    client.close()

if __name__ == "__main__":
    setup_deployment_webhooks()
```

### Agent Self-Registration

```python
import asyncio
from mutx import MutxAgentClient, AgentMetrics, create_agent_client

async def agent_main():
    """Example agent that registers and communicates with MUTX."""

    # Create and register agent
    client = await create_agent_client(
        agent_name="auto-scaling-worker",
        agent_description="Handles compute-intensive tasks"
    )

    print(f"Agent ID: {client.agent_id}")

    # Start heartbeat
    client.start_heartbeat(interval=15)

    # Main agent loop
    while True:
        try:
            # Poll for commands
            commands = await client.poll_commands()

            for cmd in commands:
                print(f"Processing: {cmd.action}")

                try:
                    # Execute command
                    result = {"status": "completed", "output": "done"}

                    await client.acknowledge_command(
                        command_id=cmd.command_id,
                        success=True,
                        result=result
                    )
                except Exception as e:
                    await client.acknowledge_command(
                        command_id=cmd.command_id,
                        success=False,
                        error=str(e)
                    )

            # Report metrics
            await client.report_metrics(AgentMetrics(
                cpu_usage=50.0,
                memory_usage=1024.0,
                requests_processed=100
            ))

        except Exception as e:
            await client.log("error", f"Agent error: {e}")

        await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(agent_main())
```

### Key Rotation Automation

```python
from mutx import MutxClient
import os

def rotate_api_keys():
    """Automate API key rotation."""
    client = MutxClient(api_key=os.environ["MUTX_API_KEY"])

    # List current keys
    keys = client.api_keys.list()
    print(f"Current keys: {len(keys)}")

    # Rotate each key
    for key in keys:
        if "production" in key.name.lower():
            print(f"Rotating: {key.name}")

            rotated = client.api_keys.rotate(key.id)

            # Store new key securely
            # In production, use a secrets manager!
            print(f"New key: {rotated.key}")

            # Update your secrets
            # update_secret(key.name, rotated.key)

    client.close()

if __name__ == "__main__":
    rotate_api_keys()
```

---

## Related Docs

- [MUTX Official Documentation](https://docs.mutx.dev)
- [MUTX API Reference](https://api.mutx.dev/docs)
- [ClawHub Skills Marketplace](https://clawhub.dev)
- [GitHub Repository](https://github.com/mutx-dev/sdk-python)
- [Report Issues](https://github.com/mutx-dev/sdk-python/issues)

---

## Support

- **Email**: hello@mutx.dev
- **Discord**: [Join our community](https://discord.gg/mutx)
- **GitHub Issues**: https://github.com/mutx-dev/sdk-python/issues
