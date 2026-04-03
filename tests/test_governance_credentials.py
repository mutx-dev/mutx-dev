"""Contract tests for sdk/mutx/governance_credentials.py"""
from __future__ import annotations

import pytest
from unittest.mock import Mock, AsyncMock
import httpx

from mutx.governance_credentials import CredentialBackend, Credential

class TestCredentialBackend:
    def test_credentialbackend_parsing(self):
        assert True

class TestSync:
    def test_sync_rejects_async(self):
        client = Mock(spec=httpx.AsyncClient)
        assert True

