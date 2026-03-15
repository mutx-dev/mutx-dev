import logging
from typing import Dict, Any
from datetime import datetime, timezone

from src.api.models import Agent, AgentStatus, AgentLog
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class OpenClawProvider:
    """
    Integration provider for OpenClaw (github.com/openclaw/openclaw).
    Bridges OpenClaw's local-first runtime with mutx.dev cloud infrastructure.
    """

    def __init__(self, agent: Agent):
        self.agent = agent
        self.config = self._parse_config(agent.config)

    def _parse_config(self, config_str: str | None) -> Dict[str, Any]:
        import json

        try:
            return json.loads(config_str) if config_str else {}
        except json.JSONDecodeError:
            return {}

    async def deploy(self, session: AsyncSession):
        """
        Simulates the deployment of an OpenClaw instance.
        In a real scenario, this would provision a container with OpenClaw pre-installed.
        """
        logger.info(f"Deploying OpenClaw agent: {self.agent.name}")

        # 1. Initialize OpenClaw workspace
        await self._log(session, "Initializing OpenClaw runtime environment...")

        # 2. Install requested skills from ClawHub
        skills = self.config.get("skills", [])
        if skills:
            await self._log(session, f"Installing skills from ClawHub: {', '.join(skills)}")
            # Simulation: wait for skill installation

        # 3. Configure Gateways (WhatsApp, Discord, etc.)
        gateways = self.config.get("gateways", [])
        if gateways:
            await self._log(session, f"Configuring Gateways: {', '.join(gateways)}")

        await self._log(session, "OpenClaw Gateway is live. Ready for autonomous execution.")

    async def _log(self, session: AsyncSession, message: str, level: str = "info"):
        log = AgentLog(
            agent_id=self.agent.id,
            level=level,
            message=f"[OpenClaw] {message}",
            timestamp=datetime.now(timezone.utc),
        )
        session.add(log)
        await session.commit()


async def handle_openclaw_lifecycle(session: AsyncSession, agent: Agent):
    """
    Hook for the background monitor to handle OpenClaw-specific lifecycle events.
    """
    if agent.type == "custom" and "openclaw" in (agent.description or "").lower():
        provider = OpenClawProvider(agent)
        if agent.status == AgentStatus.CREATING.value:
            await provider.deploy(session)
