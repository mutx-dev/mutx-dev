import warnings

import httpx

from mutx.agent_runtime import (
    AgentInfo,
    AgentMetrics,
    Command,
    MutxAgentClient,
    MutxAgentSyncClient,
    create_agent_client,
)
from mutx.agents import Agents
from mutx.api_keys import APIKeys
from mutx.clawhub import ClawHub
from mutx.deployments import Deployments
from mutx.webhooks import Webhooks


class MutxClient:
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.mutx.dev/v1",
        timeout: float = 30.0,
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

        self._client = httpx.Client(
            base_url=self.base_url,
            timeout=self.timeout,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        )

        self.agents = Agents(self._client)
        self.api_keys = APIKeys(self._client)
        self.clawhub = ClawHub(self._client)
        self.deployments = Deployments(self._client)
        self.webhooks = Webhooks(self._client)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def close(self):
        self._client.close()

    @property
    def agents(self) -> Agents:
        return self._agents

    @agents.setter
    def agents(self, value: Agents):
        self._agents = value

    @property
    def api_keys(self) -> APIKeys:
        return self._api_keys

    @api_keys.setter
    def api_keys(self, value: APIKeys):
        self._api_keys = value

    @property
    def clawhub(self) -> ClawHub:
        return self._clawhub

    @clawhub.setter
    def clawhub(self, value: ClawHub):
        self._clawhub = value

    @property
    def deployments(self) -> Deployments:
        return self._deployments

    @deployments.setter
    def deployments(self, value: Deployments):
        self._deployments = value

    @property
    def webhooks(self) -> Webhooks:
        return self._webhooks

    @webhooks.setter
    def webhooks(self, value: Webhooks):
        self._webhooks = value


class MutxAsyncClient:
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.mutx.dev/v1",
        timeout: float = 30.0,
    ):
        warnings.warn(
            "MutxAsyncClient is deprecated for sync-style direct usage; use async-prefixed"
            " resource methods like acreate, alist, aget, etc. when using async transports.",
            DeprecationWarning,
            stacklevel=2,
        )
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        )

        self.agents = Agents(self._client)
        self.api_keys = APIKeys(self._client)
        self.clawhub = ClawHub(self._client)
        self.deployments = Deployments(self._client)
        self.webhooks = Webhooks(self._client)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.aclose()

    async def aclose(self):
        await self._client.aclose()

    @property
    def agents(self) -> Agents:
        return self._agents

    @agents.setter
    def agents(self, value: Agents):
        self._agents = value

    @property
    def api_keys(self) -> APIKeys:
        return self._api_keys

    @api_keys.setter
    def api_keys(self, value: APIKeys):
        self._api_keys = value

    @property
    def clawhub(self) -> ClawHub:
        return self._clawhub

    @clawhub.setter
    def clawhub(self, value: ClawHub):
        self._clawhub = value

    @property
    def deployments(self) -> Deployments:
        return self._deployments

    @deployments.setter
    def deployments(self, value: Deployments):
        self._deployments = value

    @property
    def webhooks(self) -> Webhooks:
        return self._webhooks

    @webhooks.setter
    def webhooks(self, value: Webhooks):
        self._webhooks = value


__all__ = [
    "MutxClient",
    "MutxAsyncClient",
    "MutxAgentClient",
    "MutxAgentSyncClient",
    "AgentInfo",
    "Command",
    "AgentMetrics",
    "APIKeys",
    "ClawHub",
    "Deployments",
    "Webhooks",
    "create_agent_client",
]
