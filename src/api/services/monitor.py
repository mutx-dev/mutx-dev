import asyncio
import logging
import random
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api import database as database_module
from src.api.models import Agent, AgentLog
from src.api.services.monitoring import monitor_agent_health
from src.api.services.self_healer import get_self_healing_service

logger = logging.getLogger(__name__)

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


async def start_background_monitor():
    """Main loop for the background service."""
    logger.info("Starting background agent monitor...")
    self_healing = get_self_healing_service()
    await self_healing.start()
    try:
        while True:
            try:
                async with database_module.async_session_maker() as session:
                    # 1. Run actual monitoring and self-healing logic
                    await monitor_agent_health(session)

                    # 2. Add synthetic activity for "lively" UI feel (demo only)
                    result = await session.execute(select(Agent).where(Agent.status == "running"))
                    running_agents = result.scalars().all()
                    for agent in running_agents:
                        if random.random() < 0.3:
                            await _generate_synthetic_logs(session, agent.id)

                    await session.commit()
            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.error(f"Error in background monitor: {e}")
                await asyncio.sleep(5)

            await asyncio.sleep(5)  # Run every 5 seconds
    except asyncio.CancelledError:
        logger.info("Background agent monitor cancellation requested")
        raise
    finally:
        try:
            await self_healing.stop()
        except Exception:
            logger.exception("Failed to stop self-healing service cleanly")
