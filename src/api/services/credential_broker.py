"""
Credential broker service for MUTX governance.

Supports multiple secret backends:
- HashiCorp Vault
- AWS Secrets Manager
- GCP Secret Manager
- Azure Key Vault
- 1Password
- Infisical

This service allows agents to retrieve credentials on-demand
with automatic TTL management and refresh.
"""

import asyncio
import json
import logging
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from enum import Enum
from pathlib import Path
from typing import Optional

import aiohttp

from src.api.security import decrypt_secret_value, encrypt_secret_value

logger = logging.getLogger(__name__)


class CredentialBackend(str, Enum):
    VAULT = "vault"
    AWS_SECRETS = "awssecrets"
    GCP_SM = "gcpsm"
    AZURE_KV = "azurekv"
    ONEPASSWORD = "onepassword"
    INFISICAL = "infisical"


@dataclass
class Credential:
    name: str
    backend: str
    path: str
    value: str
    expires_at: Optional[datetime] = None
    metadata: dict = field(default_factory=dict)

    @property
    def is_expired(self) -> bool:
        if self.expires_at is None:
            return False
        return datetime.now(timezone.utc) >= self.expires_at


@dataclass
class BackendConfig:
    name: str
    backend: CredentialBackend
    path: str
    ttl: timedelta = field(default_factory=lambda: timedelta(minutes=15))
    config: dict = field(default_factory=dict)
    is_active: bool = True
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class CredentialProvider(ABC):
    """Base class for credential backend providers."""

    def __init__(self, config: BackendConfig):
        self.config = config
        self._cache: dict[str, tuple[Credential, datetime]] = {}

    @abstractmethod
    async def get_secret(self, path: str) -> Optional[Credential]:
        """Retrieve a secret from the backend."""
        pass

    @abstractmethod
    async def list_secrets(self) -> list[str]:
        """List available secret paths."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the backend is reachable and healthy."""
        pass

    def _is_cache_valid(self, path: str) -> bool:
        if path not in self._cache:
            return False
        _, cached_at = self._cache[path]
        return datetime.now(timezone.utc) - cached_at < self.config.ttl

    def _get_cached(self, path: str) -> Optional[Credential]:
        if self._is_cache_valid(path):
            cred, _ = self._cache[path]
            if not cred.is_expired:
                return cred
        return None

    def _set_cache(self, path: str, credential: Credential) -> None:
        self._cache[path] = (credential, datetime.now(timezone.utc))


class VaultProvider(CredentialProvider):
    """HashiCorp Vault credential provider."""

    def __init__(self, config: BackendConfig):
        super().__init__(config)
        self.url = config.config.get("url", "http://localhost:8200")
        self.token = config.config.get("token", os.environ.get("VAULT_TOKEN", ""))
        self.mount_point = config.config.get("mount_point", "secret")

    async def get_secret(self, path: str) -> Optional[Credential]:
        cached = self._get_cached(path)
        if cached:
            return cached

        url = f"{self.url}/v1/{self.mount_point}/{path}"
        headers = {"X-Vault-Token": self.token}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)
                ) as resp:
                    if resp.status != 200:
                        logger.warning(f"Vault returned {resp.status} for {path}")
                        return None

                    data = await resp.json()
                    if "data" in data and "data" in data["data"]:
                        secret_data = data["data"]["data"]
                        lease_duration = data.get("lease_duration", 3600)
                        expires_at = datetime.now(timezone.utc) + timedelta(seconds=lease_duration)

                        credential = Credential(
                            name=path,
                            backend="vault",
                            path=path,
                            value=json.dumps(secret_data),
                            expires_at=expires_at,
                            metadata={"lease_id": data.get("lease_id")},
                        )
                        self._set_cache(path, credential)
                        return credential
        except Exception as e:
            logger.error(f"Error fetching Vault secret {path}: {e}")

        return None

    async def list_secrets(self) -> list[str]:
        url = f"{self.url}/v1/{self.mount_point}/metadata?list=true"
        headers = {"X-Vault-Token": self.token}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.list(
                    url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)
                ) as resp:
                    if resp.status != 200:
                        return []
                    data = await resp.json()
                    return data.get("data", {}).get("keys", [])
        except Exception as e:
            logger.error(f"Error listing Vault secrets: {e}")
            return []

    async def health_check(self) -> bool:
        url = f"{self.url}/v1/sys/health"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    return resp.status in (200, 429)
        except Exception:
            return False


class AWSSecretsProvider(CredentialProvider):
    """AWS Secrets Manager credential provider."""

    def __init__(self, config: BackendConfig):
        super().__init__(config)
        self.region = config.config.get("region", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
        self.profile = config.config.get("profile", os.environ.get("AWS_PROFILE"))

    async def get_secret(self, path: str) -> Optional[Credential]:
        cached = self._get_cached(path)
        if cached:
            return cached

        try:
            import boto3
            from botocore.config import Config

            boto_config = Config(region_name=self.region)
            if self.profile:
                session = boto3.Session(profile_name=self.profile)
                client = session.client("secretsmanager", config=boto_config)
            else:
                client = boto3.client("secretsmanager", region_name=self.region, config=boto_config)

            response = client.get_secret_value(SecretId=path)
            secret_value = response.get("SecretString", "")

            expires_at = None
            if "CreatedDate" in response:
                expires_at = datetime.fromtimestamp(response["CreatedDate"], tz=timezone.utc)
                expires_at += timedelta(days=1)

            credential = Credential(
                name=path,
                backend="awssecrets",
                path=path,
                value=secret_value,
                expires_at=expires_at,
                metadata={"ARN": response.get("ARN")},
            )
            self._set_cache(path, credential)
            return credential
        except Exception as e:
            logger.error(f"Error fetching AWS secret {path}: {e}")

        return None

    async def list_secrets(self) -> list[str]:
        try:
            import boto3

            if self.profile:
                session = boto3.Session(profile_name=self.profile)
                client = session.client("secretsmanager", region_name=self.region)
            else:
                client = boto3.client("secretsmanager", region_name=self.region)

            response = client.list_secrets()
            return [s["Name"] for s in response.get("SecretList", [])]
        except Exception as e:
            logger.error(f"Error listing AWS secrets: {e}")
            return []

    async def health_check(self) -> bool:
        try:
            import boto3

            if self.profile:
                session = boto3.Session(profile_name=self.profile)
                client = session.client("secretsmanager", region_name=self.region)
            else:
                client = boto3.client("secretsmanager", region_name=self.region)
            client.list_secrets(MaxResults=1)
            return True
        except Exception:
            return False


class GCPSecretManagerProvider(CredentialProvider):
    """GCP Secret Manager credential provider."""

    def __init__(self, config: BackendConfig):
        super().__init__(config)
        self.project = config.config.get("project", os.environ.get("GCP_PROJECT"))
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                from google.cloud import secretmanager

                self._client = secretmanager.SecretManagerServiceClient()
            except ImportError:
                logger.warning("google-cloud-secretmanager not installed")
                return None
        return self._client

    async def get_secret(self, path: str) -> Optional[Credential]:
        cached = self._get_cached(path)
        if cached:
            return cached

        client = self._get_client()
        if not client:
            return None

        try:
            secret_path = f"projects/{self.project}/secrets/{path}/versions/latest"
            response = client.access_secret_version(name=secret_path)
            secret_value = response.payload.data.decode("UTF-8")

            credential = Credential(
                name=path,
                backend="gcpsm",
                path=path,
                value=secret_value,
                expires_at=None,
                metadata={"name": secret_path},
            )
            self._set_cache(path, credential)
            return credential
        except Exception as e:
            logger.error(f"Error fetching GCP secret {path}: {e}")

        return None

    async def list_secrets(self) -> list[str]:
        client = self._get_client()
        if not client:
            return []

        try:
            parent = f"projects/{self.project}"
            response = client.list_secrets(request={"parent": parent})
            return [s.name.split("/")[-1] for s in response.secrets]
        except Exception as e:
            logger.error(f"Error listing GCP secrets: {e}")
            return []

    async def health_check(self) -> bool:
        client = self._get_client()
        if not client:
            return False

        try:
            parent = f"projects/{self.project}"
            client.list_secrets(request={"parent": parent, "page_size": 1})
            return True
        except Exception:
            return False


class AzureKeyVaultProvider(CredentialProvider):
    """Azure Key Vault credential provider."""

    def __init__(self, config: BackendConfig):
        super().__init__(config)
        self.vault_url = config.config.get("vault_url", os.environ.get("AZURE_KEY_VAULT_URL"))
        self.tenant_id = config.config.get("tenant_id", os.environ.get("AZURE_TENANT_ID"))
        self.client_id = config.config.get("client_id", os.environ.get("AZURE_CLIENT_ID"))
        self.client_secret = config.config.get(
            "client_secret", os.environ.get("AZURE_CLIENT_SECRET")
        )
        self._access_token = None

    async def _get_access_token(self) -> Optional[str]:
        if self._access_token:
            return self._access_token

        try:
            url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
            data = {
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scope": "https://vault.azure.net/.default",
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url, data=data, timeout=aiohttp.ClientTimeout(total=10)
                ) as resp:
                    if resp.status == 200:
                        token_data = await resp.json()
                        self._access_token = token_data.get("access_token")
                        return self._access_token
        except Exception as e:
            logger.error(f"Error getting Azure access token: {e}")

        return None

    async def get_secret(self, path: str) -> Optional[Credential]:
        cached = self._get_cached(path)
        if cached:
            return cached

        token = await self._get_access_token()
        if not token:
            return None

        url = f"{self.vault_url}/secrets/{path}/?api-version=7.0"
        headers = {"Authorization": f"Bearer {token}"}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        credential = Credential(
                            name=path,
                            backend="azurekv",
                            path=path,
                            value=data.get("value", ""),
                            expires_at=None,
                            metadata={"id": data.get("id")},
                        )
                        self._set_cache(path, credential)
                        return credential
        except Exception as e:
            logger.error(f"Error fetching Azure secret {path}: {e}")

        return None

    async def list_secrets(self) -> list[str]:
        token = await self._get_access_token()
        if not token:
            return []

        url = f"{self.vault_url}/secrets?api-version=7.0"
        headers = {"Authorization": f"Bearer {token}"}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return [s["name"] for s in data.get("value", [])]
        except Exception as e:
            logger.error(f"Error listing Azure secrets: {e}")

        return []

    async def health_check(self) -> bool:
        token = await self._get_access_token()
        if not token:
            return False

        url = f"{self.vault_url}/secrets?api-version=7.0&$top=1"
        headers = {"Authorization": f"Bearer {token}"}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url, headers=headers, timeout=aiohttp.ClientTimeout(total=5)
                ) as resp:
                    return resp.status == 200
        except Exception:
            return False


class OnePasswordProvider(CredentialProvider):
    """1Password credential provider."""

    def __init__(self, config: BackendConfig):
        super().__init__(config)
        self.token = config.config.get("token", os.environ.get("OP_TOKEN"))
        self.account = config.config.get("account", os.environ.get("OP_ACCOUNT"))

    async def get_secret(self, path: str) -> Optional[Credential]:
        cached = self._get_cached(path)
        if cached:
            return cached

        try:
            import subprocess

            cmd = ["op", "read", f"op://{self.account}/{path}"]
            env = os.environ.copy()
            env["OP_TOKEN"] = self.token

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=10,
                env=env,
            )

            if result.returncode == 0:
                credential = Credential(
                    name=path,
                    backend="onepassword",
                    path=path,
                    value=result.stdout.strip(),
                    expires_at=None,
                    metadata={},
                )
                self._set_cache(path, credential)
                return credential
        except Exception as e:
            logger.error(f"Error fetching 1Password secret {path}: {e}")

        return None

    async def list_secrets(self) -> list[str]:
        return []

    async def health_check(self) -> bool:
        try:
            import subprocess

            env = os.environ.copy()
            env["OP_TOKEN"] = self.token
            result = subprocess.run(
                ["op", "vault", "list"],
                capture_output=True,
                timeout=10,
                env=env,
            )
            return result.returncode == 0
        except Exception:
            return False


class InfisicalProvider(CredentialProvider):
    """Infisical credential provider."""

    def __init__(self, config: BackendConfig):
        super().__init__(config)
        self.url = config.config.get(
            "url", os.environ.get("INFISICAL_URL", "https://app.infisical.com")
        )
        self.token = config.config.get("token", os.environ.get("INFISICAL_TOKEN"))
        self.project_id = config.config.get("project_id", os.environ.get("INFISICAL_PROJECT_ID"))

    async def get_secret(self, path: str) -> Optional[Credential]:
        cached = self._get_cached(path)
        if cached:
            return cached

        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
            }
            params = {
                "projectId": self.project_id,
                "environment": "prod",
                "secretPath": "/" + path.rsplit("/", 1)[0] if "/" in path else "/",
            }

            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.url}/api/v3/secrets/{path.split('/')[-1]}",
                    headers=headers,
                    params=params,
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        secret_data = data.get("secret", {})
                        credential = Credential(
                            name=path,
                            backend="infisical",
                            path=path,
                            value=secret_data.get("secretValue", ""),
                            expires_at=None,
                            metadata={"id": secret_data.get("id")},
                        )
                        self._set_cache(path, credential)
                        return credential
        except Exception as e:
            logger.error(f"Error fetching Infisical secret {path}: {e}")

        return None

    async def list_secrets(self) -> list[str]:
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
            }
            params = {
                "projectId": self.project_id,
                "environment": "prod",
            }

            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.url}/api/v3/secrets",
                    headers=headers,
                    params=params,
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return [s["secretPath"] for s in data.get("secrets", [])]
        except Exception as e:
            logger.error(f"Error listing Infisical secrets: {e}")

        return []

    async def health_check(self) -> bool:
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.url}/api/v3/health",
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=5),
                ) as resp:
                    return resp.status == 200
        except Exception:
            return False


PROVIDER_CLASSES = {
    CredentialBackend.VAULT: VaultProvider,
    CredentialBackend.AWS_SECRETS: AWSSecretsProvider,
    CredentialBackend.GCP_SM: GCPSecretManagerProvider,
    CredentialBackend.AZURE_KV: AzureKeyVaultProvider,
    CredentialBackend.ONEPASSWORD: OnePasswordProvider,
    CredentialBackend.INFISICAL: InfisicalProvider,
}


class CredentialBroker:
    """
    Central credential broker for MUTX governance.

    Manages multiple credential backends and provides
    a unified interface for agents to retrieve credentials.
    """

    def __init__(self, namespace: str = "default"):
        self.namespace = self._normalize_namespace(namespace)
        self._backends: dict[str, BackendConfig] = {}
        self._providers: dict[str, CredentialProvider] = {}
        self._lock = asyncio.Lock()
        mutx_home = Path(
            os.environ.get("MUTX_HOME")
            or os.environ.get("MUTX_HOME_DIR")
            or (Path.home() / ".mutx")
        ).expanduser()
        self._config_dir = mutx_home / "credential_broker"
        self._config_file = self._config_dir / "backends.json"
        self._load_config()

    @staticmethod
    def _normalize_namespace(namespace: str) -> str:
        normalized = (namespace or "default").strip()
        if not normalized:
            return "default"
        return normalized

    def _is_namespaced_payload(self, data: object) -> bool:
        return isinstance(data, dict) and isinstance(data.get("namespaces"), dict)

    def _serialize_backends(self, backends: dict[str, BackendConfig]) -> dict[str, dict]:
        data = {}
        for name, config in backends.items():
            data[name] = {
                "backend": config.backend.value,
                "path": config.path,
                "ttl": int(config.ttl.total_seconds()),
                "config_encrypted": (
                    encrypt_secret_value(json.dumps(config.config, sort_keys=True))
                    if config.config
                    else None
                ),
                "is_active": config.is_active,
            }
        return data

    def _read_config_payload(self) -> object:
        if not self._config_file.exists():
            return {}
        return json.loads(self._config_file.read_text())

    def _write_namespaced_payload(self, namespaces: dict[str, dict[str, dict]]) -> None:
        self._config_dir.mkdir(parents=True, exist_ok=True)
        os.chmod(self._config_dir, 0o700)
        payload = {
            "schema_version": 2,
            "namespaces": namespaces,
        }
        self._config_file.write_text(json.dumps(payload, indent=2))
        os.chmod(self._config_file, 0o600)

    def _parse_backend_entries(self, data: dict[str, dict]) -> bool:
        needs_rewrite = False
        for name, config_data in data.items():
            encrypted_config = config_data.get("config_encrypted")
            if encrypted_config:
                decrypted_config = decrypt_secret_value(encrypted_config)
                if decrypted_config is None:
                    logger.error(f"Failed to decrypt credential broker config for {name}")
                    continue
                try:
                    backend_config = json.loads(decrypted_config)
                except json.JSONDecodeError:
                    logger.error(f"Failed to decode credential broker config for {name}")
                    continue
            else:
                backend_config = config_data.get("config", {})
                if backend_config:
                    needs_rewrite = True

            config = BackendConfig(
                name=name,
                backend=CredentialBackend(config_data["backend"]),
                path=config_data["path"],
                ttl=timedelta(seconds=config_data.get("ttl", 900)),
                config=backend_config if isinstance(backend_config, dict) else {},
                is_active=config_data.get("is_active", True),
            )
            self._backends[name] = config
            self._providers[name] = PROVIDER_CLASSES[config.backend](config)
        return needs_rewrite

    def _load_config(self) -> None:
        if not self._config_file.exists():
            return

        try:
            payload = self._read_config_payload()
            if self._is_namespaced_payload(payload):
                namespaces = payload.get("namespaces", {})
                namespace_data = namespaces.get(self.namespace, {})
                needs_rewrite = self._parse_backend_entries(namespace_data)
                if needs_rewrite:
                    self._save_config()
                return

            if not isinstance(payload, dict):
                raise ValueError("Credential broker config payload must be a JSON object")

            logger.warning(
                "Migrating legacy global credential broker config into namespace '%s'",
                self.namespace,
            )
            needs_rewrite = self._parse_backend_entries(payload)
            namespaces = {self.namespace: self._serialize_backends(self._backends)}
            self._write_namespaced_payload(namespaces)
            if needs_rewrite:
                self._save_config()
        except Exception as e:
            logger.error(f"Error loading credential broker config: {e}")

    def _save_config(self) -> None:
        namespaces: dict[str, dict[str, dict]] = {}
        try:
            payload = self._read_config_payload()
            if self._is_namespaced_payload(payload):
                raw_namespaces = payload.get("namespaces", {})
                if isinstance(raw_namespaces, dict):
                    namespaces = {
                        str(namespace): data
                        for namespace, data in raw_namespaces.items()
                        if isinstance(data, dict)
                    }
        except Exception as exc:
            logger.error(f"Error reading credential broker config for save: {exc}")

        if self._backends:
            namespaces[self.namespace] = self._serialize_backends(self._backends)
        else:
            namespaces.pop(self.namespace, None)

        self._write_namespaced_payload(namespaces)

    async def register_backend(
        self,
        name: str,
        backend: CredentialBackend,
        path: str,
        ttl: timedelta = timedelta(minutes=15),
        config: Optional[dict] = None,
    ) -> bool:
        """Register a new credential backend."""
        async with self._lock:
            backend_config = BackendConfig(
                name=name,
                backend=backend,
                path=path,
                ttl=ttl,
                config=config or {},
            )
            self._backends[name] = backend_config
            self._providers[name] = PROVIDER_CLASSES[backend](backend_config)
            self._save_config()
            logger.info(f"Registered credential backend: {name} ({backend.value})")
            return True

    async def unregister_backend(self, name: str) -> bool:
        """Unregister a credential backend."""
        async with self._lock:
            if name in self._backends:
                del self._backends[name]
                if name in self._providers:
                    del self._providers[name]
                self._save_config()
                logger.info(f"Unregistered credential backend: {name}")
                return True
            return False

    async def get_credential(self, backend_name: str, secret_path: str, requester_id: str | None = None) -> Optional[Credential]:
        """Retrieve a credential from a specific backend."""
        if backend_name not in self._providers:
            logger.warning(f"Unknown credential backend: {backend_name}")
            return None

        # Validate path to prevent traversal attacks
        if ".." in secret_path or secret_path.startswith("/"):
            logger.warning(
                f"Suspicious credential path rejected: backend={backend_name} path={secret_path} "
                f"requester={requester_id or 'unknown'}"
            )
            return None

        provider = self._providers[backend_name]
        logger.info(
            f"Credential access: backend={backend_name} path={secret_path} "
            f"requester={requester_id or 'unknown'} namespace={self.namespace}"
        )
        return await provider.get_secret(secret_path)

    async def get_credential_by_path(self, full_path: str, requester_id: str | None = None) -> Optional[Credential]:
        """
        Retrieve a credential using a path format: backend:/path/to/secret

        Examples:
            vault:/secret/myapp/api-key
            awssecrets:/prod/myapp/api-key
            gcpsm:/my-project/my-secret
        """
        if ":" not in full_path:
            return None

        backend_name, path = full_path.split(":", 1)
        return await self.get_credential(backend_name, path.lstrip("/"), requester_id=requester_id)

    async def list_backends(self) -> list[dict]:
        """List all registered credential backends."""
        result = []
        for name, config in self._backends.items():
            provider = self._providers.get(name)
            is_healthy = False
            if provider:
                try:
                    is_healthy = await asyncio.wait_for(provider.health_check(), timeout=5.0)
                except asyncio.TimeoutError:
                    is_healthy = False
                except Exception:
                    is_healthy = False

            result.append(
                {
                    "name": name,
                    "backend": config.backend.value,
                    "path": config.path,
                    "ttl": int(config.ttl.total_seconds()),
                    "is_active": config.is_active,
                    "is_healthy": is_healthy,
                }
            )
        return result

    async def health_check(self) -> dict:
        """Check health of all credential backends."""
        results = {}
        for name, provider in self._providers.items():
            try:
                is_healthy = await asyncio.wait_for(provider.health_check(), timeout=5.0)
                results[name] = {"healthy": is_healthy}
            except asyncio.TimeoutError:
                results[name] = {"healthy": False, "error": "timeout"}
            except Exception as e:
                results[name] = {"healthy": False, "error": str(e)}
        return results


_brokers: dict[str, CredentialBroker] = {}


def get_credential_broker(namespace: str = "default") -> CredentialBroker:
    normalized_namespace = CredentialBroker._normalize_namespace(namespace)
    if normalized_namespace not in _brokers:
        _brokers[normalized_namespace] = CredentialBroker(namespace=normalized_namespace)
    return _brokers[normalized_namespace]
