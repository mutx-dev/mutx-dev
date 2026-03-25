"""
Faramesh supervision service for production agent deployment.

Uses `faramesh run -- <cmd>` to automatically patch framework tool calls
and provide governance supervision for agent processes.

Faramesh supports 13 frameworks with auto-patch at runtime:
- LangGraph, CrewAI, AutoGen, Pydantic AI, LlamaIndex,
- Hayject, AgentKit, AgentOps, Braintrust, Helicone,
- Weave, AG2, Mem0
"""

import asyncio
import logging
import os
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

FAREMESH_SOCKET_PATH = "/tmp/faramesh.sock"


class SupervisionState(str, Enum):
    STARTING = "starting"
    RUNNING = "running"
    STOPPING = "stopping"
    STOPPED = "stopped"
    FAILED = "failed"
    RESTARTING = "restarting"


@dataclass
class SupervisedAgent:
    agent_id: str
    command: list[str]
    env: dict[str, str]
    state: SupervisionState = SupervisionState.STOPPED
    process: Optional[subprocess.Popen] = None
    pid: Optional[int] = None
    restart_count: int = 0
    last_exit_code: Optional[int] = None
    last_start_at: Optional[datetime] = None
    last_stop_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    faramesh_policy: Optional[str] = None


@dataclass
class SupervisionConfig:
    faramesh_bin: Optional[str] = None
    policy_path: Optional[str] = None
    socket_path: str = FAREMESH_SOCKET_PATH
    auto_restart: bool = True
    max_restarts: int = 3
    restart_delay: float = 5.0
    health_check_interval: float = 30.0
    shutdown_timeout: float = 10.0


class FarameshSupervisor:
    """
    Supervises agent processes using `faramesh run`.

    This allows Faramesh to automatically patch framework tool calls
    and provide governance oversight for agent processes.
    """

    def __init__(self, config: Optional[SupervisionConfig] = None):
        self.config = config or SupervisionConfig()
        self._agents: dict[str, SupervisedAgent] = {}
        self._health_check_task: Optional[asyncio.Task] = None
        self._running = False

    def _find_faramesh_bin(self) -> Optional[str]:
        if self.config.faramesh_bin:
            return self.config.faramesh_bin

        bin_path = Path.home() / ".local" / "bin" / "faramesh"
        if bin_path.exists():
            return str(bin_path)

        import shutil

        return shutil.which("faramesh")

    async def start_agent(
        self,
        agent_id: str,
        command: list[str],
        env: Optional[dict[str, str]] = None,
        faramesh_policy: Optional[str] = None,
    ) -> bool:
        """
        Start an agent under Faramesh supervision.

        Args:
            agent_id: Unique identifier for the agent
            command: Command to run (e.g., ["python", "agent.py"])
            env: Environment variables
            faramesh_policy: Path to FPL policy file

        Returns:
            True if agent started successfully
        """
        if agent_id in self._agents:
            agent = self._agents[agent_id]
            if agent.state in (SupervisionState.RUNNING, SupervisionState.STARTING):
                logger.warning(f"Agent {agent_id} is already running")
                return False

        faramesh_bin = self._find_faramesh_bin()
        if not faramesh_bin:
            logger.error("Faramesh binary not found")
            return False

        policy = faramesh_policy or self.config.policy_path

        supervised_command = [faramesh_bin, "run"]
        if policy:
            supervised_command.extend(["--policy", policy])
        supervised_command.extend(["--", *command])

        full_env = os.environ.copy()
        if env:
            full_env.update(env)
        full_env["FAREMESH_SOCKET_PATH"] = self.config.socket_path

        try:
            process = subprocess.Popen(
                supervised_command,
                env=full_env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            agent = SupervisedAgent(
                agent_id=agent_id,
                command=command,
                env=full_env,
                state=SupervisionState.STARTING,
                process=process,
                pid=process.pid,
                faramesh_policy=policy,
                started_at=datetime.now(timezone.utc),
                last_start_at=datetime.now(timezone.utc),
            )
            self._agents[agent_id] = agent

            await asyncio.sleep(0.5)

            if process.poll() is not None:
                stdout, stderr = process.communicate()
                logger.error(
                    f"Agent {agent_id} failed to start: "
                    f"exit={process.returncode} stderr={stderr.decode()}"
                )
                agent.state = SupervisionState.FAILED
                agent.last_exit_code = process.returncode
                return False

            agent.state = SupervisionState.RUNNING
            logger.info(f"Agent {agent_id} started with PID {process.pid}")
            return True

        except Exception as e:
            logger.error(f"Failed to start agent {agent_id}: {e}")
            return False

    async def stop_agent(self, agent_id: str, timeout: Optional[float] = None) -> bool:
        """
        Stop a supervised agent gracefully.

        Args:
            agent_id: Agent identifier
            timeout: Seconds to wait for graceful shutdown

        Returns:
            True if agent stopped successfully
        """
        if agent_id not in self._agents:
            logger.warning(f"Agent {agent_id} not found")
            return False

        agent = self._agents[agent_id]
        timeout = timeout or self.config.shutdown_timeout

        if agent.state == SupervisionState.STOPPED:
            return True

        agent.state = SupervisionState.STOPPING

        if agent.process and agent.process.poll() is None:
            try:
                agent.process.terminate()
                try:
                    await asyncio.wait_for(self._wait_for_process(agent.process), timeout=timeout)
                except asyncio.TimeoutError:
                    logger.warning(f"Agent {agent_id} did not stop gracefully, killing")
                    agent.process.kill()
                    await asyncio.wait_for(self._wait_for_process(agent.process), timeout=5.0)
            except Exception as e:
                logger.error(f"Error stopping agent {agent_id}: {e}")
                return False

        agent.state = SupervisionState.STOPPED
        agent.last_stop_at = datetime.now(timezone.utc)
        agent.pid = None
        logger.info(f"Agent {agent_id} stopped")
        return True

    async def restart_agent(self, agent_id: str) -> bool:
        """
        Restart a supervised agent.

        Args:
            agent_id: Agent identifier

        Returns:
            True if agent restarted successfully
        """
        if agent_id not in self._agents:
            logger.warning(f"Agent {agent_id} not found")
            return False

        agent = self._agents[agent_id]

        await self.stop_agent(agent_id)

        if agent.restart_count >= self.config.max_restarts:
            logger.error(f"Agent {agent_id} exceeded max restarts ({agent.restart_count})")
            agent.state = SupervisionState.FAILED
            return False

        agent.state = SupervisionState.RESTARTING
        agent.restart_count += 1

        await asyncio.sleep(self.config.restart_delay)

        success = await self.start_agent(
            agent_id,
            agent.command,
            agent.env,
            agent.faramesh_policy,
        )

        return success

    async def _wait_for_process(self, process: subprocess.Popen) -> None:
        while process.poll() is None:
            await asyncio.sleep(0.1)

    def _check_agent_health(self, agent: SupervisedAgent) -> bool:
        if not agent.process:
            return False

        if agent.process.poll() is not None:
            agent.last_exit_code = agent.process.returncode
            return False

        return True

    async def _health_check_loop(self) -> None:
        while self._running:
            await asyncio.sleep(self.config.health_check_interval)

            for agent_id, agent in list(self._agents.items()):
                if agent.state != SupervisionState.RUNNING:
                    continue

                is_healthy = self._check_agent_health(agent)

                if not is_healthy:
                    logger.warning(
                        f"Agent {agent_id} is unhealthy, exit code: {agent.last_exit_code}"
                    )

                    if self.config.auto_restart and agent.restart_count < self.config.max_restarts:
                        logger.info(f"Auto-restarting agent {agent_id}")
                        await self.restart_agent(agent_id)
                    else:
                        agent.state = SupervisionState.FAILED
                        if agent.restart_count >= self.config.max_restarts:
                            logger.error(f"Agent {agent_id} exceeded max restarts")

    def get_agent_status(self, agent_id: str) -> Optional[dict]:
        """Get status of a supervised agent."""
        if agent_id not in self._agents:
            return None

        agent = self._agents[agent_id]
        return {
            "agent_id": agent.agent_id,
            "state": agent.state.value,
            "pid": agent.pid,
            "restart_count": agent.restart_count,
            "last_exit_code": agent.last_exit_code,
            "started_at": agent.started_at.isoformat() if agent.started_at else None,
            "last_start_at": agent.last_start_at.isoformat() if agent.last_start_at else None,
            "last_stop_at": agent.last_stop_at.isoformat() if agent.last_stop_at else None,
            "faramesh_policy": agent.faramesh_policy,
            "command": agent.command,
        }

    def list_agents(self) -> list[dict]:
        """List all supervised agents."""
        return [self.get_agent_status(agent_id) for agent_id in self._agents]

    async def start_supervision(self) -> None:
        """Start the supervision health check loop."""
        if self._running:
            return

        self._running = True
        self._health_check_task = asyncio.create_task(self._health_check_loop())
        logger.info("Faramesh supervisor started")

    async def stop_supervision(self) -> None:
        """Stop the supervision and all agents."""
        if not self._running:
            return

        self._running = False

        for agent_id in list(self._agents.keys()):
            await self.stop_agent(agent_id)

        if self._health_check_task:
            self._health_check_task.cancel()
            try:
                await self._health_check_task
            except asyncio.CancelledError:
                pass

        logger.info("Faramesh supervisor stopped")


_supervisor: Optional[FarameshSupervisor] = None


def get_faramesh_supervisor() -> FarameshSupervisor:
    global _supervisor
    if _supervisor is None:
        _supervisor = FarameshSupervisor()
    return _supervisor
