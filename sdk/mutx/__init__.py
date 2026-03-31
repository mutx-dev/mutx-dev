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
from mutx.analytics import Analytics
from mutx.api_keys import APIKeys
from mutx.assistant import Assistant
from mutx.budgets import Budgets
from mutx.clawhub import ClawHub
from mutx.deployments import Deployments
from mutx.governance_credentials import GovernanceCredentials
from mutx.governance_supervision import GovernanceSupervision
from mutx.ingest import Ingest
from mutx.newsletter import Newsletter
from mutx.onboarding import Onboarding
from mutx.runtime import Runtime
from mutx.scheduler import Scheduler
from mutx.security import Security
from mutx.sessions import Sessions
from mutx.swarms import Swarms
from mutx.templates import Templates
from mutx.usage import UsageEvents
from mutx.webhooks import Webhooks


class MutxClient:
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.mutx.dev",
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
        self.analytics = Analytics(self._client)
        self.api_keys = APIKeys(self._client)
        self.assistant = Assistant(self._client)
        self.budgets = Budgets(self._client)
        self.clawhub = ClawHub(self._client)
        self.deployments = Deployments(self._client)
        self.governance_credentials = GovernanceCredentials(self._client)
        self.governance_supervision = GovernanceSupervision(self._client)
        self.ingest = Ingest(self._client)
        self.newsletter = Newsletter(self._client)
        self.onboarding = Onboarding(self._client)
        self.runtime = Runtime(self._client)
        self.scheduler = Scheduler(self._client)
        self.security = Security(self._client)
        self.sessions = Sessions(self._client)
        self.swarms = Swarms(self._client)
        self.templates = Templates(self._client)
        self.usage = UsageEvents(self._client)
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
    def analytics(self) -> Analytics:
        return self._analytics

    @analytics.setter
    def analytics(self, value: Analytics):
        self._analytics = value

    @property
    def api_keys(self) -> APIKeys:
        return self._api_keys

    @api_keys.setter
    def api_keys(self, value: APIKeys):
        self._api_keys = value

    @property
    def assistant(self) -> Assistant:
        return self._assistant

    @assistant.setter
    def assistant(self, value: Assistant):
        self._assistant = value

    @property
    def budgets(self) -> Budgets:
        return self._budgets

    @budgets.setter
    def budgets(self, value: Budgets):
        self._budgets = value

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
    def governance_credentials(self) -> GovernanceCredentials:
        return self._governance_credentials

    @governance_credentials.setter
    def governance_credentials(self, value: GovernanceCredentials):
        self._governance_credentials = value

    @property
    def governance_supervision(self) -> GovernanceSupervision:
        return self._governance_supervision

    @governance_supervision.setter
    def governance_supervision(self, value: GovernanceSupervision):
        self._governance_supervision = value

    @property
    def ingest(self) -> Ingest:
        return self._ingest

    @ingest.setter
    def ingest(self, value: Ingest):
        self._ingest = value

    @property
    def newsletter(self) -> Newsletter:
        return self._newsletter

    @newsletter.setter
    def newsletter(self, value: Newsletter):
        self._newsletter = value

    @property
    def onboarding(self) -> Onboarding:
        return self._onboarding

    @onboarding.setter
    def onboarding(self, value: Onboarding):
        self._onboarding = value

    @property
    def runtime(self) -> Runtime:
        return self._runtime

    @runtime.setter
    def runtime(self, value: Runtime):
        self._runtime = value

    @property
    def scheduler(self) -> Scheduler:
        return self._scheduler

    @scheduler.setter
    def scheduler(self, value: Scheduler):
        self._scheduler = value

    @property
    def security(self) -> Security:
        return self._security

    @security.setter
    def security(self, value: Security):
        self._security = value

    @property
    def sessions(self) -> Sessions:
        return self._sessions

    @sessions.setter
    def sessions(self, value: Sessions):
        self._sessions = value

    @property
    def swarms(self) -> Swarms:
        return self._swarms

    @swarms.setter
    def swarms(self, value: Swarms):
        self._swarms = value

    @property
    def templates(self) -> Templates:
        return self._templates

    @templates.setter
    def templates(self, value: Templates):
        self._templates = value

    @property
    def usage(self) -> UsageEvents:
        return self._usage

    @usage.setter
    def usage(self, value: UsageEvents):
        self._usage = value

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
        base_url: str = "https://api.mutx.dev",
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
        self.analytics = Analytics(self._client)
        self.api_keys = APIKeys(self._client)
        self.assistant = Assistant(self._client)
        self.budgets = Budgets(self._client)
        self.clawhub = ClawHub(self._client)
        self.deployments = Deployments(self._client)
        self.governance_credentials = GovernanceCredentials(self._client)
        self.governance_supervision = GovernanceSupervision(self._client)
        self.ingest = Ingest(self._client)
        self.newsletter = Newsletter(self._client)
        self.onboarding = Onboarding(self._client)
        self.runtime = Runtime(self._client)
        self.scheduler = Scheduler(self._client)
        self.security = Security(self._client)
        self.sessions = Sessions(self._client)
        self.swarms = Swarms(self._client)
        self.templates = Templates(self._client)
        self.usage = UsageEvents(self._client)
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
    def analytics(self) -> Analytics:
        return self._analytics

    @analytics.setter
    def analytics(self, value: Analytics):
        self._analytics = value

    @property
    def api_keys(self) -> APIKeys:
        return self._api_keys

    @api_keys.setter
    def api_keys(self, value: APIKeys):
        self._api_keys = value

    @property
    def assistant(self) -> Assistant:
        return self._assistant

    @assistant.setter
    def assistant(self, value: Assistant):
        self._assistant = value

    @property
    def budgets(self) -> Budgets:
        return self._budgets

    @budgets.setter
    def budgets(self, value: Budgets):
        self._budgets = value

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
    def governance_credentials(self) -> GovernanceCredentials:
        return self._governance_credentials

    @governance_credentials.setter
    def governance_credentials(self, value: GovernanceCredentials):
        self._governance_credentials = value

    @property
    def governance_supervision(self) -> GovernanceSupervision:
        return self._governance_supervision

    @governance_supervision.setter
    def governance_supervision(self, value: GovernanceSupervision):
        self._governance_supervision = value

    @property
    def ingest(self) -> Ingest:
        return self._ingest

    @ingest.setter
    def ingest(self, value: Ingest):
        self._ingest = value

    @property
    def newsletter(self) -> Newsletter:
        return self._newsletter

    @newsletter.setter
    def newsletter(self, value: Newsletter):
        self._newsletter = value

    @property
    def onboarding(self) -> Onboarding:
        return self._onboarding

    @onboarding.setter
    def onboarding(self, value: Onboarding):
        self._onboarding = value

    @property
    def runtime(self) -> Runtime:
        return self._runtime

    @runtime.setter
    def runtime(self, value: Runtime):
        self._runtime = value

    @property
    def scheduler(self) -> Scheduler:
        return self._scheduler

    @scheduler.setter
    def scheduler(self, value: Scheduler):
        self._scheduler = value

    @property
    def security(self) -> Security:
        return self._security

    @security.setter
    def security(self, value: Security):
        self._security = value

    @property
    def sessions(self) -> Sessions:
        return self._sessions

    @sessions.setter
    def sessions(self, value: Sessions):
        self._sessions = value

    @property
    def swarms(self) -> Swarms:
        return self._swarms

    @swarms.setter
    def swarms(self, value: Swarms):
        self._swarms = value

    @property
    def templates(self) -> Templates:
        return self._templates

    @templates.setter
    def templates(self, value: Templates):
        self._templates = value

    @property
    def usage(self) -> UsageEvents:
        return self._usage

    @usage.setter
    def usage(self, value: UsageEvents):
        self._usage = value

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
    "AgentMetrics",
    "Analytics",
    "APIKeys",
    "Assistant",
    "Budgets",
    "ClawHub",
    "Command",
    "create_agent_client",
    "Deployments",
    "GovernanceCredentials",
    "GovernanceSupervision",
    "Ingest",
    "Newsletter",
    "Onboarding",
    "Runtime",
    "Scheduler",
    "Security",
    "Sessions",
    "Swarms",
    "Templates",
    "UsageEvents",
    "Webhooks",
]
