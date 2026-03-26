import json

import pytest

from src.api.services.credential_broker import CredentialBackend, CredentialBroker


@pytest.mark.asyncio
async def test_credential_broker_encrypts_backend_config_at_rest(monkeypatch, tmp_path):
    mutx_home = tmp_path / ".mutx"
    monkeypatch.setenv("MUTX_HOME", str(mutx_home))

    broker = CredentialBroker()
    await broker.register_backend(
        name="vault-prod",
        backend=CredentialBackend.VAULT,
        path="secret/prod",
        config={"url": "https://vault.example", "token": "super-secret"},
    )

    config_file = mutx_home / "credential_broker" / "backends.json"
    persisted = json.loads(config_file.read_text())
    namespace_payload = persisted["namespaces"]["default"]

    assert "config" not in namespace_payload["vault-prod"]
    assert namespace_payload["vault-prod"]["config_encrypted"].startswith("enc:")
    assert "super-secret" not in config_file.read_text()


def test_credential_broker_loads_and_rewrites_legacy_plaintext_config(monkeypatch, tmp_path):
    mutx_home = tmp_path / ".mutx"
    config_dir = mutx_home / "credential_broker"
    config_dir.mkdir(parents=True)
    config_file = config_dir / "backends.json"
    config_file.write_text(
        json.dumps(
            {
                "vault-legacy": {
                    "backend": "vault",
                    "path": "secret/legacy",
                    "ttl": 900,
                    "config": {
                        "url": "https://vault.example",
                        "token": "legacy-secret",
                    },
                    "is_active": True,
                }
            }
        )
    )
    monkeypatch.setenv("MUTX_HOME", str(mutx_home))

    broker = CredentialBroker()

    assert broker._backends["vault-legacy"].config == {
        "url": "https://vault.example",
        "token": "legacy-secret",
    }

    rewritten = json.loads(config_file.read_text())
    namespaces = rewritten["namespaces"]
    assert "default" in namespaces
    assert "config" not in namespaces["default"]["vault-legacy"]
    assert namespaces["default"]["vault-legacy"]["config_encrypted"].startswith("enc:")
    assert "legacy-secret" not in config_file.read_text()


@pytest.mark.asyncio
async def test_credential_broker_persists_backends_per_namespace(monkeypatch, tmp_path):
    mutx_home = tmp_path / ".mutx"
    monkeypatch.setenv("MUTX_HOME", str(mutx_home))

    broker_one = CredentialBroker(namespace="internal-user-1")
    broker_two = CredentialBroker(namespace="internal-user-2")

    await broker_one.register_backend(
        name="vault-prod",
        backend=CredentialBackend.VAULT,
        path="secret/prod",
        config={"url": "https://vault.example", "token": "secret-one"},
    )
    await broker_two.register_backend(
        name="vault-dev",
        backend=CredentialBackend.VAULT,
        path="secret/dev",
        config={"url": "https://vault.example", "token": "secret-two"},
    )

    reloaded_one = CredentialBroker(namespace="internal-user-1")
    reloaded_two = CredentialBroker(namespace="internal-user-2")

    assert set(reloaded_one._backends.keys()) == {"vault-prod"}
    assert set(reloaded_two._backends.keys()) == {"vault-dev"}

    persisted = json.loads((mutx_home / "credential_broker" / "backends.json").read_text())
    assert set(persisted["namespaces"].keys()) == {"internal-user-1", "internal-user-2"}
