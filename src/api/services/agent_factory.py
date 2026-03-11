from abc import ABC, abstractmethod
from typing import Optional, Any
import logging
from dataclasses import dataclass

from ..integrations.openclaw import OpenClawClient, OpenClawConfig, AgentConfig

logger = logging.getLogger(__name__)


@dataclass
class AgentMetadata:
    agent_id: str
    agent_type: str
    status: str
    config: dict[str, Any]


class AgentFactoryBase(ABC):
    @abstractmethod
    def create_agent(self, name: str, config: dict[str, Any]) -> AgentMetadata:
        pass

    @abstractmethod
    def get_agent(self, agent_id: str) -> Optional[AgentMetadata]:
        pass

    @abstractmethod
    def delete_agent(self, agent_id: str) -> bool:
        pass

    @abstractmethod
    def start_agent(self, agent_id: str) -> bool:
        pass

    @abstractmethod
    def stop_agent(self, agent_id: str) -> bool:
        pass


class OpenClawAgentFactory(AgentFactoryBase):
    def __init__(self, config: Optional[OpenClawConfig] = None):
        self.client = OpenClawClient(config)

    def create_agent(self, name: str, config: dict[str, Any]) -> AgentMetadata:
        agent_config = AgentConfig(
            name=name,
            description=config.get("description"),
            image=config.get("image"),
            environment=config.get("environment"),
            resources=config.get("resources"),
        )

        try:
            agent = self.client.create_agent(agent_config)
            return AgentMetadata(
                agent_id=agent.id,
                agent_type="openclaw",
                status=agent.status,
                config=config,
            )
        except Exception as e:
            logger.error(f"Failed to create OpenClaw agent: {str(e)}")
            raise

    def get_agent(self, agent_id: str) -> Optional[AgentMetadata]:
        try:
            agent = self.client.get_agent(agent_id)
            return AgentMetadata(
                agent_id=agent.id,
                agent_type="openclaw",
                status=agent.status,
                config={},
            )
        except Exception as e:
            logger.error(f"Failed to get OpenClaw agent {agent_id}: {str(e)}")
            return None

    def delete_agent(self, agent_id: str) -> bool:
        try:
            self.client.delete_agent(agent_id)
            return True
        except Exception as e:
            logger.error(f"Failed to delete OpenClaw agent {agent_id}: {str(e)}")
            return False

    def start_agent(self, agent_id: str) -> bool:
        try:
            self.client.start_agent(agent_id)
            return True
        except Exception as e:
            logger.error(f"Failed to start OpenClaw agent {agent_id}: {str(e)}")
            return False

    def stop_agent(self, agent_id: str) -> bool:
        try:
            self.client.stop_agent(agent_id)
            return True
        except Exception as e:
            logger.error(f"Failed to stop OpenClaw agent {agent_id}: {str(e)}")
            return False

    def restart_agent(self, agent_id: str) -> bool:
        try:
            self.client.restart_agent(agent_id)
            return True
        except Exception as e:
            logger.error(f"Failed to restart OpenClaw agent {agent_id}: {str(e)}")
            return False


class AgentType(str):
    OPENCLAW = "openclaw"
    DOCKER = "docker"
    KUBERNETES = "kubernetes"


class AgentFactory:
    _factories: dict[str, type[AgentFactoryBase]] = {
        AgentType.OPENCLAW: OpenClawAgentFactory,
    }

    @classmethod
    def register(cls, agent_type: str, factory_class: type[AgentFactoryBase]):
        cls._factories[agent_type] = factory_class

    @classmethod
    def create(cls, agent_type: str, config: Optional[dict[str, Any]] = None) -> AgentFactoryBase:
        if agent_type not in cls._factories:
            raise ValueError(f"Unknown agent type: {agent_type}")

        factory_class = cls._factories[agent_type]

        if agent_type == AgentType.OPENCLAW:
            openclaw_config = None
            if config:
                openclaw_config = OpenClawConfig(**config)
            return factory_class(openclaw_config)

        return factory_class()

    @classmethod
    def get_available_types(cls) -> list[str]:
        return list(cls._factories.keys())


def get_agent_factory(agent_type: str, config: Optional[dict[str, Any]] = None) -> AgentFactoryBase:
    return AgentFactory.create(agent_type, config)
