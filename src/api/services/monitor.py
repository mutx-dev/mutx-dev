import asyncio
import logging
import random
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api import database as database_module
from src.api.models import Agent, AgentLog, AgentMetric, AgentStatus, Deployment

logger = logging.getLogger(__name__)

# --- Synthetic Data Generators ---

COT_STEPS = [
    "plan next tool call",
    "summarize retrieved evidence",
    "compare candidate actions",
    "verify output safety",
]

MODELS = ["gpt-4o-mini", "claude-3-5-sonnet", "llama3.1"]
TOOLS = ["web_search", "vector_lookup", "http_request", "code_exec"]

LOG_TEMPLATES = [
    ("info", "Received request: {request_id}"),
    ("info", "Thinking... (Chain of Thought: {cot_step})"),
    ("info", "Querying vector database for context..."),
    ("info", "Retrieved {doc_count} relevant documents."),
    ("info", "Generating response with model {model}..."),
    ("info", "Tool call: {tool_name}({tool_args})"),
    ("warning", "High latency detected in tool execution ({latency}ms)"),
    ("info", "Response generated successfully."),
    ("info", "Updating state persistence layer..."),
    ("info", "[Webhook] Ingested event: {webhook_event} from {webhook_source}"),
    ("info", "[Webhook] Triggering autonomous reaction for event ID {event_id}"),
]

WEBHOOK_SOURCES = ["Stripe", "GitHub", "Shopify", "Twilio", "Intercom"]
WEBHOOK_EVENTS = ["payment.succeeded", "push", "order.created", "message.received", "user.signup"]

async def _generate_logs(session: AsyncSession, agent_id: uuid.UUID):
    """Generates a batch of fake logs for a running agent."""
    num_logs = random.randint(1, 3)
    for _ in range(num_logs):
        level, template = random.choice(LOG_TEMPLATES)
        
        # Fill template
        message = template.format(
            request_id=str(uuid.uuid4())[:8],
            cot_step=random.choice(COT_STEPS),
            doc_count=random.randint(1, 10),
            model=random.choice(MODELS),
            tool_name=random.choice(TOOLS),
            tool_args="...",
            latency=random.randint(100, 2000),
            webhook_event=random.choice(WEBHOOK_EVENTS),
            webhook_source=random.choice(WEBHOOK_SOURCES),
            event_id=str(uuid.uuid4())[:12]
        )
        
        log_entry = AgentLog(
            agent_id=agent_id,
            level=level,
            message=message,
            timestamp=datetime.utcnow()
        )
        session.add(log_entry)

async def _generate_metrics(session: AsyncSession, agent_id: uuid.UUID):
    """Generates fake CPU/Memory metrics."""
    # Simulate some load spikes
    base_cpu = 10.0
    base_mem = 256.0 # MB
    
    cpu_usage = base_cpu + random.uniform(0, 80) if random.random() > 0.8 else base_cpu + random.uniform(0, 20)
    memory_usage = base_mem + random.uniform(0, 512)
    
    metric = AgentMetric(
        agent_id=agent_id,
        cpu_usage=cpu_usage,
        memory_usage=memory_usage,
        timestamp=datetime.utcnow()
    )
    session.add(metric)

async def _simulate_agent_lifecycle(session: AsyncSession):
    """
    Finds agents and simulates their lifecycle.
    - Moves 'creating' -> 'running'
    - 'running' agents generate logs/metrics
    - Occasionally 'crashes' a running agent -> 'failed'
    - Auto-heals 'failed' -> 'running' (The Platform Value Prop!)
    """
    
    # 1. Promote CREATING -> RUNNING
    result = await session.execute(
        select(Agent).where(Agent.status == AgentStatus.CREATING.value)
    )
    new_agents = result.scalars().all()
    for agent in new_agents:
        # Simulate deployment time
        if datetime.utcnow() - agent.created_at > timedelta(seconds=5):
            agent.status = AgentStatus.RUNNING.value
            # Create a deployment record if none exists
            dep_check = await session.execute(select(Deployment).where(Deployment.agent_id == agent.id))
            if not dep_check.scalar_one_or_none():
                deployment = Deployment(
                    agent_id=agent.id,
                    status="running",
                    replicas=1,
                    started_at=datetime.utcnow(),
                    node_id=f"node-{uuid.uuid4().hex[:6]}"
                )
                session.add(deployment)
            logger.info(f"Agent {agent.name} is now RUNNING")

    # 2. Manage RUNNING agents (Logs, Metrics, Chaos)
    result = await session.execute(
        select(Agent).where(Agent.status == AgentStatus.RUNNING.value)
    )
    running_agents = result.scalars().all()
    
    for agent in running_agents:
        # Generate heartbeat data
        await _generate_logs(session, agent.id)
        await _generate_metrics(session, agent.id)
        
        # 1% chance to crash
        if random.random() < 0.01:
            agent.status = AgentStatus.FAILED.value
            logger.warning(f"CHAOS: Agent {agent.name} CRASHED!")
            
            # Log the crash
            crash_log = AgentLog(
                agent_id=agent.id,
                level="error",
                message="RuntimeError: Out of memory (OOM) killed process",
                timestamp=datetime.utcnow()
            )
            session.add(crash_log)

    # 3. Auto-Heal FAILED agents
    result = await session.execute(
        select(Agent).where(Agent.status == AgentStatus.FAILED.value)
    )
    failed_agents = result.scalars().all()
    
    for agent in failed_agents:
        # Auto-heal after 10 seconds
        # In a real system, we'd check updated_at, but let's just heal immediate for the demo loop
        if random.random() > 0.5: # 50% chance per tick to heal
            agent.status = AgentStatus.RUNNING.value
            logger.info(f"AUTO-HEAL: Restarted agent {agent.name}")
            
            heal_log = AgentLog(
                agent_id=agent.id,
                level="info",
                message="System: Control plane initiated automatic restart. Agent is healthy.",
                timestamp=datetime.utcnow()
            )
            session.add(heal_log)

    await session.commit()

async def start_background_monitor():
    """Main loop for the background service."""
    logger.info("Starting background agent monitor...")
    while True:
        try:
            async with database_module.async_session_maker() as session:
                await _simulate_agent_lifecycle(session)
        except Exception as e:
            logger.error(f"Error in background monitor: {e}")
        
        # Tick every 2 seconds for "lively" feel
        await asyncio.sleep(2)
