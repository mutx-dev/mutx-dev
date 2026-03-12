import asyncio
import logging
import random
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.api import database as database_module
from src.api.models import Agent, AgentLog, AgentMetric, AgentStatus, Deployment, Alert, AlertType

logger = logging.getLogger(__name__)

# --- Configuration ---
HEARTBEAT_THRESHOLD_SECONDS = 60  # Agent is stale after 60s
STALE_THRESHOLD_SECONDS = 120    # Agent is failed after 120s

# --- Synthetic Data Generators (Keeping for "lively" feel in demo) ---

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


async def _generate_synthetic_logs(session: AsyncSession, agent_id: uuid.UUID):
    """Generates a batch of synthetic logs for a running agent."""
    num_logs = random.randint(1, 2)
    for _ in range(num_logs):
        level, template = random.choice(LOG_TEMPLATES)

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
            event_id=str(uuid.uuid4())[:12],
        )

        log_entry = AgentLog(
            agent_id=agent_id, level=level, message=message, timestamp=datetime.utcnow()
        )
        session.add(log_entry)


async def _simulate_agent_lifecycle(session: AsyncSession):
    """
    Actual Monitoring and Self-Healing logic:
    1. Promote 'creating' -> 'running'
    2. Monitor 'running' agents for heartbeats
    3. Detect stale agents -> create alerts
    4. Auto-heal failed/stale agents -> 'running'
    """

    now = datetime.utcnow()

    # 1. Promote CREATING -> RUNNING
    result = await session.execute(select(Agent).where(Agent.status == AgentStatus.CREATING.value))
    new_agents = result.scalars().all()
    for agent in new_agents:
        if now - agent.created_at > timedelta(seconds=10):
            agent.status = AgentStatus.RUNNING.value
            agent.last_heartbeat = now
            
            dep_check = await session.execute(
                select(Deployment).where(Deployment.agent_id == agent.id)
            )
            if not dep_check.scalar_one_or_none():
                deployment = Deployment(
                    agent_id=agent.id,
                    status="running",
                    replicas=1,
                    started_at=now,
                    node_id=f"node-{uuid.uuid4().hex[:6]}",
                )
                session.add(deployment)
            logger.info(f"Monitor: Agent {agent.name} is now RUNNING")

    # 2. Monitor RUNNING agents for Heartbeats
    result = await session.execute(select(Agent).where(Agent.status == AgentStatus.RUNNING.value))
    running_agents = result.scalars().all()

    for agent in running_agents:
        # If no heartbeat for > STALE_THRESHOLD, mark as FAILED
        last_hb = agent.last_heartbeat or agent.created_at
        if now - last_hb > timedelta(seconds=STALE_THRESHOLD_SECONDS):
            logger.warning(f"Monitor: Agent {agent.name} is STALE (no heartbeat for {STALE_THRESHOLD_SECONDS}s). Marking as FAILED.")
            agent.status = AgentStatus.FAILED.value
            
            alert = Alert(
                agent_id=agent.id,
                type=AlertType.AGENT_DOWN,
                message=f"Agent {agent.name} failed to report heartbeat for {STALE_THRESHOLD_SECONDS}s",
            )
            session.add(alert)
            
            log = AgentLog(
                agent_id=agent.id,
                level="error",
                message=f"System: Agent marked as FAILED due to heartbeat timeout ({STALE_THRESHOLD_SECONDS}s).",
            )
            session.add(log)
        else:
            # Generate synthetic activity to keep things lively if desired
            if random.random() < 0.3:
                await _generate_synthetic_logs(session, agent.id)

    # 3. Auto-Heal FAILED agents
    result = await session.execute(select(Agent).where(Agent.status == AgentStatus.FAILED.value))
    failed_agents = result.scalars().all()

    for agent in failed_agents:
        # Check if we should attempt a restart (auto-heal)
        # For the demo, we heal after 30 seconds of fail state
        if now - agent.updated_at > timedelta(seconds=30):
            logger.info(f"Auto-Healer: Restarting agent {agent.name}...")
            agent.status = AgentStatus.RUNNING.value
            agent.last_heartbeat = now
            
            # Resolve any active AGENT_DOWN alerts
            await session.execute(
                update(Alert)
                .where(Alert.agent_id == agent.id, Alert.type == AlertType.AGENT_DOWN, Alert.resolved == False)
                .values(resolved=True, resolved_at=now)
            )
            
            heal_log = AgentLog(
                agent_id=agent.id,
                level="info",
                message="System: Control plane detected failure and initiated automatic recovery. Agent is back to RUNNING.",
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
            await asyncio.sleep(5)

        await asyncio.sleep(5)  # Run every 5 seconds
