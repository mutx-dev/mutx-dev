"""
Unit tests for the APIKey and APIKeyWithSecret data classes in sdk/mutx/api_keys.py.

These tests cover:
- APIKey initialization from dict (required + optional fields)
- APIKeyWithSecret initialization
- repr formatting
- is_active flag handling
- expires_at / last_used None handling
"""

from __future__ import annotations

import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sdk"))

from mutx.api_keys import APIKey, APIKeyWithSecret


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _api_key_payload(**overrides: Any) -> dict[str, Any]:
    """Minimal valid payload for APIKey — only required fields present."""
    payload = {
        "id": str(uuid.UUID("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d")),
        "name": "test-key",
        "is_active": True,
        "last_used": None,
        "created_at": "2026-03-12T09:00:00",
        "expires_at": None,
    }
    payload.update(overrides)
    return payload


def _api_key_with_secret_payload(**overrides: Any) -> dict[str, Any]:
    """Valid payload for APIKeyWithSecret (includes the plain `key` field)."""
    payload = _api_key_payload(
        key="mutx_sk_test_" + str(uuid.uuid4()).replace("-", "")[:32],
    )
    # _api_key_payload doesn't include `key`; overlay it so update works
    payload["key"] = "mutx_sk_test_" + str(uuid.uuid4()).replace("-", "")[:32]
    payload.update(overrides)
    # re-override key in case overrides touched it
    if "key" not in overrides:
        pass
    return payload


# ---------------------------------------------------------------------------
# APIKey — required fields
# ---------------------------------------------------------------------------

class TestAPIKeyRequiredFields:
    def test_id_is_parsed_as_uuid(self) -> None:
        key = APIKey(_api_key_payload())
        assert isinstance(key.id, uuid.UUID)

    def test_name_is_set(self) -> None:
        key = APIKey(_api_key_payload(name="my-key"))
        assert key.name == "my-key"

    def test_created_at_is_parsed_as_datetime(self) -> None:
        key = APIKey(_api_key_payload())
        assert isinstance(key.created_at, datetime)
        assert key.created_at.year == 2026
        assert key.created_at.month == 3
        assert key.created_at.day == 12


# ---------------------------------------------------------------------------
# APIKey — optional fields (None defaults)
# ---------------------------------------------------------------------------

class TestAPIKeyOptionalFieldsNone:
    def test_is_active_defaults_true_when_missing(self) -> None:
        payload = _api_key_payload()
        del payload["is_active"]
        key = APIKey(payload)
        assert key.is_active is True

    def test_last_used_is_none_when_missing(self) -> None:
        key = APIKey(_api_key_payload())
        assert key.last_used is None

    def test_last_used_is_none_when_explicit_null(self) -> None:
        key = APIKey(_api_key_payload(last_used=None))
        assert key.last_used is None

    def test_expires_at_is_none_when_missing(self) -> None:
        key = APIKey(_api_key_payload())
        assert key.expires_at is None

    def test_expires_at_is_none_when_explicit_null(self) -> None:
        key = APIKey(_api_key_payload(expires_at=None))
        assert key.expires_at is None


# ---------------------------------------------------------------------------
# APIKey — optional fields (non-None values)
# ---------------------------------------------------------------------------

class TestAPIKeyOptionalFieldsPopulated:
    def test_is_active_false_when_set(self) -> None:
        key = APIKey(_api_key_payload(is_active=False))
        assert key.is_active is False

    def test_last_used_parsed_from_iso_string(self) -> None:
        key = APIKey(_api_key_payload(last_used="2026-04-01T14:30:00"))
        assert key.last_used is not None
        assert key.last_used.year == 2026
        assert key.last_used.month == 4
        assert key.last_used.day == 1

    def test_expires_at_parsed_from_iso_string(self) -> None:
        key = APIKey(_api_key_payload(expires_at="2026-12-31T23:59:59"))
        assert key.expires_at is not None
        assert key.expires_at.year == 2026
        assert key.expires_at.month == 12
        assert key.expires_at.day == 31


# ---------------------------------------------------------------------------
# APIKey — repr
# ---------------------------------------------------------------------------

class TestAPIKeyRepr:
    def test_repr_contains_id_name_and_active(self) -> None:
        key = APIKey(_api_key_payload(id=str(uuid.UUID("b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e")), name="repr-key", is_active=True))
        r = repr(key)
        assert "APIKey" in r
        assert "repr-key" in r
        assert "active=True" in r

    def test_repr_shows_false_when_inactive(self) -> None:
        key = APIKey(_api_key_payload(is_active=False))
        r = repr(key)
        assert "active=False" in r


# ---------------------------------------------------------------------------
# APIKeyWithSecret
# ---------------------------------------------------------------------------

class TestAPIKeyWithSecretInit:
    def test_key_field_is_extracted(self) -> None:
        key = APIKeyWithSecret(_api_key_with_secret_payload())
        assert hasattr(key, "key")
        assert key.key.startswith("mutx_sk_test_")

    def test_inherits_api_key_fields(self) -> None:
        key = APIKeyWithSecret(_api_key_with_secret_payload(name="inherited-key"))
        assert key.name == "inherited-key"
        assert isinstance(key.id, uuid.UUID)

    def test_created_at_inherited_and_parsed(self) -> None:
        key = APIKeyWithSecret(_api_key_with_secret_payload())
        assert isinstance(key.created_at, datetime)

    def test_last_used_none_inherited(self) -> None:
        key = APIKeyWithSecret(_api_key_with_secret_payload())
        assert key.last_used is None

    def test_expires_at_none_inherited(self) -> None:
        key = APIKeyWithSecret(_api_key_with_secret_payload())
        assert key.expires_at is None

    def test_is_active_inherited(self) -> None:
        key = APIKeyWithSecret(_api_key_with_secret_payload(is_active=False))
        assert key.is_active is False


# ---------------------------------------------------------------------------
# APIKeyWithSecret — repr
# ---------------------------------------------------------------------------

class TestAPIKeyWithSecretRepr:
    def test_repr_contains_api_key_with_secret_name(self) -> None:
        key = APIKeyWithSecret(_api_key_with_secret_payload(name="secret-key"))
        r = repr(key)
        assert "APIKeyWithSecret" in r
        assert "secret-key" in r

    def test_repr_truncates_long_key(self) -> None:
        long_key = "mutx_sk_test_" + "a" * 64
        key = APIKeyWithSecret(_api_key_with_secret_payload(key=long_key))
        r = repr(key)
        # Should contain the first 16 chars + ellipsis
        assert "…" in r
        # The truncated key prefix should appear
        assert "mutx_sk_test_aa" in r or "mutx_sk_test_a" in r

    def test_repr_shows_short_key_verbatim(self) -> None:
        short_key = "mutx_sk_test_abc"
        key = APIKeyWithSecret(_api_key_with_secret_payload(key=short_key))
        r = repr(key)
        # Short key should not be truncated
        assert short_key in r
        assert "…" not in r

    def test_repr_contains_id(self) -> None:
        key = APIKeyWithSecret(_api_key_with_secret_payload())
        r = repr(key)
        assert str(key.id) in r


# ---------------------------------------------------------------------------
# is_active flag handling
# ---------------------------------------------------------------------------

class TestAPIKeyIsActive:
    @pytest.mark.parametrize("value,expected", [(True, True), (False, False)])
    def test_is_active_parametric(self, value: bool, expected: bool) -> None:
        key = APIKey(_api_key_payload(is_active=value))
        assert key.is_active is expected

    def test_is_active_missing_defaults_to_true(self) -> None:
        payload = _api_key_payload()
        del payload["is_active"]
        key = APIKey(payload)
        assert key.is_active is True


# ---------------------------------------------------------------------------
# expires_at / last_used — None vs populated
# ---------------------------------------------------------------------------

class TestAPIKeyTimestamps:
    def test_both_none(self) -> None:
        key = APIKey(_api_key_payload(last_used=None, expires_at=None))
        assert key.last_used is None
        assert key.expires_at is None

    def test_only_last_used_set(self) -> None:
        key = APIKey(_api_key_payload(last_used="2026-03-20T08:00:00", expires_at=None))
        assert key.last_used is not None
        assert key.expires_at is None

    def test_only_expires_at_set(self) -> None:
        key = APIKey(_api_key_payload(last_used=None, expires_at="2026-12-01T00:00:00"))
        assert key.last_used is None
        assert key.expires_at is not None

    def test_both_set(self) -> None:
        key = APIKey(
            _api_key_payload(
                last_used="2026-03-20T08:00:00",
                expires_at="2026-12-01T00:00:00",
            )
        )
        assert key.last_used is not None
        assert key.expires_at is not None
        assert key.last_used < key.expires_at
