"""
SPIFFE/SPIRE identity integration for MUTX governance.

SPIFFE (Secure Production Identity Framework for Everyone) provides
workload identity for agents in production environments.

This integration allows MUTX to:
- Authenticate agents using SPIFFE SVIDs (SPIFFE Verifiable Identity Documents)
- Establish mTLS connections between agents and governance services
- Integrate with existing SPIRE deployments
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


class IdentitySource(str, Enum):
    SPIRE = "spire"
    KUBERNETES = "kubernetes"
    ENVIRONMENT = "environment"
    STATIC = "static"


@dataclass
class AgentIdentity:
    spiffe_id: str
    trust_domain: str
    agent_id: str
    certificate: str
    private_key: str
    expires_at: Optional[datetime] = None
    source: IdentitySource = IdentitySource.SPIRE


@dataclass
class SPIREConfig:
    server_address: str = "localhost:8081"
    socket_path: str = "/tmp/spire-agent/public/api.sock"
    trust_bundle_path: Optional[str] = None
    agent_config_path: Optional[str] = None
    workload_api_path: str = "/tmp/spire-agent/public/api.sock"
    spire_bin: Optional[str] = None


class SPIFFEIdentityProvider:
    """
    Provides SPIFFE identity for agents using SPIRE.

    Supports multiple identity sources:
    - SPIRE agent (production)
    - Kubernetes service account (when running in K8s)
    - Environment variables (development)
    - Static configuration (testing)
    """

    def __init__(self, config: Optional[SPIREConfig] = None):
        self.config = config or SPIREConfig()
        self._identity_cache: dict[str, AgentIdentity] = {}

    def _find_spire_bin(self) -> Optional[str]:
        if self.config.spire_bin:
            return self.config.spire_bin

        for path in [
            Path.home() / ".local" / "bin" / "spire-agent",
            Path.home() / ".local" / "bin" / "spire",
            "/usr/local/bin/spire-agent",
            "/usr/bin/spire-agent",
        ]:
            if path.exists():
                return str(path)

        import shutil

        return shutil.which("spire-agent")

    async def fetch_svid(
        self,
        agent_id: str,
        spiffe_id: Optional[str] = None,
        renew: bool = False,
    ) -> Optional[AgentIdentity]:
        """
        Fetch an SVID from SPIRE for an agent.

        Args:
            agent_id: Unique agent identifier
            spiffe_id: SPIFFE ID to request (defaults to spiffe://trust_domain/agent/{agent_id})
            renew: Force renewal of existing SVID

        Returns:
            AgentIdentity with certificate and private key
        """
        if not renew and agent_id in self._identity_cache:
            cached = self._identity_cache[agent_id]
            if cached.expires_at and cached.expires_at > datetime.now(timezone.utc):
                return cached

        spire_bin = self._find_spire_bin()
        if not spire_bin:
            logger.warning("SPIRE agent not found, using environment identity")
            return await self._fetch_environment_identity(agent_id, spiffe_id)

        trust_domain = os.environ.get("SPIRE_TRUST_DOMAIN", "example.org")
        requested_spiffe_id = spiffe_id or f"spiffe://{trust_domain}/agent/{agent_id}"

        try:
            result = await asyncio.create_subprocess_exec(
                spire_bin,
                "agent",
                "fetch-svid",
                "-spiffeID",
                requested_spiffe_id,
                "-output",
                "json",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await result.communicate()

            if result.returncode != 0:
                logger.error(f"SPIRE fetch-svid failed: {stderr.decode()}")
                return await self._fetch_environment_identity(agent_id, spiffe_id)

            import json

            svid_data = json.loads(stdout.decode())

            identity = AgentIdentity(
                spiffe_id=requested_spiffe_id,
                trust_domain=trust_domain,
                agent_id=agent_id,
                certificate=svid_data.get("svid", {}).get("cert", ""),
                private_key=svid_data.get("svid", {}).get("key", ""),
                expires_at=datetime.fromisoformat(
                    svid_data.get("svid", {}).get("expiry", "2099-01-01")
                ),
                source=IdentitySource.SPIRE,
            )

            self._identity_cache[agent_id] = identity
            return identity

        except Exception as e:
            logger.error(f"Error fetching SVID from SPIRE: {e}")
            return await self._fetch_environment_identity(agent_id, spiffe_id)

    async def _fetch_environment_identity(
        self,
        agent_id: str,
        spiffe_id: Optional[str] = None,
    ) -> Optional[AgentIdentity]:
        """Fetch identity from environment variables (development/testing)."""
        trust_domain = os.environ.get("SPIRE_TRUST_DOMAIN", "example.org")
        requested_spiffe_id = spiffe_id or f"spiffe://{trust_domain}/agent/{agent_id}"

        cert = os.environ.get("MUTX_AGENT_CERT")
        key = os.environ.get("MUTX_AGENT_KEY")

        if cert and key:
            return AgentIdentity(
                spiffe_id=requested_spiffe_id,
                trust_domain=trust_domain,
                agent_id=agent_id,
                certificate=cert,
                private_key=key,
                source=IdentitySource.ENVIRONMENT,
            )

        return None

    async def validate_svid(self, certificate: str) -> bool:
        """
        Validate an SVID certificate against the SPIRE trust bundle.

        Args:
            certificate: PEM-encoded certificate

        Returns:
            True if certificate is valid
        """
        spire_bin = self._find_spire_bin()
        if not spire_bin:
            return True

        try:
            result = await asyncio.create_subprocess_exec(
                spire_bin,
                "agent",
                "validate",
                "-certs",
                certificate,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await result.communicate()
            return result.returncode == 0

        except Exception as e:
            logger.error(f"Error validating SVID: {e}")
            return False

    def get_trust_bundle(self) -> Optional[str]:
        """Get the SPIRE trust bundle for validating other agents' SVIDs."""
        spire_bin = self._find_spire_bin()
        if not spire_bin:
            return os.environ.get("SPIRE_TRUST_BUNDLE")

        try:
            result = subprocess.run(
                [spire_bin, "agent", "fetchTrustBundle"],
                capture_output=True,
                text=True,
                timeout=10,
            )

            if result.returncode == 0:
                return result.stdout

            return None

        except Exception as e:
            logger.error(f"Error fetching trust bundle: {e}")
            return None

    def get_agent_identity(self, agent_id: str) -> Optional[AgentIdentity]:
        """Get cached identity for an agent."""
        return self._identity_cache.get(agent_id)

    def clear_cache(self, agent_id: Optional[str] = None) -> None:
        """Clear identity cache."""
        if agent_id:
            self._identity_cache.pop(agent_id, None)
        else:
            self._identity_cache.clear()


_identity_provider: Optional[SPIFFEIdentityProvider] = None


def get_identity_provider() -> SPIFFEIdentityProvider:
    global _identity_provider
    if _identity_provider is None:
        _identity_provider = SPIFFEIdentityProvider()
    return _identity_provider
